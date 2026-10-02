import React, { useState } from 'react';
import { ArrowRight, Flame, Send, ChevronDown } from 'lucide-react';
import { CHAT } from '../data/mock';

export default function MessageHotbot() {
  const [messages, setMessages] = useState(CHAT);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const t = new Date();
    const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const next = [...messages, { role: 'you', time, text: input.trim() }];
    setMessages(next);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'hotbot',
        time,
        text: 'Got it. Dispatching ResearchBot to check holders & liquidity. I\u2019ll bring you back in when SniperBot has an entry.',
      }]);
    }, 700);
  };

  return (
    <section id="strategies" className="relative py-32">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-5xl sm:text-6xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
            Message HOTBOT <br />
            <span className="text-neutral-500">like your trading team.</span>
          </h2>
          <p className="mt-6 text-neutral-400 max-w-md">
            Tell HOTBOT what you want done, from desktop or mobile. Research a token, watch an entry, prepare a trade, or launch something.
          </p>
          <p className="mt-4 text-neutral-500 max-w-md">
            HOTBOT gets the right specialists on it and brings you back in when something needs your attention.
          </p>
          <a href="#strategy" className="mt-8 inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Give HOTBOT your Strategy <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Chat mock */}
        <div className="relative">
          <div className="absolute -inset-10 bg-orange-500/10 blur-3xl rounded-full" />
          <div className="relative rounded-2xl border border-white/10 bg-[#111113]/90 backdrop-blur shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center"><Flame className="w-3.5 h-3.5 text-white" /></div>
              <span className="text-sm font-semibold text-white">HOTBOT</span>
            </div>

            <div className="p-5 space-y-4 h-[340px] overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'you' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    {m.role === 'hotbot' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center"><Flame className="w-2.5 h-2.5 text-white" /></div>
                        <span className="text-xs text-white font-semibold">HOTBOT</span>
                        <span className="text-[11px] text-neutral-500 ml-auto">{m.time}</span>
                      </div>
                    )}
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === 'you' ? 'bg-white/10 text-white border border-white/5' : 'bg-neutral-900/70 text-neutral-200 border border-white/5'}`}>
                      {m.text}
                    </div>
                    {m.role === 'you' && <div className="text-[11px] text-neutral-500 mt-1 text-right">{m.time}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 p-4">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask HOTBOT to research a token..."
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  One-off mission <ChevronDown className="w-3 h-3" />
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-neutral-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <Flame className="w-3 h-3 text-orange-400" /> HOTBOT
                </button>
                <button onClick={send} className="ml-auto w-8 h-8 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 transition-colors flex items-center justify-center">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
