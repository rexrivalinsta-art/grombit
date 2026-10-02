import React, { useState } from 'react';
import { ChevronDown, Check, SlidersHorizontal, ArrowUpRight } from 'lucide-react';

const MARKETS = ['$50K – $2M', '$2M – $10M', '$10M+'];
const IMPACT = ['1%', '2%', '3%'];
const SOURCES = ['Pump.fun', 'Raydium', 'Jupiter'];

export default function Strategy() {
  const [source, setSource] = useState(SOURCES[0]);
  const [mcap, setMcap] = useState(MARKETS[0]);
  const [impact, setImpact] = useState(IMPACT[0]);
  const [size, setSize] = useState(0.1);
  const [checks, setChecks] = useState({ holders: true, liquidity: true, security: true });
  const [autoRun, setAutoRun] = useState('Ask before each trade.');

  return (
    <section id="strategy" className="relative py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-start">
        <div className="lg:sticky lg:top-32">
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
            Give HOTBOT your strategy. <span className="text-neutral-500">Multiply your edge.</span>
          </h2>
          <p className="mt-6 text-neutral-400 max-w-md">
            Choose what to watch, what has to pass, and what happens when something matches. Run your Strategy across more of the market while you keep trading.
          </p>
          <ul className="mt-8 space-y-3 text-neutral-300">
            {['Cover more of the market', 'Keep your rules consistent', 'Skip the repetitive work'].map((t) => (
              <li key={t} className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-400" /> {t}</li>
            ))}
          </ul>
        </div>

        {/* Strategy card */}
        <div className="relative">
          <div className="absolute -inset-6 bg-orange-500/10 blur-3xl rounded-3xl" />
          <div className="relative rounded-2xl border border-white/10 bg-[#111113] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-orange-400 font-semibold">Your Strategy</div>
                <div className="mt-1 text-2xl text-white font-semibold tracking-tight">Fresh runners</div>
              </div>
              <button className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center hover:bg-orange-500/25 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Field label="Source">
                <PillSelect value={source} onChange={setSource} options={SOURCES} icon="https://usehotbot.com/icons/launchpads/pumpfun.webp" />
              </Field>
              <Field label="Market cap">
                <PillSelect value={mcap} onChange={setMcap} options={MARKETS} />
              </Field>
              <Field label="Trade size · SOL">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/40 border border-white/10">
                  <input
                    type="range" min="0.05" max="5" step="0.05" value={size}
                    onChange={(e) => setSize(parseFloat(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="text-sm text-white font-mono w-14 text-right">{size.toFixed(2)}</span>
                </div>
              </Field>
              <Field label="Max price impact">
                <PillSelect value={impact} onChange={setImpact} options={IMPACT} />
              </Field>
            </div>

            <div className="mt-6">
              <div className="text-xs text-neutral-400 mb-2">Research checks</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(checks).map((k) => (
                  <button
                    key={k}
                    onClick={() => setChecks({ ...checks, [k]: !checks[k] })}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-colors ${checks[k] ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-white/5 text-neutral-400 border-white/10'}`}
                  >
                    {checks[k] && <Check className="w-3 h-3" />}
                    {k[0].toUpperCase() + k.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs text-neutral-400 mb-2">Auto-run</div>
              <div className="flex gap-2">
                {['Ask before each trade.', 'Auto-approve within limits'].map((o) => (
                  <button
                    key={o}
                    onClick={() => setAutoRun(o)}
                    className={`px-3 py-2 rounded-lg text-xs transition-colors ${autoRun === o ? 'bg-white/10 text-white border border-white/15' : 'bg-white/[0.03] text-neutral-400 border border-white/5 hover:bg-white/[0.06]'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>

            <button className="mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-semibold uppercase tracking-wider text-orange-50 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)] transition-colors">
              Open CREW <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-xs text-neutral-400 mb-2">{label}</div>
      {children}
    </div>
  );
}

function PillSelect({ value, onChange, options, icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 text-sm text-white hover:bg-black/60 transition-colors">
        {icon && <img src={icon} className="w-4 h-4" alt="" />}
        <span className="flex-1 text-left">{value}</span>
        <ChevronDown className="w-4 h-4 text-neutral-500" />
      </button>
      {open && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-lg bg-[#1a1a1d] border border-white/10 overflow-hidden shadow-xl">
          {options.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-white/5 transition-colors">{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}
