import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MASCOTS } from '../components/Mascots';
import { Mail, Lock, ArrowRight, Wallet, Loader2 } from 'lucide-react';

export default function Auth() {
  const nav = useNavigate();
  const { loginEmail, signupEmail, loginPhantom } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phantomLoading, setPhantomLoading] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      if (mode === 'login') await loginEmail(email, password);
      else await signupEmail(email, password);
      nav('/trade');
    } catch (e) {
      setErr(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const connectPhantom = async () => {
    setErr(''); setPhantomLoading(true);
    try {
      await loginPhantom();
      nav('/trade');
    } catch (e) {
      setErr(e.message || 'Phantom connection failed');
    } finally {
      setPhantomLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex items-center justify-center px-6 py-16">
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-orange-500/10 blur-[160px] rounded-full" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-10 justify-center">
          <MASCOTS.crew.Component className="w-10 h-10" />
          <span className="font-semibold text-lg">TrenchCrew</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#0d0d10] p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              {mode === 'login' ? 'Welcome back' : 'Create your crew'}
            </h1>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            {mode === 'login' ? 'Sign in to continue trading.' : 'Spin up your private trading crew.'}
          </p>

          <button
            onClick={connectPhantom}
            disabled={phantomLoading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-60 transition-colors"
          >
            {phantomLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Continue with Phantom
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-neutral-500">
            <div className="flex-1 h-px bg-white/10" />
            or email
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <div className="text-xs text-neutral-400 mb-1.5">Email</div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </label>
            <label className="block">
              <div className="text-xs text-neutral-400 mb-1.5">Password</div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-black/40 border border-white/10 focus:border-orange-500/50 focus:outline-none text-sm"
                  placeholder="At least 6 characters"
                />
              </div>
            </label>
            {err && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{err}</div>}
            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 disabled:opacity-60 transition-colors shadow-[0_8px_24px_-6px_rgba(249,115,22,0.5)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'login' ? 'Sign in' : 'Create account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-400">
            {mode === 'login' ? (
              <>No account? <button onClick={() => setMode('signup')} className="text-orange-400 hover:underline">Sign up</button></>
            ) : (
              <>Already have one? <button onClick={() => setMode('login')} className="text-orange-400 hover:underline">Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
