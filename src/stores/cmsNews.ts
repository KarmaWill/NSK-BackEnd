import type { ProductCode } from '../lib/api';
import { beijingTodayDate } from './cmsNewsSchedule';

export type NewsDisplaySlot = 'HOME_GRID' | 'NEWS_LIST' | 'FEATURED';

export type CmsNewsStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';

export type CmsNewsItem = {
  id: string;
  productCode: ProductCode;
  cardTitle: string;
  heroTitle: string | null;
  summary: string;
  body: string | null;
  category: string;
  slug: string;
  coverImageUrl: string;
  coverImageHoverUrl: string | null;
  heroImageUrl: string | null;
  featuredBadge: string | null;
  imageAlt: string | null;
  displaySlots: NewsDisplaySlot[];
  sortOrder: number;
  status: CmsNewsStatus;
  /** 官网卡片/详情展示的日期（可与实际上线时间不同） */
  publishedAt: string | null;
  /** 定时上线时刻 ISO8601 */
  scheduledPublishAt: string | null;
  /** 定时发布时是否预占 Featured 槽位 */
  featuredReserveOnSchedule: boolean;
  createdAt: string;
  updatedAt: string;
};

export const NEWS_DISPLAY_SLOT_LABELS: Record<NewsDisplaySlot, string> = {
  HOME_GRID: '首页展示',
  NEWS_LIST: '列表网格',
  FEATURED: '列表 Featured',
};

export const NEWS_CATEGORY_PRESETS = [
  'Press Release',
  'Event Report',
  'Brand Story',
  'Team Spotlight',
] as const;

const STORAGE_KEY = 'clingo-cms-news-v2';

const DEFAULT_DISPLAY_SLOTS: NewsDisplaySlot[] = ['HOME_GRID', 'NEWS_LIST'];

function nowStamp() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function suggestSlug(cardTitle: string, existingSlugs: string[]): string {
  const base = slugify(cardTitle) || 'news-item';
  let candidate = base;
  let n = 2;
  while (existingSlugs.includes(candidate)) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

const SEED_NEWS: CmsNewsItem[] = [
  {
    id: 'news-seed-1',
    productCode: 'hsk_web',
    cardTitle: 'C-Lingo AIOS Launch: A New Era for Chinese Learning',
    heroTitle: 'C-Lingo AIOS Launch: Redefining Chinese Learning for Global Classrooms',
    summary:
      'C-Lingo unveils AIOS — an integrated platform combining curriculum, assessment, and AI-powered speaking practice for international learners.',
    body:
      '<h2>Built for Global Classrooms</h2><p>C-Lingo AIOS connects curriculum authoring, adaptive assessment, and conversational AI in one workflow.</p><ul><li>Unified content ops</li><li>HSK-aligned diagnostics</li><li>Speaking practice at scale</li></ul>',
    category: 'Press Release',
    slug: 'news-article',
    coverImageUrl: 'assets/news-product-matrix.png',
    coverImageHoverUrl: null,
    heroImageUrl: 'assets/news-product-matrix.png',
    featuredBadge: 'Launch Event',
    imageAlt: 'C-Lingo AIOS product matrix',
    displaySlots: ['HOME_GRID', 'NEWS_LIST', 'FEATURED'],
    sortOrder: 1,
    status: 'PUBLISHED',
    publishedAt: '2026-05-23',
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  },
  {
    id: 'news-seed-2',
    productCode: 'hsk_web',
    cardTitle: 'Education Vietnam 2026: C-Lingo on Stage',
    heroTitle: 'Education Vietnam 2026: Connecting Learners Across Southeast Asia',
    summary:
      'Our team shared how C-Lingo supports Vietnamese schools with HSK-ready curriculum and teacher dashboards.',
    body: '<p>Event highlights and partner conversations from Ho Chi Minh City.</p>',
    category: 'Event Report',
    slug: 'news-article-vietnam',
    coverImageUrl: 'assets/news-vietnam.png',
    coverImageHoverUrl: null,
    heroImageUrl: null,
    featuredBadge: null,
    imageAlt: 'Education Vietnam 2026',
    displaySlots: ['HOME_GRID', 'NEWS_LIST'],
    sortOrder: 2,
    status: 'PUBLISHED',
    publishedAt: '2026-04-12',
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  },
  {
    id: 'news-seed-3',
    productCode: 'hsk_web',
    cardTitle: 'Clarity. Confidence. Connection.',
    heroTitle: 'Clarity. Confidence. Connection. — Our Brand Story',
    summary: 'Why we build tools that help every learner speak Chinese with confidence, not fear.',
    body: '<p>Our mission is to make Chinese learning accessible, measurable, and joyful.</p>',
    category: 'Brand Story',
    slug: 'news-article-values',
    coverImageUrl: 'assets/news-values.png',
    coverImageHoverUrl: null,
    heroImageUrl: null,
    featuredBadge: null,
    imageAlt: 'C-Lingo brand values',
    displaySlots: ['HOME_GRID', 'NEWS_LIST'],
    sortOrder: 3,
    status: 'PUBLISHED',
    publishedAt: '2026-03-08',
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  },
];

function normalizeItem(raw: unknown, productCode: ProductCode): CmsNewsItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<CmsNewsItem> & { title?: string; imageUrl?: string };
  const cardTitle = (r.cardTitle || r.title || '').trim();
  if (!cardTitle || !r.id) return null;
  const slots = Array.isArray(r.displaySlots)
    ? (r.displaySlots.filter((s): s is NewsDisplaySlot =>
        s === 'HOME_GRID' || s === 'NEWS_LIST' || s === 'FEATURED',
      ) as NewsDisplaySlot[])
    : DEFAULT_DISPLAY_SLOTS;
  return {
    id: r.id,
    productCode: r.productCode === 'tablet_app' ? 'tablet_app' : productCode,
    cardTitle,
    heroTitle: r.heroTitle?.trim() || null,
    summary: (r.summary || '').trim(),
    body: r.body?.trim() || null,
    category: (r.category || '').trim(),
    slug: (r.slug || slugify(cardTitle)).trim(),
    coverImageUrl: (r.coverImageUrl || r.imageUrl || '').trim(),
    coverImageHoverUrl: r.coverImageHoverUrl?.trim() || null,
    heroImageUrl: r.heroImageUrl?.trim() || null,
    featuredBadge: r.featuredBadge?.trim() || null,
    imageAlt: r.imageAlt?.trim() || null,
    displaySlots: slots.length ? slots : (['NEWS_LIST'] as NewsDisplaySlot[]),
    sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : 0,
    status:
      r.status === 'PUBLISHED' ? 'PUBLISHED' : r.status === 'SCHEDULED' ? 'SCHEDULED' : 'DRAFT',
    publishedAt: r.publishedAt || null,
    scheduledPublishAt: r.scheduledPublishAt || null,
    featuredReserveOnSchedule: !!r.featuredReserveOnSchedule,
    createdAt: r.createdAt || nowStamp(),
    updatedAt: r.updatedAt || nowStamp(),
  };
}

export function loadLocalCmsNews(productCode: ProductCode): CmsNewsItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = SEED_NEWS.filter((n) => n.productCode === productCode);
      if (seeded.length) saveLocalCmsNews(productCode, seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Record<string, CmsNewsItem[]>;
    const list = (parsed[productCode] ?? [])
      .map((item) => normalizeItem(item, productCode))
      .filter(Boolean) as CmsNewsItem[];
    if (!list.length && productCode === 'hsk_web') {
      saveLocalCmsNews(productCode, SEED_NEWS);
      return SEED_NEWS;
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return productCode === 'hsk_web' ? SEED_NEWS : [];
  }
}

export function saveLocalCmsNews(productCode: ProductCode, items: CmsNewsItem[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, CmsNewsItem[]>) : {};
    parsed[productCode] = items;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export type NewsFormInput = Omit<CmsNewsItem, 'id' | 'productCode' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
  sortOrder?: number;
};

export type NewsValidationResult = { ok: true } | { ok: false; message: string };

export function validateNewsInput(
  input: NewsFormInput,
  existing: CmsNewsItem[],
  editingId?: string | null,
): NewsValidationResult {
  if (!input.cardTitle.trim()) return { ok: false, message: '请填写卡片标题' };
  if (!input.summary.trim()) return { ok: false, message: '请填写摘要' };
  if (!input.category.trim()) return { ok: false, message: '请选择或填写分类' };
  if (!input.slug.trim()) return { ok: false, message: '请填写 slug' };
  if (!input.coverImageUrl.trim()) return { ok: false, message: '请填写封面图' };
  if (!input.displaySlots.length) return { ok: false, message: '请至少选择一个展示位' };
  if (input.status === 'PUBLISHED' && !input.publishedAt) {
    return { ok: false, message: '发布时请填写展示日期' };
  }
  if (input.status === 'SCHEDULED') {
    if (!input.scheduledPublishAt) return { ok: false, message: '请设置定时上线时间' };
    if (new Date(input.scheduledPublishAt).getTime() <= Date.now()) {
      return { ok: false, message: '定时上线时间须为未来时刻' };
    }
    if (!input.publishedAt) return { ok: false, message: '定时发布时请填写展示日期' };
  }
  const slugTaken = existing.some((r) => r.slug === input.slug.trim() && r.id !== editingId);
  if (slugTaken) return { ok: false, message: 'slug 已存在，请更换' };
  return { ok: true };
}

export function occupiesFeaturedSlot(item: CmsNewsItem): boolean {
  if (!item.displaySlots.includes('FEATURED')) return false;
  if (item.status === 'PUBLISHED') return true;
  if (item.status === 'SCHEDULED' && item.featuredReserveOnSchedule) return true;
  return false;
}

export function findFeaturedNews(items: CmsNewsItem[], excludeId?: string) {
  return items.find((item) => item.id !== excludeId && occupiesFeaturedSlot(item));
}

export function applyFeaturedExclusive(items: CmsNewsItem[], featuredId: string): CmsNewsItem[] {
  return items.map((item) => {
    if (item.id === featuredId) return item;
    if (!item.displaySlots.includes('FEATURED')) return item;
    return {
      ...item,
      displaySlots: item.displaySlots.filter((s) => s !== 'FEATURED'),
      updatedAt: nowStamp(),
    };
  });
}

export function createLocalNews(productCode: ProductCode, input: NewsFormInput): CmsNewsItem {
  const existing = loadLocalCmsNews(productCode);
  const maxOrder = existing.reduce((m, r) => Math.max(m, r.sortOrder), 0);
  const item: CmsNewsItem = {
    id: `news-${Date.now()}`,
    productCode,
    cardTitle: input.cardTitle.trim(),
    heroTitle: input.heroTitle?.trim() || null,
    summary: input.summary.trim(),
    body: input.body?.trim() || null,
    category: input.category.trim(),
    slug: input.slug.trim(),
    coverImageUrl: input.coverImageUrl.trim(),
    coverImageHoverUrl: input.coverImageHoverUrl?.trim() || null,
    heroImageUrl: input.heroImageUrl?.trim() || null,
    featuredBadge: input.featuredBadge?.trim() || null,
    imageAlt: input.imageAlt?.trim() || null,
    displaySlots: [...input.displaySlots],
    sortOrder: input.sortOrder ?? maxOrder + 1,
    status: input.status,
    publishedAt: input.publishedAt,
    scheduledPublishAt: input.status === 'SCHEDULED' ? input.scheduledPublishAt : null,
    featuredReserveOnSchedule:
      input.status === 'SCHEDULED' ? input.featuredReserveOnSchedule : false,
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  };
  let next = [...existing, item];
  if (occupiesFeaturedSlot(item)) {
    next = applyFeaturedExclusive(next, item.id);
  }
  saveLocalCmsNews(productCode, next.sort((a, b) => a.sortOrder - b.sortOrder));
  return item;
}

export function updateLocalNews(productCode: ProductCode, id: string, input: NewsFormInput): CmsNewsItem {
  const existing = loadLocalCmsNews(productCode);
  const idx = existing.findIndex((r) => r.id === id);
  if (idx < 0) throw new Error('新闻不存在');
  const prev = existing[idx];
  const updated: CmsNewsItem = {
    ...prev,
    cardTitle: input.cardTitle.trim(),
    heroTitle: input.heroTitle?.trim() || null,
    summary: input.summary.trim(),
    body: input.body?.trim() || null,
    category: input.category.trim(),
    slug: input.slug.trim(),
    coverImageUrl: input.coverImageUrl.trim(),
    coverImageHoverUrl: input.coverImageHoverUrl?.trim() || null,
    heroImageUrl: input.heroImageUrl?.trim() || null,
    featuredBadge: input.featuredBadge?.trim() || null,
    imageAlt: input.imageAlt?.trim() || null,
    displaySlots: [...input.displaySlots],
    status: input.status,
    publishedAt: input.publishedAt,
    scheduledPublishAt: input.status === 'SCHEDULED' ? input.scheduledPublishAt : null,
    featuredReserveOnSchedule:
      input.status === 'SCHEDULED' ? input.featuredReserveOnSchedule : false,
    updatedAt: nowStamp(),
  };
  let next = existing.map((r) => (r.id === id ? updated : r));
  if (occupiesFeaturedSlot(updated)) {
    next = applyFeaturedExclusive(next, id);
  }
  saveLocalCmsNews(productCode, next.sort((a, b) => a.sortOrder - b.sortOrder));
  return updated;
}

export function deleteLocalNews(productCode: ProductCode, id: string) {
  const existing = loadLocalCmsNews(productCode);
  saveLocalCmsNews(
    productCode,
    existing.filter((r) => r.id !== id),
  );
}

export function reorderLocalNews(productCode: ProductCode, id: string, direction: 'up' | 'down') {
  const list = [...loadLocalCmsNews(productCode)].sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= list.length) return;
  const a = list[idx];
  const b = list[swapWith];
  list[idx] = { ...b, sortOrder: a.sortOrder };
  list[swapWith] = { ...a, sortOrder: b.sortOrder };
  saveLocalCmsNews(productCode, list.sort((x, y) => x.sortOrder - y.sortOrder));
}

export function formatNewsDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function processDueScheduledNews(productCode: ProductCode): {
  items: CmsNewsItem[];
  promotedIds: string[];
} {
  const items = loadLocalCmsNews(productCode);
  const now = Date.now();
  const promotedIds: string[] = [];
  let next = items.map((item) => {
    if (item.status !== 'SCHEDULED' || !item.scheduledPublishAt) return item;
    if (new Date(item.scheduledPublishAt).getTime() > now) return item;
    promotedIds.push(item.id);
    return {
      ...item,
      status: 'PUBLISHED' as const,
      scheduledPublishAt: null,
      featuredReserveOnSchedule: false,
      publishedAt: item.publishedAt || beijingTodayDate(),
      updatedAt: nowStamp(),
    };
  });
  for (const id of promotedIds) {
    const item = next.find((r) => r.id === id);
    if (item && item.displaySlots.includes('FEATURED')) {
      next = applyFeaturedExclusive(next, id);
    }
  }
  if (promotedIds.length) {
    next = next.sort((a, b) => a.sortOrder - b.sortOrder);
    saveLocalCmsNews(productCode, next);
  }
  return { items: next.sort((a, b) => a.sortOrder - b.sortOrder), promotedIds };
}

export function itemToApiPayload(item: Partial<CmsNewsItem> & { cardTitle?: string }) {
  return {
    title: item.cardTitle,
    summary: item.summary,
    body: item.body,
    category: item.category,
    slug: item.slug,
    imageUrl: item.coverImageUrl,
    sortOrder: item.sortOrder,
    status: item.status,
    publishedAt: item.publishedAt,
    scheduledPublishAt: item.scheduledPublishAt,
    featuredReserveOnSchedule: item.featuredReserveOnSchedule,
  };
}

export function fromApiRow(row: import('../lib/api').CmsNewsRow, productCode: ProductCode): CmsNewsItem {
  const cardTitle = row.cardTitle || row.title;
  const coverImageUrl = row.coverImageUrl || row.imageUrl || '';
  const slots = Array.isArray(row.displaySlots)
    ? (row.displaySlots.filter((s): s is NewsDisplaySlot =>
        s === 'HOME_GRID' || s === 'NEWS_LIST' || s === 'FEATURED',
      ) as NewsDisplaySlot[])
    : DEFAULT_DISPLAY_SLOTS;
  return {
    id: row.id,
    productCode,
    cardTitle,
    heroTitle: row.heroTitle?.trim() || cardTitle,
    summary: row.summary ?? '',
    body: row.body,
    category: row.category ?? '',
    slug: row.slug ?? slugify(cardTitle),
    coverImageUrl,
    coverImageHoverUrl: row.coverImageHoverUrl?.trim() || null,
    heroImageUrl: row.heroImageUrl?.trim() || coverImageUrl || null,
    featuredBadge: row.featuredBadge?.trim() || null,
    imageAlt: row.imageAlt?.trim() || null,
    displaySlots: slots.length ? slots : (['NEWS_LIST'] as NewsDisplaySlot[]),
    sortOrder: row.sortOrder ?? 0,
    status:
      row.status === 'PUBLISHED'
        ? 'PUBLISHED'
        : row.status === 'SCHEDULED'
          ? 'SCHEDULED'
          : 'DRAFT',
    publishedAt: row.publishedAt,
    scheduledPublishAt: row.scheduledPublishAt ?? null,
    featuredReserveOnSchedule: !!row.featuredReserveOnSchedule,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
