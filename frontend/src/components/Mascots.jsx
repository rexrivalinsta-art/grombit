// Cute custom SVG mascot characters - original designs (blob creatures)
import React from 'react';

export function MascotScout({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="scoutG" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="60%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="rgba(0,0,0,0.35)" />
      <path d="M60 15 C 85 15, 100 38, 100 62 C 100 90, 82 103, 60 103 C 38 103, 20 90, 20 62 C 20 38, 35 15, 60 15 Z" fill="url(#scoutG)" />
      <ellipse cx="46" cy="28" rx="18" ry="8" fill="rgba(255,255,255,0.35)" />
      <circle cx="44" cy="58" r="10" fill="#fff" />
      <circle cx="74" cy="58" r="10" fill="#fff" />
      <circle cx="46" cy="60" r="5" fill="#0a0a0b" />
      <circle cx="76" cy="60" r="5" fill="#0a0a0b" />
      <circle cx="48" cy="58" r="1.5" fill="#fff" />
      <circle cx="78" cy="58" r="1.5" fill="#fff" />
      <path d="M50 78 Q 60 86 70 78" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MascotSniper({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="snipG" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#9f1239" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="rgba(0,0,0,0.35)" />
      <path d="M60 18 C 86 20, 102 42, 100 66 C 98 92, 80 104, 58 102 C 36 100, 20 86, 22 62 C 24 38, 38 16, 60 18 Z" fill="url(#snipG)" />
      <ellipse cx="48" cy="30" rx="18" ry="8" fill="rgba(255,255,255,0.35)" />
      {/* Angry eyebrows */}
      <path d="M34 48 L 54 54" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
      <path d="M86 48 L 66 54" stroke="#881337" strokeWidth="4" strokeLinecap="round" />
      <circle cx="46" cy="62" r="7" fill="#fff" />
      <circle cx="74" cy="62" r="7" fill="#fff" />
      <circle cx="46" cy="62" r="3.5" fill="#0a0a0b" />
      <circle cx="74" cy="62" r="3.5" fill="#0a0a0b" />
      <path d="M52 82 Q 60 78 68 82" stroke="#881337" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MascotCrew({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="crewG" cx="35%" cy="25%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="rgba(0,0,0,0.4)" />
      {/* Droplet shape */}
      <path d="M60 10 C 85 42, 100 60, 100 80 C 100 100, 82 112, 60 112 C 38 112, 20 100, 20 80 C 20 60, 35 42, 60 10 Z" fill="url(#crewG)" />
      <ellipse cx="50" cy="35" rx="14" ry="7" fill="rgba(255,255,255,0.4)" />
      <circle cx="48" cy="72" r="7" fill="#1a0a05" />
      <circle cx="72" cy="72" r="7" fill="#1a0a05" />
      <circle cx="50" cy="70" r="1.8" fill="#fff" />
      <circle cx="74" cy="70" r="1.8" fill="#fff" />
    </svg>
  );
}

export function MascotTrader({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="tradG" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="rgba(0,0,0,0.35)" />
      <path d="M60 20 C 85 20, 100 42, 100 62 C 100 90, 82 103, 60 103 C 38 103, 20 90, 20 62 C 20 42, 35 20, 60 20 Z" fill="url(#tradG)" />
      {/* Headphones */}
      <path d="M20 55 Q 60 20 100 55" stroke="#0f172a" strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="14" y="52" width="14" height="20" rx="5" fill="#0f172a" />
      <rect x="92" y="52" width="14" height="20" rx="5" fill="#0f172a" />
      <ellipse cx="48" cy="34" rx="14" ry="6" fill="rgba(255,255,255,0.3)" />
      <circle cx="48" cy="72" r="6" fill="#0f172a" />
      <circle cx="72" cy="72" r="6" fill="#0f172a" />
      <circle cx="50" cy="70" r="1.5" fill="#fff" />
      <circle cx="74" cy="70" r="1.5" fill="#fff" />
      <path d="M52 86 Q 60 90 68 86" stroke="#1e3a8a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function MascotLaunch({ className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="lauG" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="60%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="34" ry="5" fill="rgba(0,0,0,0.35)" />
      <path d="M60 22 C 85 22, 100 44, 100 64 C 100 90, 82 103, 60 103 C 38 103, 20 90, 20 64 C 20 44, 35 22, 60 22 Z" fill="url(#lauG)" />
      {/* Cap */}
      <ellipse cx="60" cy="22" rx="32" ry="8" fill="#1a1a1d" />
      <path d="M30 22 Q 60 -2 90 22 Z" fill="#1a1a1d" />
      <circle cx="60" cy="14" r="3" fill="#a855f7" />
      <ellipse cx="48" cy="42" rx="14" ry="5" fill="rgba(255,255,255,0.3)" />
      <circle cx="48" cy="66" r="7" fill="#fff" />
      <circle cx="72" cy="66" r="7" fill="#fff" />
      <circle cx="48" cy="66" r="3.5" fill="#0a0a0b" />
      <circle cx="72" cy="66" r="3.5" fill="#0a0a0b" />
      <path d="M50 86 Q 60 92 70 86" stroke="#4a1d6e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export const MASCOTS = {
  scout: { name: 'Scout', tagline: 'Hunts fresh pairs.', Component: MascotScout, color: '#22c55e' },
  sniper: { name: 'Sniper', tagline: 'Waits for the entry.', Component: MascotSniper, color: '#f43f5e' },
  crew: { name: 'Crew', tagline: 'Runs the show.', Component: MascotCrew, color: '#fb923c', primary: true },
  trader: { name: 'Trader', tagline: 'Executes with rules.', Component: MascotTrader, color: '#3b82f6' },
  launch: { name: 'Launch', tagline: 'Ships your coin.', Component: MascotLaunch, color: '#a855f7' },
};
