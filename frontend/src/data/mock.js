// Mock data for TrenchCrew

export const BOTS = [
  { id: 'research', name: 'ScoutBot', tagline: 'Hunts the alpha.', img: 'https://usehotbot.com/litepaper/assets/research.svg' },
  { id: 'sniper', name: 'SniperBot', tagline: 'Watches your entries.', img: 'https://usehotbot.com/litepaper/assets/sniper.svg' },
  { id: 'crew', name: 'CREW', tagline: 'Keeps the work moving.', img: 'https://usehotbot.com/litepaper/assets/hotbot.svg', primary: true },
  { id: 'trader', name: 'TraderBot', tagline: 'Trades inside your rules.', img: 'https://usehotbot.com/litepaper/assets/trader.svg' },
  { id: 'launch', name: 'LaunchBot', tagline: 'Prepares your launch.', img: 'https://usehotbot.com/litepaper/assets/launch.svg' },
];

export const BRANDS = [
  { name: 'Pump.fun', img: 'https://usehotbot.com/icons/launchpads/pumpfun.webp' },
  { name: 'Axiom', img: 'https://usehotbot.com/hotbot/brands/axiom.png' },
  { name: 'GMGN', img: 'https://usehotbot.com/hotbot/brands/gmgn.png' },
  { name: 'Bloom', img: 'https://usehotbot.com/hotbot/brands/bloom.svg' },
  { name: 'Jupiter', img: 'https://usehotbot.com/icons/launchpads/jupiter.webp' },
  { name: 'Raydium', img: 'https://usehotbot.com/icons/launchpads/raydium.svg' },
];

export const SPECIALISTS_DETAIL = {
  CREW: {
    label: 'CREW',
    role: 'Your Strategy',
    desc: 'CREW sends Strategy matches to the right specialists, keeps the work moving, and brings you in when something needs your attention.',
    bullets: ['Multiple setups in progress', 'Findings shared between specialists', 'Your rules applied every time'],
  },
  ScoutBot: {
    label: 'ScoutBot',
    role: 'Hunts the alpha.',
    desc: 'ScoutBot checks coins that fit your Strategy and verifies holders, liquidity and trading activity before anything moves.',
    bullets: ['Fit-for-strategy coin matching', 'Holder & liquidity checks', 'Security heuristics'],
  },
  SniperBot: {
    label: 'SniperBot',
    role: 'Watches your entries.',
    desc: 'SniperBot uses the research and waits for your buying condition. You can keep looking at other setups.',
    bullets: ['Entry conditions you define', 'Patient or fast-fire modes', 'Instant handoff to TraderBot'],
  },
  TraderBot: {
    label: 'TraderBot',
    role: 'Trades inside your rules.',
    desc: 'TraderBot handles buys, reviews your positions, and follows your take-profit and exit rules.',
    bullets: ['Position & exit management', 'Trailing stops & partials', 'Never loosens your rules'],
  },
  LaunchBot: {
    label: 'LaunchBot',
    role: 'Prepares your launch.',
    desc: 'LaunchBot brings the token settings, wallet, and funding checks together for you to review and approve before launch.',
    bullets: ['Token metadata & settings', 'Funding checks', 'Approval before launch'],
  },
};

export const CHAT = [
  { role: 'you', time: '09:11 AM', text: 'Keep entries at 0.25 SOL. I want to approve each trade.' },
  { role: 'crew', time: '09:11 AM', text: 'Fresh Runners has an entry ready for your approval. Patient Entries is watching POPCAT. Open a mission to follow the handoffs.' },
];

export const TOKEN = {
  symbol: '$CREW',
  address: '8nnaeWCw8mUypcGAgbmSuzAT85uWx4UN12adDrMhXrGF',
  short: '8nnaeW…MhXrGF',
  chain: 'Pump.fun',
  pumpUrl: 'https://pump.fun/',
};

export const TICKER_ITEMS = [
  '$CLOUD +69%', 'SOL 148.32', 'DEV SOLD', '$BONK +8%', 'NEW PAIR: $SLEEP', 'FUNDING 0.08%', 'WHALE BOUGHT 420 SOL', '$WIF +12%', 'TPS 3,241', 'MEMES LIVE',
];
