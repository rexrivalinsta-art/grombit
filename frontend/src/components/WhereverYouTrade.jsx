import React from 'react';
import { BRANDS } from '../data/mock';

export default function WhereverYouTrade() {
  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05] max-w-3xl">
          CREW works <span className="text-neutral-500">wherever you trade.</span>
        </h2>
        <p className="mt-6 text-neutral-400 max-w-xl">Keep using the trading tools you already use. Let CREW handle the repetitive work between them.</p>

        <div className="mt-16 grid lg:grid-cols-2 gap-6">
          <div className="relative rounded-2xl border border-white/10 bg-[#111113] p-5 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <img src="https://usehotbot.com/icons/launchpads/pumpfun.webp" className="w-5 h-5" alt="pumpfun" />
              <span className="text-sm text-white font-semibold">Pump.fun</span>
              <span className="text-xs text-neutral-500 ml-auto">Fartcoin • FARTCOIN</span>
            </div>
            <div className="h-56 rounded-lg bg-black/50 border border-white/5 p-3 flex items-end gap-[2px]">
              {Array.from({ length: 70 }).map((_, i) => {
                const base = 20 + Math.abs(Math.sin(i * 0.3) * 50);
                const h = Math.max(6, base + (i % 5) * 3);
                const up = (i + Math.floor(Math.sin(i)*2)) % 2 === 0;
                return (
                  <div key={i} className={`flex-1 ${up ? 'bg-emerald-500/80' : 'bg-rose-500/80'}`} style={{ height: `${h}%` }} />
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
              <span>1D 5D 1M 3M 1Y</span>
              <span className="ml-auto">05:30:26 UTC+2</span>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-[#111113] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
              <span className="text-sm text-white font-semibold">CREW</span>
              <span className="text-xs text-neutral-500 ml-auto">Team panel</span>
            </div>
            <div className="space-y-2">
              {[
                { img: 'https://usehotbot.com/litepaper/assets/research.svg', name: 'ScoutBot', assigned: 'Fresh Runners' },
                { img: 'https://usehotbot.com/litepaper/assets/sniper.svg', name: 'SniperBot', assigned: 'Patient Entries' },
                { img: 'https://usehotbot.com/litepaper/assets/trader.svg', name: 'TraderBot', assigned: '1 assigned' },
                { img: 'https://usehotbot.com/litepaper/assets/launch.svg', name: 'LaunchBot', assigned: '1 assigned' },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors cursor-pointer">
                  <img src={r.img} className="w-8 h-8" alt={r.name} />
                  <span className="text-sm text-white font-medium">{r.name}</span>
                  <span className="text-xs text-neutral-500 ml-auto">{r.assigned} ›</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
          {BRANDS.map((b) => (
            <div key={b.name} className="flex items-center gap-2 justify-center opacity-80 hover:opacity-100 transition-opacity">
              <img src={b.img} className="w-6 h-6 object-contain" alt={b.name} />
              <span className="text-sm text-neutral-300">{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
