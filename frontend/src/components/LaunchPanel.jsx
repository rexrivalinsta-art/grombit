import React, { useEffect, useRef, useState } from 'react';
import { Rocket, Upload, Loader2, ExternalLink, Image as ImageIcon, Check, AlertCircle, Copy, Twitter, Send, Globe } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const LAUNCH_OVERHEAD = 0.025;

export default function LaunchPanel() {
  const { user, setUser, refresh } = useAuth();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [initialBuy, setInitialBuy] = useState('0.05');
  const [slippage, setSlippage] = useState('10');
  const [priorityFee, setPriorityFee] = useState('0.0005');

  const [step, setStep] = useState('idle'); // idle | uploading | signing | sending | done | error
  const [progress, setProgress] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [history, setHistory] = useState([]);
  const fileRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const r = await api.launchHistory();
      setHistory(r.launches || []);
    } catch {}
  };

  const onPickImage = (f) => {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      setErr('Image too large (max 4MB)');
      return;
    }
    setImage(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const addProg = (text) => setProgress((p) => [...p, { ts: Date.now(), text }]);

  const launch = async () => {
    setErr(''); setResult(null); setProgress([]);
    if (!image) return setErr('Upload a token image first.');
    if (!name.trim() || !symbol.trim()) return setErr('Name and symbol are required.');
    const sym = symbol.trim().toUpperCase();
    if (sym.length > 10) return setErr('Symbol must be ≤ 10 chars.');
    const buy = parseFloat(initialBuy) || 0;
    const slip = parseInt(slippage) || 10;
    const pfee = parseFloat(priorityFee) || 0.0005;
    const cost = buy + LAUNCH_OVERHEAD;
    const bal = user?.balance_sol || 0;
    if (cost > bal) return setErr(`Insufficient balance: need ~${cost.toFixed(4)} SOL (buy + overhead). Deposit more.`);

    try {
      setStep('uploading');
      addProg('pump.fun.ipfs  uploading metadata + image...');
      const fd = new FormData();
      fd.append('file', image);
      fd.append('name', name.trim());
      fd.append('symbol', sym);
      fd.append('description', description.trim());
      fd.append('twitter', twitter.trim());
      fd.append('telegram', telegram.trim());
      fd.append('website', website.trim());
      const up = await api.launchUpload(fd);
      addProg(`ipfs.ok  uri=${(up.uri || '').slice(0, 60)}...`);

      setStep('signing');
      addProg('mint.keypair.generate  signing with crew wallet...');

      setStep('sending');
      addProg('solana.send  broadcasting launch tx on mainnet-beta...');
      const r = await api.launchCreate({
        name: name.trim(),
        symbol: sym,
        metadata_uri: up.uri,
        initial_buy_sol: buy,
        slippage_bps: slip * 100,
        priority_fee_sol: pfee,
      });
      addProg(`tx.confirmed  sig=${r.launch.signature.slice(0, 12)}...`);
      addProg(`mint.live  ${r.launch.mint.slice(0, 12)}...`);
      setResult(r.launch);
      setUser(r.user);
      setStep('done');
      await loadHistory();
      refresh();
    } catch (e) {
      setErr(e.message || 'Launch failed');
      addProg(`error  ${e.message || 'unknown'}`);
      setStep('error');
    }
  };

  const reset = () => {
    setName(''); setSymbol(''); setDescription(''); setTwitter(''); setTelegram(''); setWebsite('');
    setImage(null); setPreview(''); setInitialBuy('0.05'); setResult(null);
    setStep('idle'); setProgress([]); setErr('');
  };

  const copy = (text) => navigator.clipboard.writeText(text);
  const busy = ['uploading', 'signing', 'sending'].includes(step);
  const bal = user?.balance_sol || 0;
  const cost = (parseFloat(initialBuy) || 0) + LAUNCH_OVERHEAD;

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
      {/* Launch form */}
      <div className="border border-neutral-800 rounded-md overflow-hidden bg-[#08090d]">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-[#0a0b10]">
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 uppercase tracking-[0.18em]">
            <span className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500/80" />
              <span className="w-2 h-2 rounded-full bg-amber-500/80" />
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </span>
            <span className="ml-1">LAUNCHBOT :: PUMP.FUN</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MAINNET
          </div>
        </div>

        <div className="p-5 bg-[#07080c] space-y-4 text-[12.5px]">
          {/* Image + core */}
          <div className="grid sm:grid-cols-[140px_1fr] gap-4">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="group w-[140px] h-[140px] rounded-md border border-dashed border-neutral-700 bg-black/40 hover:border-amber-500/50 flex items-center justify-center overflow-hidden"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 group-hover:text-amber-400 transition-colors" />
                    <div className="text-[10px] uppercase tracking-wider">image</div>
                    <div className="text-[9px] text-neutral-600">png/jpg · ≤4MB</div>
                  </div>
                )}
              </button>
            </div>
            <div className="space-y-2.5">
              <Field label="name">
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} disabled={busy} placeholder="Peanut the Squirrel" className={inputCls} />
              </Field>
              <Field label="symbol / ticker">
                <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={10} disabled={busy} placeholder="PNUT" className={`${inputCls} uppercase`} />
              </Field>
            </div>
          </div>

          <Field label="description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} disabled={busy}
              placeholder="A short pitch for your coin..." className={`${inputCls} resize-none`} />
          </Field>

          <div className="grid sm:grid-cols-3 gap-2.5">
            <Field label="twitter / x" icon={<Twitter className="w-3 h-3" />}>
              <input value={twitter} onChange={(e) => setTwitter(e.target.value)} disabled={busy} placeholder="https://x.com/..." className={inputCls} />
            </Field>
            <Field label="telegram" icon={<Send className="w-3 h-3" />}>
              <input value={telegram} onChange={(e) => setTelegram(e.target.value)} disabled={busy} placeholder="https://t.me/..." className={inputCls} />
            </Field>
            <Field label="website" icon={<Globe className="w-3 h-3" />}>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} disabled={busy} placeholder="https://..." className={inputCls} />
            </Field>
          </div>

          <div className="border-t border-neutral-800 pt-4 grid sm:grid-cols-3 gap-2.5">
            <Field label="initial buy (sol)">
              <input value={initialBuy} onChange={(e) => setInitialBuy(e.target.value)} type="number" step="0.01" min="0" disabled={busy} className={inputCls} />
            </Field>
            <Field label="slippage %">
              <input value={slippage} onChange={(e) => setSlippage(e.target.value)} type="number" step="1" min="1" max="50" disabled={busy} className={inputCls} />
            </Field>
            <Field label="priority fee (sol)">
              <input value={priorityFee} onChange={(e) => setPriorityFee(e.target.value)} type="number" step="0.0001" min="0" disabled={busy} className={inputCls} />
            </Field>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-[11px] text-neutral-500 border-t border-neutral-800 pt-3">
            <span>est. cost ≈ <span className="text-amber-300">{cost.toFixed(4)} SOL</span></span>
            <span>· overhead ≈ {LAUNCH_OVERHEAD.toFixed(3)} SOL</span>
            <span className="ml-auto">balance: <span className="text-neutral-300">{bal.toFixed(4)} SOL</span></span>
          </div>

          {err && (
            <div className="flex items-start gap-2 text-[11px] text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-sm px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {err}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={launch}
              disabled={busy || cost > bal}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-sm text-[12px] font-semibold text-black bg-amber-400 hover:bg-amber-300 disabled:opacity-40 transition-colors uppercase tracking-wider"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              {busy ? 'launching...' : 'launch on pump.fun'}
            </button>
            {step === 'done' && (
              <button onClick={reset} className="px-4 py-2 rounded-sm text-[11px] uppercase tracking-wider border border-neutral-700 bg-black/40 hover:bg-black/60 text-neutral-300">
                new launch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress + result + history */}
      <div className="space-y-4">
        <div className="border border-neutral-800 rounded-md overflow-hidden bg-[#08090d]">
          <div className="px-3.5 py-2 border-b border-neutral-800 bg-[#0a0b10] text-[11px] text-neutral-400 uppercase tracking-[0.18em]">
            launch.console
          </div>
          <div className="p-4 h-[220px] overflow-y-auto bg-[#07080c] text-[12px] space-y-1.5">
            {progress.length === 0 ? (
              <div className="text-neutral-600">// idle — fill the form and hit launch</div>
            ) : progress.map((p, i) => (
              <div key={i} className="whitespace-pre-wrap">
                <span className="text-neutral-700">[{new Date(p.ts).toLocaleTimeString('en-GB', { hour12: false })}]</span>{' '}
                <span className={p.text.startsWith('error') ? 'text-rose-400' : p.text.includes('.ok') || p.text.includes('.confirmed') || p.text.includes('.live') ? 'text-emerald-400' : 'text-amber-300'}>
                  {p.text}
                </span>
              </div>
            ))}
            {busy && <div className="text-emerald-400">█<span className="animate-pulse">_</span></div>}
          </div>
        </div>

        {result && (
          <div className="border border-emerald-500/30 rounded-md overflow-hidden bg-emerald-500/[0.03]">
            <div className="px-3.5 py-2 border-b border-emerald-500/20 bg-emerald-500/[0.06] text-[11px] text-emerald-300 uppercase tracking-[0.18em] flex items-center gap-2">
              <Check className="w-3 h-3" /> coin.live
            </div>
            <div className="p-4 text-[12px] space-y-2">
              <div><span className="text-neutral-500">symbol</span> <span className="text-amber-300">${result.symbol}</span></div>
              <div className="break-all"><span className="text-neutral-500">mint</span> <span className="text-neutral-200 font-mono">{result.mint}</span>
                <button onClick={() => copy(result.mint)} className="ml-2 inline-flex items-center gap-1 text-neutral-500 hover:text-amber-300"><Copy className="w-3 h-3" /></button>
              </div>
              <a href={result.pumpfun_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 underline">
                open on pump.fun <ExternalLink className="w-3 h-3" />
              </a>
              <br />
              <a href={result.solscan_tx} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 underline">
                tx on solscan <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* History */}
        <div className="border border-neutral-800 rounded-md overflow-hidden bg-[#08090d]">
          <div className="px-3.5 py-2 border-b border-neutral-800 bg-[#0a0b10] text-[11px] text-neutral-400 uppercase tracking-[0.18em] flex items-center justify-between">
            <span>launch.history</span>
            <span className="text-neutral-600">{history.length} coins</span>
          </div>
          <div className="divide-y divide-neutral-900 max-h-[260px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-4 text-neutral-600 text-[12px]">// no launches yet</div>
            ) : history.map((h) => (
              <div key={h.id} className="px-4 py-2.5 text-[12px] flex items-center gap-3 hover:bg-amber-500/[0.03]">
                <div className="flex-1 min-w-0">
                  <div className="text-amber-300">${h.symbol}</div>
                  <div className="text-[10px] text-neutral-500 truncate font-mono">{h.mint}</div>
                </div>
                <a href={h.pumpfun_url} target="_blank" rel="noreferrer" className="text-amber-300 hover:text-amber-200">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-2.5 py-1.5 rounded-sm bg-black/40 border border-neutral-700 focus:border-amber-500/50 focus:outline-none text-[12px] text-neutral-200 placeholder:text-neutral-600 font-mono';

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 flex items-center gap-1">
        {icon} {label}
      </div>
      {children}
    </label>
  );
}
