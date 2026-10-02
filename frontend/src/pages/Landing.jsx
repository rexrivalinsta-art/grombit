import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Activity, LineChart, Bot, Wallet, Rocket, Lock } from 'lucide-react';
import { MASCOTS } from '../components/Mascots';

export default function Landing() {
  const mascotKeys = ['scout', 'sniper', 'crew', 'trader', 'launch'];

  return (
    <div className="min-h-screen bg-[#07070a] text-white overflow-x-hidden">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-40 bg-[#07070a]/70 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7"><MASCOTS.crew.Component className="w-7 h-7" /></div>
            <span className="font-semibold tracking-tight text-white">TrenchCrew</span>
          </div>
          <nav className="hidden sm:flex items-center gap-7 text-sm text-neutral-400">
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#crew" className="hover:text-white transition-colors">The Crew</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <Link
            to="/trade"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_6px_20px_-6px_rgba(249,115,22,0.6)] hover:from-orange-300 hover:to-orange-500 transition-colors"
          >
            Trade Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-orange-500/15 blur-[160px] rounded-full" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#07070a_80%)]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-neutral-300 mb-8">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live on Solana · Powered by free Pump.fun + DexScreener data
          </div>
          <h1 className="text-[48px] sm:text-7xl md:text-[92px] font-semibold tracking-[-0.035em] leading-[0.98] text-white">
            Your private <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              memecoin crew.
            </span>
          </h1>
          <p className="mt-8 text-neutral-400 text-lg max-w-2xl mx-auto">
            A tiny crew of specialist bots that scouts fresh Solana pairs, picks entries, trades inside your rules
            and even launches your own coin — while you keep trenching.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/trade" className="group inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_10px_30px_-8px_rgba(249,115,22,0.6)] hover:from-orange-300 hover:to-orange-500 transition-colors">
              Trade Now <Rocket className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#how" className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              See how it works
            </a>
          </div>

          {/* Mascots row */}
          <div className="mt-24 grid grid-cols-5 gap-3 sm:gap-6 max-w-5xl mx-auto">
            {mascotKeys.map((k, i) => {
              const m = MASCOTS[k];
              return (
                <div key={k} className="group flex flex-col items-center cursor-pointer" style={{ animation: `floaty 6s ease-in-out ${i * 0.4}s infinite` }}>
                  <div className="relative">
                    <div className="absolute inset-0 blur-2xl opacity-0 group-hover:opacity-60 transition-opacity" style={{ background: m.color }} />
                    <m.Component className="relative w-20 h-20 sm:w-28 sm:h-28 transition-transform duration-500 group-hover:-translate-y-1" />
                  </div>
                  <div className={`mt-4 text-sm font-semibold ${m.primary ? 'text-orange-400' : 'text-white'}`}>{m.name}</div>
                  <div className="text-xs text-neutral-500 mt-1 hidden sm:block">{m.tagline}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-orange-400 font-semibold">How it works</div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-tight">
              Deposit SOL. Pick a risk. <br />
              <span className="text-neutral-500">The crew does the rest.</span>
            </h2>
          </div>

          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {[
              { icon: <Wallet className="w-5 h-5" />, step: '01', title: 'Fund your crew', body: 'Sign up with email or connect Phantom. Deposit SOL to your crew wallet in seconds.' },
              { icon: <Shield className="w-5 h-5" />, step: '02', title: 'Pick a risk level', body: 'Conservative, Balanced, or Degen. Your crew will stay inside the rules you choose.' },
              { icon: <Activity className="w-5 h-5" />, step: '03', title: 'Watch the trenches', body: 'See live Solana pairs being scanned, entries ready, and trades closing. Stop anytime.' },
            ].map((c) => (
              <div key={c.step} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-7 hover:bg-white/[0.04] transition-colors">
                <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-xs shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)]">
                  {c.step}
                </div>
                <div className="text-orange-400">{c.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MEET THE CREW */}
      <section id="crew" className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.3em] text-orange-400 font-semibold">Meet the crew</div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-tight">
              Five tiny specialists. <br />
              <span className="text-neutral-500">One shared mission.</span>
            </h2>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {mascotKeys.map((k) => {
              const m = MASCOTS[k];
              return (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-colors text-center">
                  <m.Component className="w-24 h-24 mx-auto" />
                  <div className={`mt-4 font-semibold ${m.primary ? 'text-orange-400' : 'text-white'}`}>{m.name}</div>
                  <div className="text-xs text-neutral-500 mt-1">{m.tagline}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-3 gap-10 text-center">
          {[
            { k: '24/7', v: 'Scanning Solana pairs' },
            { k: '3', v: 'Risk levels, your rules' },
            { k: '1%', v: 'Flat withdraw fee' },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-5xl font-semibold tracking-tight bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">{s.k}</div>
              <div className="mt-2 text-sm text-neutral-400">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-orange-400 font-semibold">Why TrenchCrew</div>
            <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-tight">
              Your edge, <span className="text-neutral-500">on autopilot.</span>
            </h2>
            <ul className="mt-10 space-y-6">
              {[
                { icon: <Bot className="w-5 h-5" />, title: 'Chat with Crew', body: 'Type “find low-cap gems” and your crew replies with mock plays and context.' },
                { icon: <LineChart className="w-5 h-5" />, title: 'Real market data', body: 'Live Solana pairs streamed from Pump.fun + DexScreener. Zero API keys needed.' },
                { icon: <Zap className="w-5 h-5" />, title: 'Instant withdrawals', body: 'Pull SOL back to any address on-chain, minus a flat 1% fee.' },
                { icon: <Lock className="w-5 h-5" />, title: 'Phantom-ready', body: 'Sign in with email or connect Phantom. Your choice, your keys.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">{f.icon}</div>
                  <div>
                    <div className="text-white font-semibold">{f.title}</div>
                    <div className="text-sm text-neutral-400 mt-1">{f.body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-orange-500/10 blur-3xl rounded-full" />
            <div className="relative rounded-2xl border border-white/10 bg-[#0d0d10] p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6"><MASCOTS.crew.Component /></div>
                <span className="text-sm font-semibold">Crew console</span>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> running</span>
              </div>
              <div className="font-mono text-[12px] space-y-1.5 text-neutral-300">
                <div><span className="text-neutral-500">[scout]</span> scanning Solana memecoin markets...</div>
                <div><span className="text-neutral-500">[scout]</span> found 5 candidate pairs · running checks</div>
                <div><span className="text-emerald-400">[entry]</span> SniperBot entry condition hit on PNUT</div>
                <div><span className="text-sky-400">[trade]</span> TraderBot opening 0.08 SOL into PNUT</div>
                <div><span className="text-emerald-400">[win]</span> ✓ PNUT +0.012 SOL (+15.0%) · bal 1.034</div>
                <div><span className="text-neutral-500">[idle]</span> Crew idle for 14s · waiting for next setup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.3em] text-orange-400 font-semibold text-center">FAQ</div>
          <h2 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-center">Common questions.</h2>
          <div className="mt-12 space-y-3">
            {[
              { q: 'Is this real trading?', a: 'The trading engine shown here is a mock simulation on real Solana market data. Your SOL deposits and withdrawals are real on-chain transfers.' },
              { q: 'Do I need an API key?', a: 'No. We stream public Pump.fun and DexScreener data for free.' },
              { q: 'What is the withdrawal fee?', a: 'A flat 1% is deducted on withdrawal. The rest is sent on-chain to the address you provide.' },
              { q: 'Which wallets can I use?', a: 'Email + password or Phantom. More coming soon.' },
            ].map((f, i) => (
              <details key={i} className="group rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 open:bg-white/[0.04] transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between text-white font-medium">
                  {f.q}
                  <span className="text-neutral-500 group-open:rotate-180 transition-transform">⌄</span>
                </summary>
                <p className="mt-3 text-sm text-neutral-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <MASCOTS.scout.Component className="w-14 h-14" />
            <MASCOTS.crew.Component className="w-16 h-16" />
            <MASCOTS.trader.Component className="w-14 h-14" />
          </div>
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em]">
            Ready when you are.
          </h2>
          <p className="mt-6 text-neutral-400">Spin up your crew in under a minute.</p>
          <Link to="/trade" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_10px_30px_-8px_rgba(249,115,22,0.6)] hover:from-orange-300 hover:to-orange-500 transition-colors">
            Trade Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MASCOTS.crew.Component className="w-6 h-6" />
            <span className="font-semibold">TrenchCrew</span>
          </div>
          <div className="text-sm text-neutral-500">© 2026 TrenchCrew · Not financial advice</div>
        </div>
      </footer>
    </div>
  );
}
