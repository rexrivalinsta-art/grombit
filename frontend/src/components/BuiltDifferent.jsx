import React from 'react';
import { TICKER_ITEMS, BOTS } from '../data/mock';

export default function BuiltDifferent() {
  const specialists = BOTS.filter((b) => !b.primary);
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
          Built different. <span className="text-neutral-500">Up all night.</span>
        </h2>
        <p className="mt-4 text-neutral-400">Four specialists. Questionable sleep schedules.</p>

        <div className="mt-10 flex flex-wrap gap-3">
          {specialists.map((s) => (
            <button key={s.id} className="group inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <img src={s.img} className="w-6 h-6 rounded-full" alt={s.name} />
              <span className="text-sm text-white font-medium">{s.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-10 relative rounded-3xl border border-white/10 overflow-hidden bg-[#0d0d0f]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15),transparent_60%)]" />
          <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-0">
            <div className="relative min-h-[420px] p-10 flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 w-[280px] h-[280px] bg-blue-500/30 blur-3xl rounded-full" />
                <img src="https://usehotbot.com/litepaper/assets/trader.svg" className="relative w-56 h-56 object-contain drop-shadow-[0_30px_60px_rgba(59,130,246,0.4)]" alt="TraderBot" />
              </div>
              <div className="absolute top-10 left-10 px-3 py-1.5 rounded-md bg-black/60 border border-white/10 text-xs text-emerald-400 font-mono">
                <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse" />
                WIF · 1M LIVE
              </div>
              <div className="absolute bottom-16 left-16 px-3 py-1.5 rounded-md bg-black/60 border border-white/10 text-xs text-red-400 font-mono">CLOUD / SOL LIVE</div>
              <div className="absolute top-20 right-10 px-3 py-1.5 rounded-md bg-black/60 border border-white/10 text-xs text-neutral-300 font-mono">PERPS LIVE</div>
              <div className="absolute bottom-10 right-16 px-3 py-1.5 rounded-md bg-black/60 border border-white/10 text-xs text-amber-300 font-mono">BONK · 5S LIVE</div>
            </div>

            <div className="relative p-8 border-l border-white/5">
              <div className="rounded-xl bg-black/60 border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-semibold">$CLOUD / SOL</span>
                    <span className="text-xs text-neutral-500">1s 1m 5m 1h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE</span>
                    <span className="text-xs text-emerald-400 font-mono">+12.0%</span>
                  </div>
                </div>
                <div className="mt-5 h-40 flex items-end gap-1">
                  {Array.from({ length: 42 }).map((_, i) => {
                    const h = 30 + Math.abs(Math.sin(i * 0.6) * 60) + (i % 7) * 2;
                    const up = i % 3 !== 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className={`w-full ${up ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`} style={{ height: `${h}%`, minHeight: 4 }} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-[11px] text-neutral-500 font-mono">HOLDING · route: jupiter · latency: 12ms</div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-white/5 bg-black/40 overflow-hidden">
            <div className="flex gap-10 py-3 text-xs font-mono text-neutral-400 whitespace-nowrap" style={{ animation: 'ticker 30s linear infinite' }}>
              {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
                <span key={i} className="px-2">· {t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-neutral-500">030303030303 degen 03</div>
          <h3 className="mt-3 text-3xl text-white font-semibold tracking-tight">Emotionally overleveraged.</h3>
          <p className="mt-3 text-neutral-400">Handles execution with the wallet, size, and permissions you set. Uses the work already done, so you don’t have to rebuild each trade.</p>
        </div>
      </div>
    </section>
  );
}
