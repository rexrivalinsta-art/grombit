import httpx
import asyncio
import time
import random

_cache = {'coins': [], 'ts': 0}
CACHE_TTL = 45  # seconds

WSOL_ADDRESS = 'So11111111111111111111111111111111111111112'
STABLES = {'USDC', 'USDT', 'USD', 'SOL', 'WSOL', 'BUSD', 'DAI', 'USDH'}

FALLBACK_COINS = [
    {'symbol': 'POPCAT', 'name': 'Popcat', 'market_cap': 420000000, 'change_24h': 12.4, 'price_usd': 0.42, 'volume_24h': 24000000},
    {'symbol': 'WIF', 'name': 'dogwifhat', 'market_cap': 1800000000, 'change_24h': 4.2, 'price_usd': 1.82, 'volume_24h': 85000000},
    {'symbol': 'BONK', 'name': 'Bonk', 'market_cap': 2100000000, 'change_24h': -1.8, 'price_usd': 0.000031, 'volume_24h': 95000000},
    {'symbol': 'MEW', 'name': 'cat in a dogs world', 'market_cap': 320000000, 'change_24h': 8.9, 'price_usd': 0.0035, 'volume_24h': 18000000},
    {'symbol': 'PNUT', 'name': 'Peanut the Squirrel', 'market_cap': 180000000, 'change_24h': 22.3, 'price_usd': 0.18, 'volume_24h': 42000000},
    {'symbol': 'GOAT', 'name': 'Goatseus Maximus', 'market_cap': 650000000, 'change_24h': -3.4, 'price_usd': 0.65, 'volume_24h': 31000000},
    {'symbol': 'FARTCOIN', 'name': 'Fartcoin', 'market_cap': 450000000, 'change_24h': 15.6, 'price_usd': 0.45, 'volume_24h': 28000000},
    {'symbol': 'MOODENG', 'name': 'Moo Deng', 'market_cap': 220000000, 'change_24h': 6.1, 'price_usd': 0.22, 'volume_24h': 15000000},
]


def _normalize_pair(p: dict) -> dict | None:
    if p.get('chainId') != 'solana':
        return None
    base = p.get('baseToken', {}) or {}
    sym = (base.get('symbol') or '').upper().strip()
    addr = base.get('address')
    if not sym or not addr or addr == WSOL_ADDRESS or sym in STABLES:
        return None
    try:
        price = float(p.get('priceUsd') or 0)
    except Exception:
        price = 0
    try:
        change = float((p.get('priceChange') or {}).get('h24') or 0)
    except Exception:
        change = 0
    fdv = p.get('fdv') or p.get('marketCap') or 0
    vol = (p.get('volume') or {}).get('h24') or 0
    if price <= 0:
        return None
    return {
        'symbol': sym,
        'name': base.get('name') or sym,
        'address': addr,
        'price_usd': price,
        'change_24h': change,
        'market_cap': int(fdv) if fdv else 0,
        'volume_24h': int(vol) if vol else 0,
        'url': p.get('url'),
    }


async def _fetch_boosts() -> list:
    """DexScreener boosted/trending Solana tokens."""
    try:
        async with httpx.AsyncClient(timeout=12.0) as c:
            r = await c.get('https://api.dexscreener.com/token-boosts/top/v1')
            if r.status_code != 200:
                return []
            data = r.json() or []
            sol = [t for t in data if t.get('chainId') == 'solana'][:25]
            if not sol:
                return []
            addrs = ','.join(t['tokenAddress'] for t in sol if t.get('tokenAddress'))
            r2 = await c.get(f'https://api.dexscreener.com/latest/dex/tokens/{addrs}')
            if r2.status_code != 200:
                return []
            pairs = (r2.json() or {}).get('pairs', []) or []
            seen = set()
            out = []
            for p in pairs:
                n = _normalize_pair(p)
                if not n or n['address'] in seen:
                    continue
                seen.add(n['address'])
                out.append(n)
            # Sort by volume desc
            out.sort(key=lambda x: x.get('volume_24h', 0), reverse=True)
            return out
    except Exception:
        return []


async def _fetch_search(query: str) -> list:
    """DexScreener search endpoint."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(f'https://api.dexscreener.com/latest/dex/search?q={query}')
            if r.status_code != 200:
                return []
            pairs = (r.json() or {}).get('pairs', []) or []
            seen = set()
            out = []
            for p in pairs[:80]:
                n = _normalize_pair(p)
                if not n or n['address'] in seen:
                    continue
                seen.add(n['address'])
                out.append(n)
            out.sort(key=lambda x: x.get('volume_24h', 0), reverse=True)
            return out
    except Exception:
        return []


async def _fetch_pumpfun() -> list:
    """Pump.fun recent coins (public endpoint)."""
    try:
        async with httpx.AsyncClient(timeout=10.0, headers={'User-Agent': 'Mozilla/5.0'}) as c:
            r = await c.get('https://frontend-api-v3.pump.fun/coins?offset=0&limit=30&sort=market_cap&order=DESC&includeNsfw=false')
            if r.status_code != 200:
                return []
            data = r.json() or []
            out = []
            for coin in data[:30]:
                sym = (coin.get('symbol') or '').upper().strip()
                if not sym or sym in STABLES:
                    continue
                mc_usd = coin.get('usd_market_cap') or 0
                out.append({
                    'symbol': sym,
                    'name': coin.get('name') or sym,
                    'address': coin.get('mint'),
                    'price_usd': 0.0,
                    'change_24h': 0.0,
                    'market_cap': int(mc_usd),
                    'volume_24h': 0,
                    'url': f"https://pump.fun/coin/{coin.get('mint')}" if coin.get('mint') else None,
                })
            return out
    except Exception:
        return []


async def get_live_coins(limit: int = 40) -> list:
    now = time.time()
    if _cache['coins'] and (now - _cache['ts']) < CACHE_TTL:
        return _cache['coins'][:limit]
    boosts, memes, pump = await asyncio.gather(
        _fetch_boosts(),
        _fetch_search('solana%20meme'),
        _fetch_pumpfun(),
    )
    seen = set()
    merged = []
    # Boosted first (highest signal), then meme search, then pump.fun new
    for src in (boosts, memes, pump):
        for c in src:
            key = c.get('address') or c.get('symbol')
            if not key or key in seen:
                continue
            seen.add(key)
            merged.append(c)
    if not merged:
        merged = FALLBACK_COINS
    _cache['coins'] = merged
    _cache['ts'] = now
    return merged[:limit]


async def pick_random_coins(n: int = 5) -> list:
    coins = await get_live_coins(limit=40)
    if not coins:
        return []
    # Weight picks toward higher volume (first 20) but allow some wildcards
    pool = coins[:20] + random.sample(coins, min(len(coins), 10))
    pool = list({c['symbol']: c for c in pool}.values())
    return random.sample(pool, min(n, len(pool)))
