from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from pathlib import Path
from typing import Optional
import os
import uuid
import time
import logging

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from auth import hash_password, verify_password, issue_token, get_current_user_id
from solana_service import (
    get_deposit_pubkey, get_sol_balance, verify_deposit_tx,
    send_sol, verify_phantom_signature,
)
from coin_service import get_live_coins
from trading_engine import (
    start_session, stop_session, get_session, session_to_public, RISK_PROFILES,
)
from chat_service import crew_chat_once

logging.basicConfig(level=logging.INFO)
log = logging.getLogger('trenchcrew')

mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ['DB_NAME']]
users_coll = db['tc_users']
txs_coll = db['tc_transactions']

app = FastAPI(title='TrenchCrew API')
api = APIRouter(prefix='/api')

# ---------- MODELS ----------
class SignupBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class PhantomLoginBody(BaseModel):
    pubkey: str
    signature: str  # base58
    message: str

class StartTradingBody(BaseModel):
    risk: str = 'balanced'

class ChatBody(BaseModel):
    session_id: Optional[str] = None
    text: str

class VerifyDepositBody(BaseModel):
    tx_signature: str

class WithdrawBody(BaseModel):
    destination: str
    amount_sol: float

# ---------- HELPERS ----------
async def _get_user(user_id: str) -> dict:
    user = await users_coll.find_one({'id': user_id})
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user


def _public_user(u: dict) -> dict:
    return {
        'id': u['id'],
        'email': u.get('email'),
        'auth_method': u.get('auth_method'),
        'phantom_pubkey': u.get('phantom_pubkey'),
        'balance_sol': float(u.get('balance_sol', 0.0)),
        'total_deposited': float(u.get('total_deposited', 0.0)),
        'total_withdrawn': float(u.get('total_withdrawn', 0.0)),
        'profit_sol': float(u.get('profit_sol', 0.0)),
        'created_at': u.get('created_at'),
    }

# ---------- ROUTES ----------
@api.get('/')
async def root():
    return {'ok': True, 'service': 'TrenchCrew'}

@api.get('/health')
async def health():
    return {'ok': True, 'ts': time.time()}

@api.get('/deposit-address')
async def deposit_address():
    return {'address': get_deposit_pubkey()}

# ----- AUTH -----
@api.post('/auth/signup')
async def signup(body: SignupBody):
    existing = await users_coll.find_one({'email': body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    user_id = str(uuid.uuid4())
    user = {
        'id': user_id,
        'email': body.email.lower(),
        'password_hash': hash_password(body.password),
        'auth_method': 'email',
        'phantom_pubkey': None,
        'balance_sol': 0.0,
        'total_deposited': 0.0,
        'total_withdrawn': 0.0,
        'profit_sol': 0.0,
        'created_at': time.time(),
    }
    await users_coll.insert_one(user)
    return {'token': issue_token(user_id), 'user': _public_user(user)}

@api.post('/auth/login')
async def login(body: LoginBody):
    user = await users_coll.find_one({'email': body.email.lower()})
    if not user or not user.get('password_hash') or not verify_password(body.password, user['password_hash']):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    return {'token': issue_token(user['id']), 'user': _public_user(user)}

@api.post('/auth/phantom')
async def phantom_login(body: PhantomLoginBody):
    if not verify_phantom_signature(body.message, body.signature, body.pubkey):
        raise HTTPException(status_code=401, detail='Signature verification failed')
    user = await users_coll.find_one({'phantom_pubkey': body.pubkey})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            'id': user_id,
            'email': None,
            'password_hash': None,
            'auth_method': 'phantom',
            'phantom_pubkey': body.pubkey,
            'balance_sol': 0.0,
            'total_deposited': 0.0,
            'total_withdrawn': 0.0,
            'profit_sol': 0.0,
            'created_at': time.time(),
        }
        await users_coll.insert_one(user)
    return {'token': issue_token(user['id']), 'user': _public_user(user)}

@api.get('/me')
async def me(user_id: str = Depends(get_current_user_id)):
    user = await _get_user(user_id)
    # Attach engine session if running
    sess = get_session(user_id)
    return {'user': _public_user(user), 'session': session_to_public(sess) if sess else None}

# ----- DEPOSITS -----
@api.post('/deposit/verify')
async def deposit_verify(body: VerifyDepositBody, user_id: str = Depends(get_current_user_id)):
    # Ensure this tx signature wasn't used before by anyone
    seen = await txs_coll.find_one({'signature': body.tx_signature})
    if seen:
        raise HTTPException(status_code=400, detail='This transaction has already been credited')
    user = await _get_user(user_id)
    # If user is phantom, enforce source == their pubkey
    expected_from = user.get('phantom_pubkey')
    result = await verify_deposit_tx(body.tx_signature, expected_from)
    if not result.get('ok'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Verification failed'))
    amount = float(result['amount_sol'])
    # Credit user
    new_balance = float(user.get('balance_sol', 0.0)) + amount
    new_total = float(user.get('total_deposited', 0.0)) + amount
    await users_coll.update_one({'id': user_id}, {'$set': {'balance_sol': new_balance, 'total_deposited': new_total}})
    await txs_coll.insert_one({
        'id': str(uuid.uuid4()), 'user_id': user_id, 'kind': 'deposit',
        'signature': body.tx_signature, 'amount_sol': amount, 'from_addr': result.get('from_addr'),
        'ts': time.time(),
    })
    fresh = await _get_user(user_id)
    return {'ok': True, 'credited_sol': amount, 'user': _public_user(fresh)}

# ----- WITHDRAW -----
@api.post('/withdraw')
async def withdraw(body: WithdrawBody, user_id: str = Depends(get_current_user_id)):
    user = await _get_user(user_id)
    bal = float(user.get('balance_sol', 0.0))
    if body.amount_sol <= 0:
        raise HTTPException(status_code=400, detail='Amount must be positive')
    if body.amount_sol > bal:
        raise HTTPException(status_code=400, detail='Insufficient balance')
    fee = body.amount_sol * 0.01
    payout = body.amount_sol - fee
    result = await send_sol(body.destination, payout)
    if not result.get('ok'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Send failed'))
    new_balance = bal - body.amount_sol
    new_total_w = float(user.get('total_withdrawn', 0.0)) + body.amount_sol
    await users_coll.update_one({'id': user_id}, {'$set': {'balance_sol': new_balance, 'total_withdrawn': new_total_w}})
    await txs_coll.insert_one({
        'id': str(uuid.uuid4()), 'user_id': user_id, 'kind': 'withdraw',
        'signature': result['signature'], 'amount_sol': body.amount_sol, 'fee_sol': fee,
        'destination': body.destination, 'ts': time.time(),
    })
    fresh = await _get_user(user_id)
    return {'ok': True, 'signature': result['signature'], 'paid_out_sol': payout, 'fee_sol': fee, 'user': _public_user(fresh)}

@api.get('/transactions')
async def transactions(user_id: str = Depends(get_current_user_id)):
    rows = await txs_coll.find({'user_id': user_id}).sort('ts', -1).to_list(100)
    for r in rows:
        r.pop('_id', None)
    return {'transactions': rows}

# ----- COINS -----
@api.get('/coins')
async def coins():
    data = await get_live_coins(limit=30)
    return {'coins': data}

# ----- TRADING ENGINE -----
@api.get('/trading/risks')
async def risks():
    return {'risks': [{'id': k, **v} for k, v in RISK_PROFILES.items()]}

@api.post('/trading/start')
async def trading_start(body: StartTradingBody, user_id: str = Depends(get_current_user_id)):
    user = await _get_user(user_id)
    bal = float(user.get('balance_sol', 0.0))
    if bal < 0.01:
        raise HTTPException(status_code=400, detail='Deposit at least 0.01 SOL to start trading')
    sess = await start_session(user_id, body.risk, bal)
    return {'session': session_to_public(sess)}

@api.post('/trading/stop')
async def trading_stop(user_id: str = Depends(get_current_user_id)):
    sess = await stop_session(user_id)
    if not sess:
        raise HTTPException(status_code=404, detail='No active session')
    # Sync user balance / profit from session
    await users_coll.update_one(
        {'id': user_id},
        {'$set': {'balance_sol': sess['current_balance'], 'profit_sol': sess['profit']}},
    )
    return {'session': session_to_public(sess)}

@api.get('/trading/state')
async def trading_state(user_id: str = Depends(get_current_user_id)):
    sess = get_session(user_id)
    if not sess:
        return {'session': None}
    # Keep user balance roughly synced on each poll
    await users_coll.update_one(
        {'id': user_id},
        {'$set': {'balance_sol': sess['current_balance'], 'profit_sol': sess['profit']}},
    )
    return {'session': session_to_public(sess)}

# ----- CHAT -----
@api.post('/chat')
async def chat(body: ChatBody, user_id: str = Depends(get_current_user_id)):
    reply = await crew_chat_once(body.session_id or user_id, body.text)
    return {'reply': reply}

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'],
)

@app.on_event('shutdown')
async def shutdown():
    mongo_client.close()
