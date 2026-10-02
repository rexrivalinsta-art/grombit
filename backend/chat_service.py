from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import uuid
from coin_service import get_live_coins

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


def _fmt_mc(mc: int) -> str:
    if not mc:
        return 'n/a'
    if mc >= 1_000_000_000:
        return f"${mc/1_000_000_000:.2f}B"
    if mc >= 1_000_000:
        return f"${mc/1_000_000:.1f}M"
    if mc >= 1_000:
        return f"${mc/1_000:.1f}K"
    return f"${mc}"


async def _build_live_context() -> str:
    try:
        coins = await get_live_coins(limit=25)
    except Exception:
        coins = []
    if not coins:
        return 'No live pairs available right now.'
    rows = []
    for c in coins[:20]:
        chg = c.get('change_24h') or 0
        price = c.get('price_usd') or 0
        mc = c.get('market_cap') or 0
        vol = c.get('volume_24h') or 0
        rows.append(
            f"- {c.get('symbol')} ({c.get('name')}) | mc={_fmt_mc(mc)} | 24h={chg:+.1f}% | px=${price:.6f} | vol24h={_fmt_mc(vol)}"
        )
    return "\n".join(rows)


# Cosmetic "model" personas. All route to the same underlying LLM, just steer tone slightly.
MODEL_PERSONAS = {
    'crew-core':    'You are running on the TrenchCrew Core engine (standard tier).',
    'grok-bot-v4':  'You are running on Grok Bot v4 (irreverent, blunt). Keep answers slightly more punchy and confident while staying technical.',
    'jev-typesafe': 'You are running on Jev TypeSafe (structured, strict). Return clean bullet lists; be deterministic and precise.',
    'dot-reasoner': 'You are running on Dot Reasoner Pro (thorough). Add a 1-line "edge:" rationale after each pick when relevant.',
    'nebula-3':     'You are running on Nebula 3 (concise). Keep every answer to 3 lines or fewer.',
    'vista-ultra':  'You are running on Vista Ultra (premium analyst). Use slightly more formal institutional-trader phrasing.',
    'astra-6':      'You are running on Astra 6 (balanced flagship). Default style.',
    'omega-mix':    'You are running on Omega Mix (contrarian). Flag at least one risk or counter-case per response.',
}


SYSTEM_PROMPT_TEMPLATE = (
    "You are CREW, the autonomous orchestrator of a private trading desk on TrenchCrew for Solana memecoins. "
    "{persona} "
    "Your tone is professional, technical and concise — like a senior quant trader briefing a desk. No slang, no 'fren', no 'bro'. "
    "You coordinate four specialists: ScoutBot (sources pairs), SniperBot (entry logic), TraderBot (execution + exits), LaunchBot (token launches). "
    "You are connected to live Solana market data (Pump.fun + DexScreener). Below is the current market snapshot you just pulled; "
    "ALWAYS reference these real tickers and figures when answering. Never say the word 'mock' or 'simulated' or 'fake'. "
    "Never claim certainty on price direction; frame picks as setups and candidates. Keep replies tight: 3-6 lines, use bullet points when listing. "
    "Avoid emoji except at most one subtle marker. Use USD market cap buckets (micro <$1M, low $1M-$10M, mid $10M-$100M, large $100M+).\n\n"
    "LIVE MARKET SNAPSHOT (do not invent tickers, only use these):\n{live}\n\n"
    "If the user asks something unrelated to trading, answer briefly and steer back to the desk."
)


async def crew_chat_once(session_id: str, user_text: str, model: str = None) -> str:
    if not EMERGENT_LLM_KEY:
        return "Desk offline. Reconnect shortly."
    try:
        live = await _build_live_context()
        persona = MODEL_PERSONAS.get(model or 'crew-core', MODEL_PERSONAS['crew-core'])
        system = SYSTEM_PROMPT_TEMPLATE.format(persona=persona, live=live)
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or str(uuid.uuid4()),
            system_message=system,
        ).with_model('gemini', 'gemini-2.5-flash')
        resp = await chat.send_message(UserMessage(text=user_text))
        if isinstance(resp, str):
            return resp
        return getattr(resp, 'text', str(resp))
    except Exception as e:
        return f"Desk link error: {e}"
