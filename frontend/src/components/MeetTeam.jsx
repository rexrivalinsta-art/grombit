import React from 'react';
import { Lock } from 'lucide-react';
import { BOTS } from '../data/mock';

export default function MeetTeam() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-orange-500/10 blur-[150px] rounded-full" />
      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-6xl sm:text-7xl font-semibold tracking-[-0.03em] text-white leading-[1.02]">
          Meet your <br />
          <span className="text-neutral-400">trading crew.</span>
        </h2>
        <p className="mt-6 text-neutral-400">You keep trenching. Your crew handles the repetition.</p>

        <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-orange-50 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)] transition-colors">
          Invite Only <Lock className="w-3.5 h-3.5" />
        </button>

        <div className="mt-20 grid grid-cols-5 gap-4 sm:gap-8 max-w-4xl mx-auto">
          {BOTS.map((b, i) => (
            <div key={b.id} className="group flex flex-col items-center" style={{ animation: `floaty 6s ease-in-out ${i * 0.4}s infinite` }}>
              <img src={b.img} alt={b.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform duration-500 group-hover:scale-110" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
