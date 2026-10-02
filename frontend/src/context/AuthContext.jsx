import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const r = await api.me();
      setUser(r.user);
    } catch (e) {
      console.warn('me failed', e);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loginEmail = async (email, password) => {
    const r = await api.login(email, password);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const signupEmail = async (email, password) => {
    const r = await api.signup(email, password);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const loginPhantom = async () => {
    if (typeof window === 'undefined' || !window.solana || !window.solana.isPhantom) {
      // Redirect to Phantom instead of showing an error
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        // Phantom universal link - opens app if installed, else the store
        const ref = encodeURIComponent(window.location.href);
        window.location.href = `https://phantom.app/ul/browse/${ref}?ref=${ref}`;
      } else {
        window.open('https://phantom.app/download', '_blank', 'noopener,noreferrer');
      }
      throw new Error('Opening Phantom...');
    }
    const resp = await window.solana.connect();
    const pubkey = resp.publicKey.toString();
    const message = `TrenchCrew sign-in · ${new Date().toISOString()}`;
    const encoded = new TextEncoder().encode(message);
    const signed = await window.solana.signMessage(encoded, 'utf8');
    const sigB58 = window.bs58 ? window.bs58.encode(signed.signature) : await encodeBase58(signed.signature);
    const r = await api.phantomLogin(pubkey, sigB58, message);
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };
  const logout = () => { setToken(null); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, loading, loginEmail, signupEmail, loginPhantom, logout, refresh, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() { return useContext(AuthCtx); }

// Minimal base58 encoder (no deps) — used only for Phantom signatures
const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
async function encodeBase58(bytes) {
  // bytes: Uint8Array
  let digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) { digits.push(carry % 58); carry = (carry / 58) | 0; }
  }
  let str = '';
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) str += '1';
  for (let i = digits.length - 1; i >= 0; i--) str += B58_ALPHABET[digits[i]];
  return str;
}
