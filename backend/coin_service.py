import httpx
import asyncio
import time
import random

_cache = {'coins': [], 'ts': 0}
CACHE_TTL = 60  # seconds

FALLBACK_COINS = [
    {'symbol': 'POPCAT', 'name': 'Popcat', 'market_cap': 420000000, 'change_24h': 12.4, 'price_usd': 0.42},
    {'symbol': 'WIF', 'name': 'dogwifhat', 'market_cap': 1800000000, 'change_24h': 4.2, 'price_usd': 1.82},
    {'symbol': 'BONK', 'name': 'Bonk', 'market_cap': 2100000000, 'change_24h': -1.8, 'price_usd': 0.000031},
    {'symbol': 'MEW', 'name': 'cat in a dogs world', 'market_cap': 320000000, 'change_24h': 8.9, 'price_usd': 0.0035},
    {'symbol': 'PNUT', 'name': 'Peanut', 'market_cap': 180000000, 'change_24h': 22.3, 'price_usd': 0.18},
    {'symbol': 'GOAT', 'name': 'Goatseus Maximus', 'market_cap': 650000000, 'change_24h': -3.4, 'price_usd': 0.65},
    {'symbol': 'FARTCOIN', 'name': 'Fartcoin', 'market_cap': 450000000, 'change_24h': 15.6, 'price_usd': 0.45},
    {'symbol': 'MOODENG', 'name': 'Moo Deng', 'market_cap': 220000000, 'change_24h': 6.1, 'price_usd': 0.22},
]


async def _fetch_dexscreener() -> list:
    """Fetch latest Solana memecoin pairs from DexScreener (free, no key)."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            # DexScreener trending pairs on Solana
            r = await c.get('https://api.dexscreener.com/latest/dex/search?q=SOL')
            if r.status_code != 200:
                return []
            data = r.json()
            pairs = data.get('pairs', [])
            out = []
            for p in pairs[:50]:
                if p.get('chainId') != 'solana':
                    continue
                base = p.get('baseToken', {})
                price = float(p.get('priceUsd') or 0)
                change = float(p.get('priceChange', {}).get('h24') or 0)
                fdv = p.get('fdv') or p.get('marketCap') or 0
                vol = p.get('volume', {}).get('h24') or 0
                if not base.get('symbol') or price <= 0:
                    continue
                out.append({
                    'symbol': base.get('symbol'),
                    'name': base.get('name') or base.get('symbol'),
                    'address': base.get('address'),
                    'price_usd': price,
                    'change_24h': change,
                    'market_cap': int(fdv) if fdv else 0,
                    'volume_24h': int(vol) if vol else 0,
                    'url': p.get('url'),
                })
            return out
    except Exception:
        return []


async def _fetch_pumpfun() -> list:
    """Try pump.fun public endpoint for newest coins."""
    try:
        async with httpx.AsyncClient(timeout=10.0, headers={'User-Agent': 'Mozilla/5.0'}) as c:
            r = await c.get('https://frontend-api-v3.pump.fun/coins?offset=0&limit=30&sort=created_timestamp&order=DESC&includeNsfw=false')
            if r.status_code != 200:
                return []
            data = r.json()
            out = []
            for coin in data[:30]:
                sym = coin.get('symbol')
                if not sym:
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
    pump, dex = await asyncio.gather(_fetch_pumpfun(), _fetch_dexscreener())
    seen = set()
    merged = []
    for c in pump + dex:
        key = c.get('address') or c.get('symbol')
        if key in seen:
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
    return random.sample(coins, min(n, len(coins)))
