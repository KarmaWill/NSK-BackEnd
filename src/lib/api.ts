const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:3000';

export type ProductCode = 'hsk_web' | 'tablet_app';

export const PRODUCT_OPTIONS: { code: ProductCode; label: string }[] = [
  { code: 'hsk_web', label: 'C-Lingo 官网 (hsk_web)' },
  { code: 'tablet_app', label: 'NSK 平板 App (tablet_app)' },
];

const TOKEN_KEY = 'clingo-admin-token';
const PRODUCT_KEY = 'clingo-active-product';

export function getApiBase(): string {
  return API_BASE;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getActiveProduct(): ProductCode {
  const raw = localStorage.getItem(PRODUCT_KEY);
  if (raw === 'tablet_app' || raw === 'hsk_web') return raw;
  return 'hsk_web';
}

export function setActiveProduct(code: ProductCode): void {
  localStorage.setItem(PRODUCT_KEY, code);
  window.dispatchEvent(new CustomEvent('clingo-product-changed', { detail: code }));
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export type AuthUser = { id: string; username: string; role: string };

export async function login(username: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{
    token: string;
    user: AuthUser;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.user;
}

export function logout(): void {
  setToken(null);
}

export type FeedbackRow = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  product: { name: string; code: string };
  user: { username: string };
};

export async function listFeedback(params?: {
  status?: string;
  productCode?: string;
}): Promise<FeedbackRow[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.productCode) qs.set('productCode', params.productCode);
  const q = qs.toString();
  return apiFetch<FeedbackRow[]>(`/api/feedback${q ? `?${q}` : ''}`);
}

export async function patchFeedbackStatus(
  feedbackId: string,
  status: string,
): Promise<FeedbackRow> {
  return apiFetch<FeedbackRow>('/api/feedback', {
    method: 'PATCH',
    body: JSON.stringify({ feedbackId, status }),
  });
}

export async function getProductConfig(code: ProductCode): Promise<Record<string, string>> {
  const data = await apiFetch<{ configs: Record<string, string> }>(
    `/api/products/${code}/config`,
  );
  return data.configs;
}

export async function upsertProductConfig(
  code: ProductCode,
  key: string,
  value: string,
): Promise<void> {
  await apiFetch(`/api/products/${code}/config`, {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
