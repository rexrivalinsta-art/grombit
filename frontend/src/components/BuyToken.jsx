import React, { useState } from 'react';
import { ArrowUpRight, Copy, Check, Pill } from 'lucide-react';
import { TOKEN } from '../data/mock';
import { toast } from '../hooks/use-toast';

export default function BuyToken() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(TOKEN.address);
    setCopied(true);
    toast({ title: 'Address copied', description: TOKEN.address });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="hot" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
            Buy <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">$CREW</span>
            <span className="text-neutral-500"> on Pump.fun</span>
          </h2>
          <p className="mt-6 text-neutral-400 text-lg">The token behind TrenchCrew.</p>
          <p className="text-neutral-500">Be part of what comes next.</p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a href={TOKEN.pumpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-orange-50 bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)] hover:from-orange-300 hover:to-orange-500 transition-colors">
              Buy $CREW <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <a href={TOKEN.pumpUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              View Chart <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button onClick={copy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy CA'}
            </button>
          </div>

          <div className="mt-6 inline-flex items-center gap-3 text-sm text-neutral-400">
            <span className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center"><Pill className="w-3.5 h-3.5 text-emerald-400" /></span>
            Pump.fun
            <span className="font-mono text-neutral-500">{TOKEN.short}</span>
          </div>
        </div>

        <div className="relative flex items-center justify-center min-h-[380px]">
          <div className="absolute w-[520px] h-[520px] rounded-full bg-orange-600/30 blur-[120px]" />
          <div className="relative" style={{ animation: 'spin-slow 18s linear infinite' }}>
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-full relative overflow-hidden shadow-[0_30px_80px_-20px_rgba(249,115,22,0.5)]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300 via-orange-500 to-amber-700" />
              <div className="absolute inset-2 rounded-full border-[6px] border-amber-700/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl sm:text-6xl font-black tracking-tighter text-amber-900 drop-shadow">$CREW</span>
              </div>
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent mix-blend-overlay" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
