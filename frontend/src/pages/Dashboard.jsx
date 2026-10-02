import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import LaunchPanel from '../components/LaunchPanel';
import { ArrowDownToLine, ArrowUpFromLine, Play, Square, Send, Loader2, LogOut, Power, Terminal, Wifi, Activity, CircleDollarSign, ChevronDown, Cpu, Lock, Sparkles, Rocket } from 'lucide-react';

const RISK_META = {
  conservative: { label: 'CONSERVATIVE', color: '#22c55e', desc: '2% max size · patient entries' },
  balanced:     { label: 'BALANCED',     color: '#f59e0b', desc: '5% max size · volume plays' },
  degen:        { label: 'DEGEN',        color: '#f43f5e', desc: '12% max size · fresh pairs' },
};

// Fake "model" tiers — cosmetic picker. All route to backend's single LLM.
const MODELS = [
  { id: 'crew-core',    label: 'crew-core',      tier: 'STD',    tag: 'Standard',  dot: '#9ca3af' },
  { id: 'grok-bot-v4',  label: 'grok-bot v4',    tier: 'PRO',    tag: 'Pro',       dot: '#f59e0b' },
  { id: 'jev-typesafe', label: 'jev typesafe',   tier: 'PRO',    tag: 'Pro',       dot: '#22c55e' },
  { id: 'dot-reasoner', label: 'dot reasoner',   tier: 'PRO',    tag: 'Pro',       dot: '#60a5fa' },
  { id: 'nebula-3',     label: 'nebula 3',       tier: 'PRO',    tag: 'Pro',       dot: '#a78bfa' },
  { id: 'vista-ultra',  label: 'vista ultra',    tier: 'ULTRA',  tag: 'Ultra',     dot: '#f43f5e' },
  { id: 'astra-6',      label: 'astra 6',        tier: 'ULTRA',  tag: 'Ultra',     dot: '#06b6d4' },
  { id: 'omega-mix',    label: 'omega mix',      tier: 'ULTRA',  tag: 'Ultra',     dot: '#ec4899' },
];

export default function Dashboard() {
  const { user, loading, logout, setUser } = useAuth();
  const nav = useNavigate();
  const [session, setSession] = useState(null);
  const [risk, setRisk] = useState('balanced');
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [startErr, setStartErr] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [clock, setClock] = useState(new Date());

  const [messages, setMessages] = useState([
    { role: 'crew', text: 'desk.online. query the market or run a strategy. e.g. "scan low-cap pairs" or "status on PNUT".' },
  ]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [model, setModel] = useState(() => localStorage.getItem('tc_model') || 'crew-core');
  const [modelOpen, setModelOpen] = useState(false);
  const [tab, setTab] = useState('desk'); // desk | launch

  const activeModel = MODELS.find((m) => m.id === model) || MODELS[0];

  const logEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll trading state
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await api.tradingState();
        if (!alive) return;
        setSession(r.session);
        if (r.session) {
          setUser((u) => u ? { ...u, balance_sol: r.session.current_balance, profit_sol: r.session.profit } : u);
        }
      } catch (e) { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 1600);
    return () => { alive = false; clearInterval(id); };
  }, [setUser]);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
  }, [session?.logs?.length]);
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
  }, [messages.length]);

  if (loading) return <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center font-mono"><Loader2 className="w-5 h-5 animate-spin text-amber-400" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const running = session?.running;

  const start = async () => {
    setStarting(true); setStartErr('');
    try {
      const r = await api.startTrading(risk);
      setSession(r.session);
    } catch (e) {
      setStartErr(e.message || 'Failed to start');
    } finally { setStarting(false); }
  };
  const stop = async () => {
    setStopping(true);
    try {
      const r = await api.stopTrading();
      setSession(r.session);
    } catch (e) {} finally { setStopping(false); }
  };

  const sendChat = async () => {
    const text = input.trim();
    if (!text || chatBusy) return;
    setMessages((m) => [...m, { role: 'you', text }]);
    setInput(''); setChatBusy(true);
    try {
      const r = await api.chat(text, user.id, model);
      setMessages((m) => [...m, { role: 'crew', text: r.reply, model }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'crew', text: 'desk.link.error  retry in a moment.', model }]);
    } finally { setChatBusy(false); }
  };

  const pickModel = (id) => {
    setModel(id);
    localStorage.setItem('tc_model', id);
    setModelOpen(false);
    const m = MODELS.find((x) => x.id === id);
    setMessages((prev) => [...prev, { role: 'crew', text: `model.switched -> ${m?.label}  (${m?.tag.toLowerCase()} tier)`, model: id }]);
  };

  const bal = user.balance_sol || 0;
  const profit = user.profit_sol || 0;
  const wins = session?.wins || 0; const losses = session?.losses || 0;
  const total = wins + losses; const winRate = total ? Math.round((wins / total) * 100) : 0;
  const uptime = session?.started_at ? Math.max(0, Math.floor((Date.now()/1000) - session.started_at)) : 0;

  return (
    <div className="min-h-screen bg-[#06060a] text-neutral-200 font-mono">
      {/* Top status bar */}
      <header className="sticky top-0 z-30 bg-[#06060a]/95 backdrop-blur border-b border-amber-500/20">
        <div className="max-w-[1500px] mx-auto px-5 h-11 flex items-center text-[11px] gap-6">
          <Link to="/" className="flex items-center gap-2 text-amber-400 font-semibold tracking-widest">
            <Terminal className="w-3.5 h-3.5" />
            TRENCHCREW://DESK
          </Link>
          <div className="hidden md:flex items-center gap-4 text-neutral-500">
            <span className="inline-flex items-center gap-1.5"><Wifi className="w-3 h-3 text-emerald-400" /> rpc:mainnet-beta</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              engine:{running ? 'running' : 'idle'}
            </span>
            {running && <span>uptime:{fmtDuration(uptime)}</span>}
          </div>
          <div className="ml-auto flex items-center gap-4 text-neutral-500">
            <span className="hidden sm:inline">{clock.toUTCString().slice(5, 25)} UTC</span>
            <span className="text-neutral-400 truncate max-w-[200px]">
              {user.auth_method === 'phantom' ? `${user.phantom_pubkey?.slice(0,4)}…${user.phantom_pubkey?.slice(-4)}` : user.email}
            </span>
            <button onClick={() => { logout(); nav('/'); }} className="inline-flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors">
              <LogOut className="w-3 h-3" /> exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-5 py-5 space-y-4">
        {/* STATS STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="BALANCE" value={`${bal.toFixed(4)} SOL`} accent="#f59e0b" icon={<CircleDollarSign className="w-3.5 h-3.5" />} />
          <Stat label="P&L" value={`${profit >= 0 ? '+' : ''}${profit.toFixed(4)} SOL`} accent={profit >= 0 ? '#22c55e' : '#f43f5e'} icon={<Activity className="w-3.5 h-3.5" />} />
          <Stat label="HIT RATE" value={total ? `${winRate}% (${wins}W/${losses}L)` : '—'} accent="#60a5fa" />
          <Stat label="DEPOSITED/WITHDRAWN" value={`${(user.total_deposited||0).toFixed(2)}/${(user.total_withdrawn||0).toFixed(2)}`} accent="#a78bfa" />
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 border-b border-neutral-800">
          <TabButton active={tab === 'desk'} onClick={() => setTab('desk')} icon={<Terminal className="w-3.5 h-3.5" />}>DESK</TabButton>
          <TabButton active={tab === 'launch'} onClick={() => setTab('launch')} icon={<Rocket className="w-3.5 h-3.5" />}>LAUNCH</TabButton>
          <div className="ml-auto flex items-center gap-2 pb-1 pr-1">
            <button onClick={() => setDepositOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold text-black bg-amber-400 hover:bg-amber-300 transition-colors uppercase tracking-wider">
              <ArrowDownToLine className="w-3 h-3" /> deposit
            </button>
            <button onClick={() => setWithdrawOpen(true)} disabled={bal <= 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold text-amber-300 bg-transparent border border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-30 transition-colors uppercase tracking-wider">
              <ArrowUpFromLine className="w-3 h-3" /> withdraw
            </button>
          </div>
        </div>

        {tab === 'launch' ? (
          <LaunchPanel />
        ) : (
          <>
        <div className="flex flex-wrap items-center gap-2 border border-amber-500/15 bg-amber-500/[0.03] rounded-md px-3 py-2.5">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wider mr-1">risk:</div>
          {Object.entries(RISK_META).map(([k, m]) => (
            <button
              key={k} disabled={running} onClick={() => setRisk(k)}
              className={`px-2.5 py-1.5 rounded-sm text-[11px] uppercase tracking-wider border transition-colors disabled:opacity-50 ${risk === k ? 'text-black border-transparent' : 'text-neutral-400 border-neutral-700 hover:border-neutral-500'}`}
              style={risk === k ? { background: m.color } : {}}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {startErr && <span className="text-[11px] text-rose-400">{startErr}</span>}
            {running ? (
              <button onClick={stop} disabled={stopping} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-[11px] font-semibold text-rose-100 bg-rose-600 hover:bg-rose-500 transition-colors uppercase tracking-wider">
                {stopping ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />} halt
              </button>
            ) : (
              <button onClick={start} disabled={starting || bal < 0.01} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-[11px] font-semibold text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors uppercase tracking-wider">
                {starting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />} initialize
              </button>
            )}
          </div>
        </div>
        {bal < 0.01 && !running && <div className="text-[11px] text-amber-400 -mt-2">⚠ deposit ≥ 0.01 SOL to initialize the desk</div>}

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4">
          {/* TERMINAL CONSOLE */}
          <TerminalPane title={`SCANNER :: ${running ? 'LIVE' : 'STANDBY'}`} status={running ? 'LIVE' : 'IDLE'} statusColor={running ? '#22c55e' : '#6b7280'}>
            <div ref={logEndRef} className="h-[520px] overflow-y-auto px-4 py-3 text-[12px] leading-[1.65] space-y-0 bg-[#07080c]">
              {!session || !session.logs?.length ? (
                <>
                  <TerminalLine kind="system" ts={clock.getTime()/1000} text="desk.ready  awaiting operator command..." />
                  <TerminalLine kind="hint" ts={clock.getTime()/1000} text="hint: fund wallet via deposit → pick risk → initialize" />
                </>
              ) : session.logs.map((l) => (
                <TerminalLine key={l.id} ts={l.ts} kind={l.kind} text={l.text} />
              ))}
              {running && <div className="text-emerald-400">█<span className="animate-pulse">_</span></div>}
            </div>
          </TerminalPane>

          {/* CHAT */}
          <TerminalPane
            title="CREW :: COMMS"
            status={chatBusy ? 'TX' : 'READY'}
            statusColor={chatBusy ? '#f59e0b' : '#60a5fa'}
            right={
              <div className="relative">
                <button
                  onClick={() => setModelOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border border-neutral-700 bg-black/40 hover:bg-black/60 text-[10px] uppercase tracking-wider text-neutral-300 transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: activeModel.dot }} />
                  <span className="text-neutral-200">{activeModel.label}</span>
                  <span className="text-neutral-500">{activeModel.tag}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-500" />
                </button>
                {modelOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 z-20 rounded-sm border border-neutral-700 bg-[#0a0b10] shadow-2xl overflow-hidden">
                    {['STD', 'PRO', 'ULTRA'].map((tier) => (
                      <div key={tier}>
                        <div className="px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-neutral-600 border-b border-neutral-800 bg-black/40 flex items-center gap-1.5">
                          {tier === 'STD' && <Cpu className="w-3 h-3" />}
                          {tier === 'PRO' && <Sparkles className="w-3 h-3 text-amber-400" />}
                          {tier === 'ULTRA' && <Lock className="w-3 h-3 text-fuchsia-400" />}
                          {tier} tier
                        </div>
                        {MODELS.filter((m) => m.tier === tier).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => pickModel(m.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left hover:bg-amber-500/5 transition-colors ${model === m.id ? 'bg-amber-500/10' : ''}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
                            <span className="text-neutral-200 flex-1">{m.label}</span>
                            {model === m.id && <span className="text-amber-400 text-[10px]">active</span>}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            }
          >
            <div ref={chatEndRef} className="h-[468px] overflow-y-auto px-4 py-3 bg-[#07080c] space-y-2.5">
              {messages.map((m, i) => (
                <div key={i} className="text-[12.5px] leading-[1.55]">
                  {m.role === 'you' ? (
                    <div><span className="text-amber-400">operator@desk:~$</span> <span className="text-neutral-200">{m.text}</span></div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      <span className="text-emerald-400">crew@desk:~&gt;</span>{' '}
                      <span className="text-neutral-200">{m.text}</span>
                    </div>
                  )}
                </div>
              ))}
              {chatBusy && <div className="text-[12px] text-neutral-500">crew@desk:~&gt; <span className="animate-pulse">processing...</span></div>}
            </div>
            <div className="border-t border-amber-500/15 px-3 py-2.5 flex items-center gap-2 bg-[#08090d]">
              <span className="text-amber-400 text-[12.5px]">$</span>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="scan low-cap pairs with volume..."
                className="flex-1 bg-transparent text-[12.5px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none font-mono"
              />
              <button onClick={sendChat} disabled={chatBusy || !input.trim()} className="w-7 h-7 rounded-sm bg-amber-400 hover:bg-amber-300 flex items-center justify-center disabled:opacity-40 text-black">
                {chatBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </TerminalPane>
        </div>

        {/* TRADES TABLE */}
        <TerminalPane title={`EXECUTIONS :: ${session?.trades?.length || 0} FILLS`} status={running ? 'WATCHING' : 'IDLE'} statusColor={running ? '#22c55e' : '#6b7280'}>
          <div className="overflow-x-auto bg-[#07080c]">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] text-neutral-500 uppercase tracking-wider">
                <tr className="border-b border-amber-500/10 bg-[#0a0b10]">
                  <th className="text-left px-4 py-2.5 font-normal">time</th>
                  <th className="text-left px-4 py-2.5 font-normal">symbol</th>
                  <th className="text-right px-4 py-2.5 font-normal">size (sol)</th>
                  <th className="text-right px-4 py-2.5 font-normal">pnl</th>
                  <th className="text-right px-4 py-2.5 font-normal">%</th>
                  <th className="text-right px-4 py-2.5 font-normal">bal after</th>
                </tr>
              </thead>
              <tbody>
                {(!session || !session.trades?.length) ? (
                  <tr><td colSpan="6" className="px-4 py-14 text-center text-neutral-600 text-[12px]">// no fills yet. initialize the desk to begin execution.</td></tr>
                ) : session.trades.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-900 hover:bg-amber-500/[0.03]">
                    <td className="px-4 py-2 text-neutral-500 text-[11px]">{new Date(t.ts * 1000).toLocaleTimeString('en-GB', { hour12: false })}</td>
                    <td className="px-4 py-2 text-amber-300">${t.symbol}</td>
                    <td className="px-4 py-2 text-right text-neutral-300">{t.size_sol.toFixed(4)}</td>
                    <td className={`px-4 py-2 text-right ${t.win ? 'text-emerald-400' : 'text-rose-400'}`}>{t.win ? '+' : ''}{t.pnl_sol.toFixed(6)}</td>
                    <td className={`px-4 py-2 text-right ${t.win ? 'text-emerald-400' : 'text-rose-400'}`}>{t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%</td>
                    <td className="px-4 py-2 text-right text-neutral-300">{t.balance_after.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TerminalPane>
          </>
        )}

        {/* Footer line */}
        <div className="text-[10px] text-neutral-600 border-t border-neutral-900 pt-3 flex items-center justify-between flex-wrap gap-2">
          <span>// trenchcrew desk v0.1 · pump.fun + dexscreener feeds · solana mainnet-beta</span>
          <span>runtime cap: 60 minutes · {running ? `remaining ≈ ${Math.max(0, 3600 - uptime)}s` : 'desk.offline'}</span>
        </div>
      </main>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}

function Stat({ label, value, accent, icon }) {
  return (
    <div className="border border-neutral-800 bg-[#08090d] rounded-md px-4 py-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-500">
        <span>{label}</span>
        {icon && <span style={{ color: accent }}>{icon}</span>}
      </div>
      <div className="mt-1.5 text-lg font-semibold tracking-tight" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-all border-b-2 -mb-px ${active ? 'text-amber-400 border-amber-400' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}
    >
      {icon} {children}
    </button>
  );
}

function TerminalPane({ title, status, statusColor, children }) {
  return (
    <div className="border border-neutral-800 rounded-md overflow-hidden bg-[#08090d]">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-[#0a0b10]">
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 uppercase tracking-[0.18em]">
          <span className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500/80" />
            <span className="w-2 h-2 rounded-full bg-amber-500/80" />
            <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
          </span>
          <span className="ml-1">{title}</span>
        </div>
        {status && (
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: statusColor }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
            {status}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function TerminalLine({ ts, kind, text }) {
  const color = (
    kind === 'win' ? 'text-emerald-400' :
    kind === 'loss' ? 'text-rose-400' :
    kind === 'entry' ? 'text-sky-400' :
    kind === 'trade' ? 'text-amber-300' :
    kind === 'coin' ? 'text-fuchsia-300' :
    kind === 'scan' ? 'text-neutral-300' :
    kind === 'idle' ? 'text-neutral-500' :
    kind === 'warn' ? 'text-amber-400' :
    kind === 'error' ? 'text-rose-400' :
    kind === 'hint' ? 'text-neutral-600 italic' :
    'text-amber-400'
  );
  const d = new Date(ts * 1000);
  const timeStr = d.toLocaleTimeString('en-GB', { hour12: false });
  return (
    <div className="whitespace-pre-wrap break-words">
      <span className="text-neutral-700">[{timeStr}]</span>{' '}
      <span className={color}>{kind.padEnd(6)}</span>{' '}
      <span className="text-neutral-200">{text}</span>
    </div>
  );
}

function fmtDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
