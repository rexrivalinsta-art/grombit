import os
import base58
import httpx
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.transaction import Transaction
from solders.message import Message
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed
from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError

RPC_URL = os.environ.get('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com')
DEPOSIT_PUBKEY = os.environ.get('DEPOSIT_WALLET_PUBKEY', '')
DEPOSIT_SECRET = os.environ.get('DEPOSIT_WALLET_SECRET', '')

LAMPORTS_PER_SOL = 1_000_000_000


def get_deposit_pubkey() -> str:
    return DEPOSIT_PUBKEY


def load_deposit_keypair() -> Keypair:
    secret_bytes = base58.b58decode(DEPOSIT_SECRET)
    return Keypair.from_bytes(secret_bytes)


async def get_sol_balance(pubkey_str: str) -> float:
    async with AsyncClient(RPC_URL) as c:
        pubkey = Pubkey.from_string(pubkey_str)
        resp = await c.get_balance(pubkey, commitment=Confirmed)
        lamports = resp.value if hasattr(resp, 'value') else 0
        return lamports / LAMPORTS_PER_SOL


async def verify_deposit_tx(tx_signature: str, expected_from: str = None) -> dict:
    """Verify a Solana transaction sent SOL to the deposit wallet.
    Returns {ok, amount_sol, from_addr, error}
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            body = {
                'jsonrpc': '2.0', 'id': 1,
                'method': 'getTransaction',
                'params': [tx_signature, {'maxSupportedTransactionVersion': 0, 'encoding': 'jsonParsed'}],
            }
            r = await http.post(RPC_URL, json=body)
            data = r.json()
            tx = data.get('result')
            if not tx:
                return {'ok': False, 'error': 'Transaction not found on-chain yet'}
            if tx.get('meta', {}).get('err') is not None:
                return {'ok': False, 'error': 'Transaction failed on-chain'}
            # Scan instructions for a SystemProgram transfer to DEPOSIT_PUBKEY
            instructions = tx['transaction']['message']['instructions']
            for ix in instructions:
                parsed = ix.get('parsed')
                if not parsed:
                    continue
                if parsed.get('type') == 'transfer':
                    info = parsed.get('info', {})
                    dest = info.get('destination')
                    source = info.get('source')
                    lamports = info.get('lamports', 0)
                    if dest == DEPOSIT_PUBKEY:
                        if expected_from and source != expected_from:
                            continue
                        return {
                            'ok': True,
                            'amount_sol': lamports / LAMPORTS_PER_SOL,
                            'from_addr': source,
                        }
            return {'ok': False, 'error': 'No transfer to deposit address found in this transaction'}
    except Exception as e:
        return {'ok': False, 'error': f'RPC error: {e}'}


async def send_sol(destination: str, amount_sol: float) -> dict:
    """Send SOL from the deposit wallet to a destination address."""
    try:
        kp = load_deposit_keypair()
        dest = Pubkey.from_string(destination)
        lamports = int(amount_sol * LAMPORTS_PER_SOL)
        if lamports <= 0:
            return {'ok': False, 'error': 'Amount too small'}
        async with AsyncClient(RPC_URL) as c:
            # Check sender has enough + rent/fees
            bal_resp = await c.get_balance(kp.pubkey(), commitment=Confirmed)
            bal_lamports = bal_resp.value if hasattr(bal_resp, 'value') else 0
            if bal_lamports < lamports + 10_000:  # leave a bit for fees
                return {'ok': False, 'error': 'Insufficient balance in deposit wallet'}
            blockhash_resp = await c.get_latest_blockhash()
            recent_blockhash = blockhash_resp.value.blockhash
            ix = transfer(TransferParams(from_pubkey=kp.pubkey(), to_pubkey=dest, lamports=lamports))
            msg = Message.new_with_blockhash([ix], kp.pubkey(), recent_blockhash)
            tx = Transaction([kp], msg, recent_blockhash)
            resp = await c.send_transaction(tx)
            sig = str(resp.value) if hasattr(resp, 'value') else str(resp)
            return {'ok': True, 'signature': sig}
    except Exception as e:
        return {'ok': False, 'error': f'Send failed: {e}'}


def verify_phantom_signature(message: str, signature_b58: str, pubkey_b58: str) -> bool:
    try:
        signature = base58.b58decode(signature_b58)
        pubkey_bytes = base58.b58decode(pubkey_b58)
        verify_key = VerifyKey(pubkey_bytes)
        verify_key.verify(message.encode('utf-8'), signature)
        return True
    except (BadSignatureError, Exception):
        return False
