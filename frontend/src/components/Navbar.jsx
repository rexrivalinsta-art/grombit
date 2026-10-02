import React, { useEffect, useState } from 'react';
import { Lock, Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled ? 'bg-[#0a0a0b]/80 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_0_18px_rgba(249,115,22,0.45)] group-hover:shadow-[0_0_26px_rgba(249,115,22,0.65)] transition-shadow">
            <Flame className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold tracking-tight">hotbot</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to={loc.pathname === '/litepaper' ? '/' : '/litepaper'}
            className="text-sm text-neutral-300 hover:text-white transition-colors"
          >
            {loc.pathname === '/litepaper' ? 'Home' : 'Litepaper'}
          </Link>
          <button className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-orange-50 bg-gradient-to-b from-orange-400 to-orange-600 shadow-[0_6px_20px_-6px_rgba(249,115,22,0.6)] hover:from-orange-300 hover:to-orange-500 transition-colors">
            Invite Only
            <Lock className="w-3.5 h-3.5" />
          </button>
        </nav>
      </div>
    </header>
  );
}
