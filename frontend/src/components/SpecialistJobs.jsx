import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { BOTS, SPECIALISTS_DETAIL } from '../data/mock';

export default function SpecialistJobs() {
  const [active, setActive] = useState('HOTBOT');
  const detail = SPECIALISTS_DETAIL[active];
  const tabs = ['HOTBOT', 'ResearchBot', 'SniperBot', 'TraderBot', 'LaunchBot'];

  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        {/* Tree diagram */}
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.08),transparent_70%)]" />
          <div className="relative grid grid-cols-[1fr_1fr] gap-6 items-center">
            {/* Center HOTBOT node */}
            <div className="relative">
              <div className="rounded-2xl bg-[#111113] border border-white/10 p-6 text-center shadow-[0_20px_60px_-20px_rgba(249,115,22,0.4)]">
                <img src="https://usehotbot.com/litepaper/assets/hotbot.svg" className="w-14 h-14 mx-auto" alt="HOTBOT" />
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">HOTBOT</div>
                <div className="text-xs text-neutral-500 mt-1">Your Strategy</div>
              </div>
            </div>
            {/* Right column: 4 bots connected */}
            <div className="relative space-y-3">
              {BOTS.filter((b) => !b.primary).map((b, i) => (
                <div key={b.id} className="relative">
                  <svg className="absolute right-full top-1/2 -translate-y-1/2 w-10 h-10 overflow-visible pointer-events-none" viewBox="0 0 40 40">
                    <path d={`M 40 20 C 20 20, 20 ${20 + (i - 1.5) * 20}, 0 ${20 + (i - 1.5) * 20}`} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                  </svg>
                  <div
                    onMouseEnter={() => setActive(b.name)}
                    className={`flex items-center gap-3 rounded-xl p-3 border transition-colors cursor-pointer ${active === b.name ? 'bg-white/[0.07] border-white/15' : 'bg-[#111113] border-white/10 hover:bg-white/[0.05]'}`}
                  >
                    <img src={b.img} className="w-10 h-10" alt={b.name} />
                    <div className="flex-1">
                      <div className="text-sm text-white font-semibold">{b.name}</div>
                      <div className="text-xs text-neutral-500">{b.tagline}</div>
                    </div>
                    <span className={`w-1.5 h-1.5 rounded-full ${active === b.name ? 'bg-orange-400' : 'bg-neutral-700'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
            Give each specialist <span className="text-neutral-500">a job.</span>
          </h2>
          <div className="mt-8 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${active === t ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'text-neutral-400 hover:text-white border border-transparent'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <p className="mt-6 text-neutral-400 max-w-md">{detail.desc}</p>
          <ul className="mt-8 space-y-3">
            {detail.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-neutral-300"><Check className="w-4 h-4 text-emerald-400" /> {b}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
