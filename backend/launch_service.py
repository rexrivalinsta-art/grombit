"""Pump.fun token launch via PumpPortal's local-transaction endpoint.

Flow:
1. Client sends launch details (name, symbol, description, image URL / data, socials, initial buy)
2. Backend uploads metadata to pump.fun IPFS
3. Backend generates mint keypair, requests unsigned tx from pumpportal.fun
4. Backend signs with deposit keypair + mint keypair, sends on Solana mainnet
5. Returns mint, signature, and pump.fun URL
"""
import os
import base58
import base64
import httpx
from solders.keypair import Keypair
from solders.transaction import VersionedTransaction
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed

RPC_URL = os.environ.get('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com')
DEPOSIT_SECRET = os.environ.get('DEPOSIT_WALLET_SECRET', '')

PUMPFUN_IPFS = 'https://pump.fun/api/ipfs'
PUMPPORTAL_LOCAL_TX = 'https://pumpportal.fun/api/trade-local'

LAMPORTS_PER_SOL = 1_000_000_000


def _deposit_keypair() -> Keypair:
    return Keypair.from_bytes(base58.b58decode(DEPOSIT_SECRET))


async def upload_metadata(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    name: str,
    symbol: str,
    description: str,
    twitter: str = '',
    telegram: str = '',
    website: str = '',
    show_name: bool = True,
) -> dict:
    """Upload image + metadata to pump.fun IPFS. Returns {uri, metadata}."""
    try:
        async with httpx.AsyncClient(timeout=45.0) as c:
            files = {'file': (filename or 'image.png', file_bytes, content_type or 'image/png')}
            data = {
                'name': name,
                'symbol': symbol,
                'description': description or '',
                'twitter': twitter or '',
                'telegram': telegram or '',
                'website': website or '',
                'showName': 'true' if show_name else 'false',
            }
            r = await c.post(PUMPFUN_IPFS, files=files, data=data)
            if r.status_code != 200:
                return {'ok': False, 'error': f'IPFS upload failed ({r.status_code}): {r.text[:300]}'}
            j = r.json()
            uri = j.get('metadataUri') or j.get('metadata_uri') or j.get('uri')
            if not uri:
                return {'ok': False, 'error': f'IPFS response missing URI: {j}'}
            return {'ok': True, 'uri': uri, 'metadata': j.get('metadata') or {}}
    except Exception as e:
        return {'ok': False, 'error': f'IPFS exception: {e}'}


async def create_token(
    name: str,
    symbol: str,
    metadata_uri: str,
    initial_buy_sol: float,
    slippage_bps: int = 1000,
    priority_fee_sol: float = 0.0005,
) -> dict:
    """Create a pump.fun token and perform the dev buy. Signed server-side with deposit wallet.
    Returns {ok, mint, signature, pumpfun_url, error}
    """
    if initial_buy_sol < 0:
        return {'ok': False, 'error': 'initial_buy_sol must be >= 0'}
    try:
        payer = _deposit_keypair()
        mint = Keypair()
        payload = {
            'publicKey': str(payer.pubkey()),
            'action': 'create',
            'tokenMetadata': {
                'name': name,
                'symbol': symbol,
                'uri': metadata_uri,
            },
            'mint': str(mint.pubkey()),
            'denominatedInSol': 'true',
            'amount': float(initial_buy_sol),
            'slippage': int(slippage_bps / 100),  # pumpportal expects percent (10 = 10%)
            'priorityFee': float(priority_fee_sol),
            'pool': 'pump',
        }
        async with httpx.AsyncClient(timeout=45.0) as c:
            r = await c.post(PUMPPORTAL_LOCAL_TX, json=payload)
            if r.status_code != 200:
                return {'ok': False, 'error': f'PumpPortal error ({r.status_code}): {r.text[:300]}'}
            tx_bytes = r.content
            if not tx_bytes:
                return {'ok': False, 'error': 'Empty transaction from PumpPortal'}

        # Deserialize, sign with both payer + mint
        vtx = VersionedTransaction.from_bytes(tx_bytes)
        # Sign with deposit payer AND the mint keypair (pump.fun requires mint signer)
        signed = VersionedTransaction(vtx.message, [payer, mint])

        async with AsyncClient(RPC_URL) as rpc:
            # Preflight balance check
            bal = await rpc.get_balance(payer.pubkey(), commitment=Confirmed)
            lamports = bal.value if hasattr(bal, 'value') else 0
            needed = int((initial_buy_sol + priority_fee_sol + 0.02) * LAMPORTS_PER_SOL)
            if lamports < needed:
                return {'ok': False, 'error': f'Crew wallet underfunded on-chain: has {lamports/LAMPORTS_PER_SOL:.4f} SOL, needs ~{needed/LAMPORTS_PER_SOL:.4f} SOL'}

            opts = {'skip_preflight': False, 'preflight_commitment': Confirmed, 'max_retries': 3}
            send_resp = await rpc.send_raw_transaction(bytes(signed))
            sig = str(send_resp.value) if hasattr(send_resp, 'value') else str(send_resp)

        mint_pubkey = str(mint.pubkey())
        return {
            'ok': True,
            'mint': mint_pubkey,
            'signature': sig,
            'pumpfun_url': f'https://pump.fun/coin/{mint_pubkey}',
            'solscan_tx': f'https://solscan.io/tx/{sig}',
        }
    except Exception as e:
        return {'ok': False, 'error': f'Launch failed: {e}'}
