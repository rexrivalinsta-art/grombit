import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BOTS } from '../data/mock';
import { ArrowUpRight, Lock } from 'lucide-react';

const SECTIONS = [
  {
    n: '02',
    title: 'Why we built TrenchCrew',
    body: (
      <>
        <p>We got tired of doing the same checks, waiting on entries, and watching every bag ourselves. You can have a solid trading plan and still spend your whole day carrying it out.</p>
        <p>So we built the crew we wanted in the trenches. Give CREW your plan and let it handle the repeated work while you find another setup, trade manually, or get on with your day.</p>
      </>
    ),
  },
  {
    n: '03',
    title: 'A few clicks. Your own setup.',
    body: (
      <>
        <p>A <strong className="text-white">Strategy</strong> is your trading plan: which coins to watch, what to check, when to buy, and when to sell.</p>
        <p>Start with a style:</p>
        <ul className="space-y-2 pl-6 list-disc marker:text-orange-400">
          <li><strong className="text-white">Clips:</strong> New coins, quick moves, fast exits when a move turns.</li>
          <li><strong className="text-white">Balanced:</strong> Coins already moving, with volume behind them.</li>
          <li><strong className="text-white">Degen:</strong> Brand-new coins with big swings in both directions.</li>
        </ul>
        <p>Set your budget, the most the crew can spend on one coin, and how many coins it can hold. Choose an exit template. Review the plan in plain words and start.</p>
      </>
    ),
  },
  {
    n: '04',
    title: 'Take profits. Have a plan.',
    body: (
      <>
        <p>Set your exit plan before you get in. Let the crew follow it.</p>
        <p>Choose a take-profit template or set your own numbers. Sell some after a rise, leave the rest running, and set a stop if the price falls too far.</p>
        <p>TraderBot can exit sooner, but it cannot loosen your exit rules to hold longer.</p>
      </>
    ),
  },
];

export default function Litepaper() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <Navbar />
      <main id="main" className="pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-semibold">PUBLIC LITEPAPER · October 2, 2026</div>
          <h1 className="mt-6 text-5xl sm:text-7xl font-semibold tracking-[-0.03em] leading-[1.02]">
            Your trading crew <br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">just came online.</span>
          </h1>
          <p className="mt-8 text-neutral-400 text-lg">TrenchCrew is your automated private trading team for Solana memecoins. Set it up in a few clicks and put your Strategy to work in the background.</p>

          <a href="#invite" className="mt-10 inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors font-medium">
            100 private invites only ↓
          </a>

          <div className="mt-16 flex items-center justify-center gap-6 flex-wrap">
            {BOTS.map((b) => (
              <div key={b.id} className="flex flex-col items-center">
                <img src={b.img} className="w-16 h-16" alt={b.name} />
                <div className="mt-2 text-xs text-neutral-400">{b.name}</div>
              </div>
            ))}
          </div>

          {SECTIONS.map((s) => (
            <div key={s.n} className="mt-20">
              <div className="text-xs tracking-[0.3em] text-neutral-500 font-semibold">{s.n}</div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">{s.title}</h2>
              <div className="mt-6 space-y-4 text-neutral-300 leading-relaxed">{s.body}</div>
            </div>
          ))}

          <div className="mt-20">
            <div className="text-xs tracking-[0.3em] text-neutral-500 font-semibold">05</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">Everyone has a job</h2>
            <p className="mt-6 text-neutral-300">Meet your crew. Each bot has a job, and CREW keeps them working together.</p>
            <div className="mt-8 space-y-6">
              {BOTS.map((b) => (
                <div key={b.id} className="flex gap-5 items-start">
                  <img src={b.img} className="w-14 h-14 flex-shrink-0" alt={b.name} />
                  <div>
                    <div className="text-white font-semibold">{b.name}</div>
                    <div className="text-neutral-400 mt-1">{b.tagline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="invite" className="mt-24 rounded-2xl border border-white/10 bg-[#111113] p-10 text-center">
            <div className="text-xs tracking-[0.3em] text-neutral-500 font-semibold">09</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">We’ve reserved 100 spots. Want one?</h2>
            <p className="mt-6 text-neutral-400 max-w-xl mx-auto">We’re reserving the first wave for 100 private invites only. Be one of the first traders to put the crew to work.</p>
            <button className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-orange-50 bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 shadow-[0_8px_24px_-6px_rgba(249,115,22,0.55)] transition-colors">
              Request a private invite <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-neutral-500"><Lock className="w-3 h-3" /> Invite only</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
