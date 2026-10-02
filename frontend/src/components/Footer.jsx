import React from 'react';
import { Flame } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_18px_rgba(249,115,22,0.45)]">
            <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold">
            usehotbot<span className="text-neutral-500">.com</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-neutral-400">
          <a href="#hot" className="hover:text-white transition-colors">Product</a>
          <a href="#strategy" className="hover:text-white transition-colors">The team</a>
          <a href="#strategies" className="hover:text-white transition-colors">Strategies</a>
          <a href="/litepaper" className="hover:text-white transition-colors">Litepaper</a>
        </nav>
        <div className="text-sm text-neutral-500">© 2026 HOTBOT</div>
      </div>
    </footer>
  );
}
