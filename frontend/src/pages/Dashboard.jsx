import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { MASCOTS } from '../components/Mascots';
import DepositModal from '../components/DepositModal';
import WithdrawModal from '../components/WithdrawModal';
import { ArrowDownToLine, ArrowUpFromLine, Play, Square, Send, Loader2, LogOut, TrendingUp, TrendingDown, Zap, Shield, Flame } from 'lucide-react';

const RISK_META = {
  conservative: { label: 'Conservative', icon: Shield, color: 'from-emerald-500 to-emerald-700', ring: 'ring-emerald-500/40', desc: 'Small size, patient entries' },
  balanced:     { label: 'Balanced',     icon: Zap,    color: 'from-sky-500 to-sky-700',           ring: 'ring-sky-500/40',     desc: 'Volume plays, measured risk' },
  degen:        { label: 'Degen',        icon: Flame,  color: 'from-rose-500 to-rose-700',         ring: 'ring-rose-500/40',    desc: 'Fresh pairs, big swings' },
};

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

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'crew', text: 'Hey trader. Deposit some SOL, pick a risk, and I\u2019ll put the crew to work. Try asking me to "find low-cap gems" or "what\u2019s hot on pump.fun right now?"' },
  ]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const logEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Poll trading state
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await api.tradingState();
        if (!alive) return;
        setSession(r.session);
        if (r.session) {
          // Sync balance from engine (optimistic)
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

  if (loading) return <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-orange-400" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const running = session?.running;

  const start = async () => {
    setStarting(true); setStartErr('');
    try {
      const r = await api.startTrading(risk);
      setSession(r.session);
    } catch (e) {
      setStartErr(e.message || 'Failed to start');
    } finally {
      setStarting(false);
    }
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
      const r = await api.chat(text, user.id);
      setMessages((m) => [...m, { role: 'crew', text: r.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'crew', text: 'Crew is napping. Try again in a sec.' }]);
    } finally { setChatBusy(false); }
  };

  const bal = user.balance_sol || 0;
  const profit = user.profit_sol || 0;
  const wins = session?.wins || 0; const losses = session?.losses || 0;
  const total = wins + losses; const winRate = total ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#07070a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <MASCOTS.crew.Component className="w-7 h-7" />
            <span className="font-semibold tracking-tight">TrenchCrew</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-xs text-neutral-400">
              {user.auth_method === 'phantom' ? (
                <span>Phantom <span className="font-mono text-white">{user.phantom_pubkey?.slice(0, 4)}…{user.phantom_pubkey?.slice(-4)}</span></span>
              ) : (
                <span>{user.email}</span>
              )}
            </div>
            <button onClick={() => { logout(); nav('/'); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Balance cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#121216] to-[#0d0d10] p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 blur-3xl rounded-full" />
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Crew Balance</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">{bal.toFixed(4)} <span className="text-base text-neutral-500">SOL</span></div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setDepositOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 transition-colors">
                <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
              </button>
              <button onClick={() => setWithdrawOpen(true)} disabled={bal <= 0} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 transition-colors">
                <ArrowUpFromLine className="w-3.5 h-3.5" /> Withdraw
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d0d10] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Session P&L</div>
            <div className={`mt-2 text-4xl font-semibold tracking-tight ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(4)} <span className="text-base text-neutral-500">SOL</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> {wins} wins</span>
              <span className="inline-flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-rose-400" /> {losses} losses</span>
              <span>· {winRate}% hit rate</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0d0d10] p-5">
            <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Totals</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-neutral-500 text-xs">Deposited</div>
                <div className="font-mono text-white">{(user.total_deposited || 0).toFixed(4)} SOL</div>
              </div>
              <div>
                <div className="text-neutral-500 text-xs">Withdrawn</div>
                <div className="font-mono text-white">{(user.total_withdrawn || 0).toFixed(4)} SOL</div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk + Start */}
        <div className="rounded-2xl border border-white/10 bg-[#0d0d10] p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Risk Level</div>
              <div className="text-lg font-semibold mt-0.5">Pick how the crew plays today.</div>
            </div>
            {running ? (
              <button onClick={stop} disabled={stopping} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-60">
                {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />} Stop crew
              </button>
            ) : (
              <button onClick={start} disabled={starting || bal < 0.01} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 transition-colors disabled:opacity-50 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.5)]">
                {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start trading
              </button>
            )}
          </div>
          {bal < 0.01 && !running && <div className="mt-3 text-xs text-amber-400">Deposit at least 0.01 SOL to start the crew.</div>}
          {startErr && <div className="mt-3 text-xs text-rose-400">{startErr}</div>}

          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            {Object.entries(RISK_META).map(([key, meta]) => {
              const Icon = meta.icon;
              const active = risk === key;
              return (
                <button
                  key={key}
                  disabled={running}
                  onClick={() => setRisk(key)}
                  className={`text-left rounded-xl p-4 border transition-all ${active ? `border-transparent ring-2 ${meta.ring} bg-white/[0.04]` : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'} disabled:opacity-60`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center mb-3`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-white font-semibold text-sm">{meta.label}</div>
                  <div className="text-xs text-neutral-400 mt-1">{meta.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main grid: console / chat / trades */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* Live console */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d10] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <MASCOTS.scout.Component className="w-5 h-5" />
              <span className="text-sm font-semibold">Live Crew Console</span>
              <span className={`ml-auto inline-flex items-center gap-1 text-xs ${running ? 'text-emerald-400' : 'text-neutral-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${running ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                {running ? 'running' : 'idle'}
              </span>
            </div>
            <div ref={logEndRef} className="h-[380px] overflow-y-auto p-4 font-mono text-[12px] leading-relaxed space-y-1.5">
              {!session || !session.logs?.length ? (
                <div className="text-neutral-600">Waiting for the crew to start...</div>
              ) : session.logs.map((l) => (
                <div key={l.id}>
                  <span className="text-neutral-600">[{new Date(l.ts * 1000).toLocaleTimeString()}]</span>{' '}
                  <span className={logColor(l.kind)}>[{l.kind}]</span>{' '}
                  <span className="text-neutral-200">{l.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="rounded-2xl border border-white/10 bg-[#0d0d10] overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <MASCOTS.crew.Component className="w-5 h-5" />
              <span className="text-sm font-semibold">Chat with Crew</span>
            </div>
            <div ref={chatEndRef} className="flex-1 h-[320px] overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'you' ? 'bg-white/10 text-white' : 'bg-orange-500/10 text-orange-50 border border-orange-500/15'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatBusy && <div className="text-xs text-neutral-500 italic">Crew is thinking...</div>}
            </div>
            <div className="p-3 border-t border-white/5 flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Try: find me low-cap gems with volume"
                className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-orange-500/40"
              />
              <button onClick={sendChat} disabled={chatBusy || !input.trim()} className="w-9 h-9 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 flex items-center justify-center disabled:opacity-50">
                {chatBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Trades table */}
        <div className="rounded-2xl border border-white/10 bg-[#0d0d10] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <MASCOTS.trader.Component className="w-5 h-5" />
            <span className="text-sm font-semibold">Recent trades</span>
            {session && <span className="ml-auto text-xs text-neutral-500">{session.trades?.length || 0} trades</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-neutral-500">
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 font-normal">Time</th>
                  <th className="text-left px-4 py-3 font-normal">Coin</th>
                  <th className="text-right px-4 py-3 font-normal">Size</th>
                  <th className="text-right px-4 py-3 font-normal">P&L</th>
                  <th className="text-right px-4 py-3 font-normal">%</th>
                  <th className="text-right px-4 py-3 font-normal">Balance after</th>
                </tr>
              </thead>
              <tbody>
                {(!session || !session.trades?.length) ? (
                  <tr><td colSpan="6" className="px-4 py-10 text-center text-neutral-600">No trades yet. Start the crew to see live trades.</td></tr>
                ) : session.trades.map((t) => (
                  <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{new Date(t.ts * 1000).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-medium text-white">${t.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-300">{t.size_sol} SOL</td>
                    <td className={`px-4 py-3 text-right font-mono ${t.win ? 'text-emerald-400' : 'text-rose-400'}`}>{t.win ? '+' : ''}{t.pnl_sol.toFixed(6)}</td>
                    <td className={`px-4 py-3 text-right font-mono ${t.win ? 'text-emerald-400' : 'text-rose-400'}`}>{t.pnl_pct}%</td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-300">{t.balance_after.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <DepositModal open={depositOpen} onClose={() => setDepositOpen(false)} />
      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}

function logColor(kind) {
  switch (kind) {
    case 'win': return 'text-emerald-400';
    case 'loss': return 'text-rose-400';
    case 'entry': return 'text-sky-400';
    case 'trade': return 'text-amber-300';
    case 'coin': return 'text-fuchsia-300';
    case 'scan': return 'text-neutral-400';
    case 'idle': return 'text-neutral-500';
    case 'warn': return 'text-amber-400';
    case 'error': return 'text-rose-400';
    default: return 'text-orange-400';
  }
}
