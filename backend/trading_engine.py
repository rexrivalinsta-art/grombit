import asyncio
import random
import time
import uuid
from typing import Dict, List, Optional
from coin_service import pick_random_coins

# In-memory per-user trading sessions. OK for MVP.
_sessions: Dict[str, dict] = {}

RISK_PROFILES = {
    'conservative': {'label': 'Conservative', 'max_trade_pct': 0.02, 'win_rate': 0.68, 'variance': 0.015, 'interval': (18, 32)},
    'balanced':     {'label': 'Balanced',     'max_trade_pct': 0.05, 'win_rate': 0.58, 'variance': 0.04,  'interval': (10, 22)},
    'degen':        {'label': 'Degen',        'max_trade_pct': 0.12, 'win_rate': 0.52, 'variance': 0.10,  'interval': (5, 14)},
}

MAX_RUN_SECONDS = 60 * 60  # 1 hour auto-stop


def get_session(user_id: str) -> Optional[dict]:
    return _sessions.get(user_id)


async def start_session(user_id: str, risk: str, starting_balance_sol: float):
    if risk not in RISK_PROFILES:
        risk = 'balanced'
    existing = _sessions.get(user_id)
    if existing and existing.get('running'):
        return existing
    session = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'risk': risk,
        'running': True,
        'started_at': time.time(),
        'starting_balance': starting_balance_sol,
        'current_balance': starting_balance_sol,
        'profit': 0.0,
        'floor_balance': starting_balance_sol * 0.5,
        'ceiling_balance': starting_balance_sol * 1.8,
        'trades': [],  # list of trade dicts
        'logs': [],    # list of log line dicts
        'wins': 0,
        'losses': 0,
    }
    _sessions[user_id] = session
    _log(session, 'system', f"Trading engine online · risk={RISK_PROFILES[risk]['label']}")
    _log(session, 'system', f"Starting balance: {starting_balance_sol:.4f} SOL")
    task = asyncio.create_task(_run_loop(user_id))
    session['_task'] = task
    return session


async def stop_session(user_id: str):
    s = _sessions.get(user_id)
    if not s:
        return None
    s['running'] = False
    _log(s, 'system', 'Stop requested. Closing out open watches...')
    await asyncio.sleep(0.1)
    _log(s, 'system', 'Trading engine safely stopped.')
    return s


def _log(session: dict, kind: str, text: str):
    session['logs'].append({'id': str(uuid.uuid4()), 'ts': time.time(), 'kind': kind, 'text': text})
    if len(session['logs']) > 400:
        session['logs'] = session['logs'][-400:]


def _format_coin_mc(mc: int) -> str:
    if mc >= 1_000_000_000:
        return f"${mc/1_000_000_000:.2f}B"
    if mc >= 1_000_000:
        return f"${mc/1_000_000:.1f}M"
    if mc >= 1_000:
        return f"${mc/1_000:.1f}K"
    return f"${mc}"


async def _run_loop(user_id: str):
    s = _sessions.get(user_id)
    if not s:
        return
    profile = RISK_PROFILES[s['risk']]
    try:
        while s['running']:
            # Auto-stop after 1 hour
            if time.time() - s['started_at'] > MAX_RUN_SECONDS:
                _log(s, 'system', '1 hour runtime reached. Auto-stopping.')
                s['running'] = False
                break

            _log(s, 'scan', 'ScoutBot scanning Solana memecoin markets...')
            await asyncio.sleep(1.5)

            coins = await pick_random_coins(5)
            if not coins:
                _log(s, 'warn', 'No live coins available right now. Retrying...')
                await asyncio.sleep(5)
                continue

            _log(s, 'scan', f"Found {len(coins)} candidate pairs · running checks")
            for c in coins:
                mc = c.get('market_cap', 0)
                _log(s, 'coin', f"{c['symbol']}  ·  MC {_format_coin_mc(mc)}  ·  checking liquidity & holders")
                await asyncio.sleep(0.4)

            # Pick 1-2 coins to "trade"
            picks = random.sample(coins, k=min(len(coins), random.choice([1, 1, 2])))
            for coin in picks:
                if not s['running']:
                    break
                _log(s, 'entry', f"SniperBot entry condition hit on {coin['symbol']}")
                await asyncio.sleep(0.6)

                # Determine trade size
                size_pct = random.uniform(profile['max_trade_pct'] * 0.3, profile['max_trade_pct'])
                size_sol = round(s['current_balance'] * size_pct, 4)
                size_sol = max(size_sol, 0.001)
                _log(s, 'trade', f"TraderBot opening {size_sol} SOL into {coin['symbol']}")
                await asyncio.sleep(random.uniform(1.2, 2.6))

                # Determine outcome respecting floor/ceiling
                win = random.random() < profile['win_rate']
                # Steer back toward middle if hitting edges
                if s['current_balance'] <= s['floor_balance'] * 1.1:
                    win = True
                elif s['current_balance'] >= s['ceiling_balance'] * 0.95:
                    win = False

                pct = random.uniform(0.005, profile['variance'])
                delta = size_sol * pct if win else -size_sol * pct
                # Occasionally oversized winner for excitement
                if win and random.random() < 0.15:
                    delta *= random.uniform(1.5, 3.0)

                new_balance = s['current_balance'] + delta
                # Enforce floor as a hard safety net
                if new_balance < s['floor_balance']:
                    new_balance = s['floor_balance'] + abs(delta) * 0.5
                    win = True
                    delta = new_balance - s['current_balance']

                s['current_balance'] = round(new_balance, 6)
                s['profit'] = round(s['current_balance'] - s['starting_balance'], 6)
                if win:
                    s['wins'] += 1
                else:
                    s['losses'] += 1

                trade = {
                    'id': str(uuid.uuid4()),
                    'ts': time.time(),
                    'symbol': coin['symbol'],
                    'name': coin.get('name'),
                    'address': coin.get('address'),
                    'size_sol': size_sol,
                    'pnl_sol': round(delta, 6),
                    'pnl_pct': round(pct * (1 if win else -1) * 100, 2),
                    'win': win,
                    'balance_after': s['current_balance'],
                }
                s['trades'].insert(0, trade)
                if len(s['trades']) > 200:
                    s['trades'] = s['trades'][:200]

                if win:
                    _log(s, 'win', f"✓ {coin['symbol']} closed +{delta:.4f} SOL ({trade['pnl_pct']}%)  ·  bal {s['current_balance']:.4f}")
                else:
                    _log(s, 'loss', f"✗ {coin['symbol']} closed {delta:.4f} SOL ({trade['pnl_pct']}%)  ·  bal {s['current_balance']:.4f}")

                await asyncio.sleep(random.uniform(0.5, 1.5))

            # Idle between rounds
            wait = random.uniform(*profile['interval'])
            _log(s, 'idle', f"Crew idle for {wait:.0f}s · waiting for next setup")
            # Sleep in short slices so stop responds fast
            slept = 0
            while slept < wait and s['running']:
                await asyncio.sleep(0.5)
                slept += 0.5
    except asyncio.CancelledError:
        _log(s, 'system', 'Session cancelled.')
    except Exception as e:
        _log(s, 'error', f'Engine error: {e}')
        s['running'] = False


def session_to_public(s: dict) -> dict:
    return {
        'id': s['id'],
        'risk': s['risk'],
        'running': s['running'],
        'started_at': s['started_at'],
        'starting_balance': s['starting_balance'],
        'current_balance': s['current_balance'],
        'profit': s['profit'],
        'wins': s['wins'],
        'losses': s['losses'],
        'trades': s['trades'][:50],
        'logs': s['logs'][-120:],
    }
