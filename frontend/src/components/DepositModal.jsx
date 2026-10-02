import React, { useEffect, useState } from 'react';
import { Copy, Check, X, Loader2, ExternalLink, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function DepositModal({ open, onClose }) {
  const { user, refresh, setUser } = useAuth();
  const [address, setAddress] = useState('');
  const [sig, setSig] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [phantomBusy, setPhantomBusy] = useState(false);
  const [amountSol, setAmountSol] = useState('0.05');

  useEffect(() => {
    if (open) {
      api.depositAddress().then((r) => setAddress(r.address)).catch(() => {});
      setSig(''); setMsg(null); setErr('');
    }
  }, [open]);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const verify = async () => {
    setErr(''); setMsg(null); setBusy(true);
    try {
      const r = await api.verifyDeposit(sig.trim());
      setMsg(`Credited ${r.credited_sol} SOL ✓`);
      setUser(r.user);
      setSig('');
      setTimeout(() => { refresh(); onClose(); }, 1200);
    } catch (e) {
      setErr(e.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  const payWithPhantom = async () => {
    setErr(''); setMsg(null); setPhantomBusy(true);
    try {
      if (!window.solana || !window.solana.isPhantom) {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          const ref = encodeURIComponent(window.location.href);
          window.location.href = `https://phantom.app/ul/browse/${ref}?ref=${ref}`;
        } else {
          window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer');
        }
        throw new Error('Opening Phantom...');
      }
      const connected = await window.solana.connect();
      const fromPubkey = connected.publicKey;
      // Build transfer transaction using @solana/web3.js loaded from CDN
      await ensureSolanaWeb3();
      const { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } = window.solanaWeb3;
      const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
      const lamports = Math.floor(parseFloat(amountSol) * LAMPORTS_PER_SOL);
      if (!lamports || lamports <= 0) throw new Error('Enter a valid SOL amount');
      const toPubkey = new PublicKey(address);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey, toPubkey, lamports })
      );
      tx.feePayer = fromPubkey;
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      const signed = await window.solana.signAndSendTransaction(tx);
      const signature = signed.signature;
      setMsg(`Sent. Signature: ${signature.slice(0, 10)}... Verifying on-chain...`);
      // Poll until the tx is finalized then verify
      await connection.confirmTransaction(signature, 'confirmed');
      const r = await api.verifyDeposit(signature);
      setMsg(`Credited ${r.credited_sol} SOL ✓`);
      setUser(r.user);
      setTimeout(() => { refresh(); onClose(); }, 1500);
    } catch (e) {
      setErr(e.message || 'Phantom transfer failed');
    } finally {
      setPhantomBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d10] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Deposit SOL</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <p className="mt-1 text-sm text-neutral-400">Send SOL to the crew wallet. Your balance updates after on-chain confirmation.</p>

        <div className="mt-5 rounded-xl bg-black/40 border border-white/10 p-3">
          <div className="text-xs text-neutral-500">Crew wallet address</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 font-mono text-xs text-white break-all">{address || 'Loading...'}</div>
            <button onClick={copy} className="shrink-0 px-2 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-xs flex items-center gap-1">
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
            </button>
          </div>
        </div>

        {user?.auth_method === 'phantom' ? (
          <div className="mt-5">
            <label className="block">
              <div className="text-xs text-neutral-400 mb-1.5">Amount in SOL</div>
              <input value={amountSol} onChange={(e) => setAmountSol(e.target.value)} type="number" step="0.01" min="0.01" className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm" />
            </label>
            <button onClick={payWithPhantom} disabled={phantomBusy} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-60 transition-colors">
              {phantomBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              Send via Phantom
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <div className="text-xs text-neutral-400 mb-1.5">Already sent? Paste the transaction signature</div>
            <input value={sig} onChange={(e) => setSig(e.target.value)} placeholder="5J9kN..." className="w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm font-mono" />
            <button onClick={verify} disabled={!sig.trim() || busy} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 disabled:opacity-60 transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Verify & credit
            </button>
            <a href={`https://solscan.io/account/${address}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white">View on Solscan <ExternalLink className="w-3 h-3" /></a>
          </div>
        )}

        {msg && <div className="mt-4 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">{msg}</div>}
        {err && <div className="mt-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</div>}
      </div>
    </div>
  );
}

async function ensureSolanaWeb3() {
  if (window.solanaWeb3) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}
