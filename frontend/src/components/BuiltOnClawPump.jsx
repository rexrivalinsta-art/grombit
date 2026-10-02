import React from 'react';
import { ShieldCheck, Layers, ArrowRightLeft } from 'lucide-react';

export default function BuiltOnClawPump() {
  return (
    <section className="relative py-24 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] text-white leading-tight flex items-center gap-3 flex-wrap">
            Built on
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <img src="https://usehotbot.com/hotbot/brands/clawpump.webp" className="w-7 h-7" alt="ClawPump" />
              <span className="text-white font-semibold">ClawPump</span>
            </span>
            <span className="text-neutral-500">.</span>
          </h2>
          <p className="mt-6 text-neutral-400 max-w-md">
            ClawPump gives the agents wallets and crypto capabilities. HOTBOT turns them into your private trading team.
          </p>
        </div>
        <ul className="space-y-5">
          <Row icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />} text="Wallets with your permissions" />
          <Row icon={<Layers className="w-4 h-4 text-sky-400" />} text="Market data for your setups" />
          <Row icon={<ArrowRightLeft className="w-4 h-4 text-orange-400" />} text="Swaps and token launches" />
        </ul>
      </div>
    </section>
  );
}

function Row({ icon, text }) {
  return (
    <li className="flex items-center gap-4">
      <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">{icon}</span>
      <span className="text-neutral-200">{text}</span>
    </li>
  );
}
