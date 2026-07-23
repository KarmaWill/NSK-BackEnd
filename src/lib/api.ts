/** 开发模式默认走 Vite 同源代理 /api → localhost:3000，局域网访问 iPad 也能连 Mac 上的后端 */
import type { ExamDeliveryPackage, HskExamStoreSnapshot } from '../types/hskExams';

function resolveApiBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (env) return env;
  if (import.meta.env.DEV) return '';
  return 'http://localhost:3000';
}

const API_BASE = resolveApiBase();

export type ApiFetchOptions = RequestInit;

type JavaResponse<T> = {
  code: number;
  msg?: string;
  data?: T;
};

export type JavaPageResult<T> = { total: number; records: T[] };

export function usesDevApiProxy(): boolean {
  return Boolean(import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL);
}

export type ProductCode = 'hsk_web' | 'tablet_app';

export const PRODUCT_OPTIONS: { code: ProductCode; label: string; shortLabel: string }[] = [
  { code: 'hsk_web', label: 'C-Lingo 官网 (hsk_web)', shortLabel: 'C-Lingo 官网' },
  { code: 'tablet_app', label: 'NSK 平板 App (tablet_app)', shortLabel: 'NSK 平板 App' },
];

const TOKEN_KEY = 'clingo-admin-token';
const PRODUCT_KEY = 'clingo-active-product';

export function getApiBase(): string {
  if (API_BASE) return API_BASE;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
}

function isAbsoluteUrl(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

function joinPath(base: string, path: string): string {
  if (!base) return path || '';
  if (!path) return base;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function withPrefix(path: string, prefix: string): string {
  if (isAbsoluteUrl(path)) return path;
  return joinPath(prefix || '', path);
}

function resolveRequestUrl(path: string, base = API_BASE): string {
  if (isAbsoluteUrl(path)) return path;
  return base ? joinPath(base, path) : path;
}

function formatFetchError(err: unknown, path: string, targetUrl?: string): Error {
  if (err instanceof Error && /failed to fetch|networkerror|load failed/i.test(err.message)) {
    const target = targetUrl || `${getApiBase()}${path}`;
    const hint = targetUrl
      ? `请确认 API 可访问：${targetUrl}`
      : usesDevApiProxy()
      ? '请确认 API 后端已在 Mac 本机 3000 端口运行（Vite 会把 /api 转发过去）。'
      : `请确认 API 可访问：${getApiBase()}`;
    return new Error(`无法连接 API（${target}）。${hint}`);
  }
  if (err instanceof Error) return err;
  return new Error('登录失败');
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

export function getActiveProductLabel(): string {
  const code = getActiveProduct();
  return PRODUCT_OPTIONS.find((p) => p.code === code)?.shortLabel ?? PRODUCT_OPTIONS[0].shortLabel;
}

export function setActiveProduct(code: ProductCode): void {
  localStorage.setItem(PRODUCT_KEY, code);
  window.dispatchEvent(new CustomEvent('clingo-product-changed', { detail: code }));
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  return fetchJson<T>(path, options);
}

async function fetchJson<T>(
  path: string,
  options: ApiFetchOptions = {},
  base = API_BASE,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = resolveRequestUrl(path, base);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    throw formatFetchError(err, path, url);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorData = data as { error?: string; msg?: string };
    throw new Error(errorData.error || errorData.msg || `Request failed (${res.status})`);
  }
  if (data && typeof data === 'object' && typeof (data as JavaResponse<T>).code === 'number') {
    const javaData = data as JavaResponse<T>;
    if (javaData.code === 0) return javaData.data as T;
    throw new Error(javaData.msg || '接口请求失败');
  }
  return data as T;
}

function resolveJavaAdminPath(path: string): { path: string; base: string } {
  return {
    path: withPrefix(path, import.meta.env.VITE_CLINGO_ADMIN_PATH_PREFIX || '/admin'),
    base: (import.meta.env.VITE_CLINGO_ADMIN_API_BASE_URL || '').replace(/\/$/, ''),
  };
}

function resolveJavaExamPath(path: string): { path: string; base: string } {
  return {
    path: withPrefix(path, import.meta.env.VITE_CLINGO_EXAM_PATH_PREFIX || '/api'),
    base: (import.meta.env.VITE_CLINGO_EXAM_API_BASE_URL || '').replace(/\/$/, ''),
  };
}

function withJavaAuthHeader(options: ApiFetchOptions = {}): ApiFetchOptions {
  const headers = new Headers(options.headers);
  if (import.meta.env.DEV) {
    const devKey = import.meta.env.VITE_CLINGO_DEV_KEY;
    if (devKey) {
      headers.set(import.meta.env.VITE_CLINGO_AUTH_HEADER || 'X-Clingo-Dev-Key', devKey);
    }
  }
  return { ...options, headers };
}

export function unwrapPageRecords<T>(page: JavaPageResult<T> | T[]): T[] {
  return Array.isArray(page) ? page : page.records || [];
}

export function javaAdminFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const resolved = resolveJavaAdminPath(path);
  return fetchJson<T>(resolved.path, withJavaAuthHeader(options), resolved.base);
}

export function javaExamFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const resolved = resolveJavaExamPath(path);
  return fetchJson<T>(resolved.path, withJavaAuthHeader(options), resolved.base);
}

export type AuthUser = { id: string; username: string; role: string };

export async function login(username: string, password: string): Promise<AuthUser> {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_AUTH === '1') {
    setToken('dev-local-token');
    return { id: 'dev-local', username, role: 'ADMIN' };
  }
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

export type ApiUserRow = {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  _count: { feedbacks: number };
};

export async function listUsers(params?: { role?: string; q?: string }): Promise<ApiUserRow[]> {
  const qs = new URLSearchParams();
  if (params?.role) qs.set('role', params.role);
  if (params?.q) qs.set('q', params.q);
  const q = qs.toString();
  return apiFetch<ApiUserRow[]>(`/api/users${q ? `?${q}` : ''}`);
}

export type CmsNewsRow = {
  id: string;
  title: string;
  cardTitle?: string | null;
  heroTitle?: string | null;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  coverImageUrl?: string | null;
  coverImageHoverUrl?: string | null;
  heroImageUrl?: string | null;
  featuredBadge?: string | null;
  imageAlt?: string | null;
  displaySlots?: string[] | null;
  category: string | null;
  slug: string | null;
  linkUrl: string | null;
  sortOrder: number;
  status: string;
  publishedAt: string | null;
  scheduledPublishAt?: string | null;
  featuredReserveOnSchedule?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsBannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  placement: string;
  sortOrder: number;
  status: string;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listCmsNews(productCode: ProductCode, admin = true): Promise<CmsNewsRow[]> {
  const qs = new URLSearchParams({ productCode });
  if (admin) qs.set('admin', '1');
  return apiFetch<CmsNewsRow[]>(`/api/cms/news?${qs}`);
}

export async function createCmsNews(
  productCode: ProductCode,
  data: Partial<CmsNewsRow> & { title: string },
): Promise<CmsNewsRow> {
  return apiFetch<CmsNewsRow>('/api/cms/news', {
    method: 'POST',
    body: JSON.stringify({ productCode, ...data }),
  });
}

export async function updateCmsNews(id: string, data: Partial<CmsNewsRow>): Promise<CmsNewsRow> {
  return apiFetch<CmsNewsRow>(`/api/cms/news/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCmsNews(id: string): Promise<void> {
  await apiFetch(`/api/cms/news/${id}`, { method: 'DELETE' });
}

export async function listCmsBanners(
  productCode: ProductCode,
  opts?: { placement?: string; admin?: boolean },
): Promise<CmsBannerRow[]> {
  const qs = new URLSearchParams({ productCode });
  if (opts?.placement) qs.set('placement', opts.placement);
  if (opts?.admin !== false) qs.set('admin', '1');
  return apiFetch<CmsBannerRow[]>(`/api/cms/banners?${qs}`);
}

export async function createCmsBanner(
  productCode: ProductCode,
  data: Partial<CmsBannerRow> & { title: string },
): Promise<CmsBannerRow> {
  return apiFetch<CmsBannerRow>('/api/cms/banners', {
    method: 'POST',
    body: JSON.stringify({ productCode, ...data }),
  });
}

export async function updateCmsBanner(id: string, data: Partial<CmsBannerRow>): Promise<CmsBannerRow> {
  return apiFetch<CmsBannerRow>(`/api/cms/banners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCmsBanner(id: string): Promise<void> {
  await apiFetch(`/api/cms/banners/${id}`, { method: 'DELETE' });
}

export async function fetchHskExamDelivery(examId: string): Promise<ExamDeliveryPackage> {
  return javaExamFetch<ExamDeliveryPackage>(`/exams/${encodeURIComponent(examId)}/delivery`);
}

export async function fetchHskSnapshot(): Promise<HskExamStoreSnapshot> {
  return apiFetch<HskExamStoreSnapshot>('/api/hsk/snapshot');
}

export async function putHskSnapshot(
  snapshot: HskExamStoreSnapshot,
): Promise<{ ok: true; updatedAt: string }> {
  return apiFetch<{ ok: true; updatedAt: string }>('/api/hsk/snapshot', {
    method: 'PUT',
    body: JSON.stringify(snapshot),
  });
}
