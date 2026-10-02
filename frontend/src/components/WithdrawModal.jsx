import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function WithdrawModal({ open, onClose }) {
  const { user, refresh, setUser } = useAuth();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState(null);

  if (!open) return null;
  const amt = parseFloat(amount) || 0;
  const fee = amt * 0.01;
  const payout = Math.max(0, amt - fee);

  const submit = async () => {
    setErr(''); setMsg(null); setBusy(true);
    try {
      const r = await api.withdraw(destination.trim(), amt);
      setMsg(`Sent ${r.paid_out_sol.toFixed(6)} SOL · tx ${r.signature.slice(0, 10)}...`);
      setUser(r.user);
      setTimeout(() => { refresh(); onClose(); }, 2200);
    } catch (e) {
      setErr(e.message || 'Withdraw failed');
    } finally { setBusy(false); }
  };

  const bal = user?.balance_sol || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d10] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Withdraw SOL</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <p className="mt-1 text-sm text-neutral-400">Send your SOL to any Solana address. A flat 1% fee is deducted.</p>

        <div className="mt-5 space-y-3">
          <label className="block">
            <div className="text-xs text-neutral-400 mb-1.5">Destination address</div>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Solana address" className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm font-mono" />
          </label>
          <label className="block">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>Amount in SOL</span>
              <button onClick={() => setAmount(String(bal))} className="text-orange-400 hover:underline">Max {bal.toFixed(4)}</button>
            </div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.0001" min="0" className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm" />
          </label>
          <div className="rounded-lg bg-black/30 border border-white/5 px-3 py-2 text-xs text-neutral-400 space-y-1">
            <div className="flex justify-between"><span>Fee (1%)</span><span className="font-mono text-neutral-300">{fee.toFixed(6)} SOL</span></div>
            <div className="flex justify-between"><span>You receive</span><span className="font-mono text-emerald-400">{payout.toFixed(6)} SOL</span></div>
          </div>
        </div>

        {err && <div className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</div>}
        {msg && <div className="mt-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{msg}</div>}

        <button onClick={submit} disabled={!destination || amt <= 0 || amt > bal || busy} className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Withdraw
        </button>
      </div>
    </div>
  );
}
