// Lightweight API client
const BASE = process.env.REACT_APP_BACKEND_URL;
const API = `${BASE}/api`;

function getToken() {
  return localStorage.getItem('tc_token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export const api = {
  signup: (email, password) => request('/auth/signup', { method: 'POST', body: { email, password }, auth: false }),
  login:  (email, password) => request('/auth/login',  { method: 'POST', body: { email, password }, auth: false }),
  phantomLogin: (pubkey, signature, message) => request('/auth/phantom', { method: 'POST', body: { pubkey, signature, message }, auth: false }),
  me: () => request('/me'),
  depositAddress: () => request('/deposit-address', { auth: false }),
  verifyDeposit: (tx_signature) => request('/deposit/verify', { method: 'POST', body: { tx_signature } }),
  withdraw: (destination, amount_sol) => request('/withdraw', { method: 'POST', body: { destination, amount_sol } }),
  transactions: () => request('/transactions'),
  coins: () => request('/coins', { auth: false }),
  risks: () => request('/trading/risks', { auth: false }),
  startTrading: (risk) => request('/trading/start', { method: 'POST', body: { risk } }),
  stopTrading: () => request('/trading/stop', { method: 'POST' }),
  tradingState: () => request('/trading/state'),
  chat: (text, session_id, model) => request('/chat', { method: 'POST', body: { text, session_id, model } }),
  launchUpload: async (formData) => {
    const t = getToken();
    const res = await fetch(`${API}/launch/upload`, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: formData,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) throw new Error((data && (data.detail || data.message)) || `HTTP ${res.status}`);
    return data;
  },
  launchCreate: (payload) => request('/launch/create', { method: 'POST', body: payload }),
  launchHistory: () => request('/launch/history'),
};

export function setToken(token) {
  if (token) localStorage.setItem('tc_token', token);
  else localStorage.removeItem('tc_token');
}

export { getToken };
