const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export function getToken() { return localStorage.getItem('skillup-token'); }
export function setToken(token) { token ? localStorage.setItem('skillup-token', token) : localStorage.removeItem('skillup-token'); }

export async function api(path, options = {}) {
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...options.headers };
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.message || `Request failed (${response.status})`);
  return payload;
}
export const json = (method, body) => ({ method, body: JSON.stringify(body) });
