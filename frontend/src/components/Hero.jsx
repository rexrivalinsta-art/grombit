import React from 'react';
import { BOTS } from '../data/mock';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-orange-600/20 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0a0a0b_80%)]" />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <h1 className="text-[52px] sm:text-7xl md:text-[88px] font-semibold tracking-[-0.03em] leading-[1.02] text-white">
          Your private{' '}
          <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            trading crew.
          </span>
        </h1>
        <p className="mt-6 text-neutral-400 text-lg">Specialist bots working together wherever you trade.</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500">
          <span>scout</span><span className="text-neutral-700">|</span>
          <span>snipe</span><span className="text-neutral-700">|</span>
          <span>trade</span><span className="text-neutral-700">|</span>
          <span>launch</span><span className="text-neutral-700">+</span>
          <span>more</span>
        </div>

        <div className="relative mt-24">
          <div className="absolute inset-x-0 -bottom-10 h-40 bg-gradient-to-b from-black/0 to-black/80 blur-2xl" />
          <div className="grid grid-cols-5 gap-4 sm:gap-8 max-w-5xl mx-auto">
            {BOTS.map((b, i) => (
              <div
                key={b.id}
                className="group flex flex-col items-center cursor-pointer"
                style={{ animation: `floaty 6s ease-in-out ${i * 0.4}s infinite` }}
              >
                <div className="relative">
                  <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-70 transition-opacity ${b.primary ? 'bg-orange-500/60' : 'bg-white/20'}`} />
                  <img
                    src={b.img}
                    alt={b.name}
                    className="relative w-20 h-20 sm:w-28 sm:h-28 object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-1"
                    draggable={false}
                  />
                </div>
                <div className={`mt-5 text-sm font-semibold ${b.primary ? 'text-orange-400' : 'text-white'}`}>{b.name}</div>
                <div className="text-xs text-neutral-500 mt-1">{b.tagline}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#hot" className="inline-flex mt-16 opacity-40 hover:opacity-100 transition-opacity">
          <ChevronDown className="w-6 h-6 text-white animate-bounce" />
        </a>
      </div>
    </section>
  );
}
