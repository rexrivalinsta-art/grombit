from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import uuid

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

SYSTEM_PROMPT = (
    "You are CREW, the orchestrator of a cute private trading-bot team on TrenchCrew for Solana memecoins. "
    "Your crew: ScoutBot (hunts coins), SniperBot (watches entries), TraderBot (executes), LaunchBot (prepares launches). "
    "When a user asks a question or gives a command, reply in a friendly degen-but-helpful tone in 2-5 short sentences. "
    "If they ask for coin ideas, invent plausible mock trade suggestions with symbol, market cap bucket, and a one-line thesis "
    "(these are mock suggestions, NOT financial advice). Never claim certainty. Keep it crisp. Use occasional emoji like 🔥 📈 ⚡ sparingly."
)


async def crew_chat_once(session_id: str, user_text: str) -> str:
    if not EMERGENT_LLM_KEY:
        return "Chat is offline (no key). Try again later."
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id or str(uuid.uuid4()),
            system_message=SYSTEM_PROMPT,
        ).with_model('gemini', 'gemini-2.5-flash')
        resp = await chat.send_message(UserMessage(text=user_text))
        if isinstance(resp, str):
            return resp
        # If object, try text attr
        return getattr(resp, 'text', str(resp))
    except Exception as e:
        return f"CREW had a hiccup: {e}"
