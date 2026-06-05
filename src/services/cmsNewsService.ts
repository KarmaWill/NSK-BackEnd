import { reorderBySortOrder } from '../panels/librarySortable';
import {
  createCmsNews,
  deleteCmsNews,
  listCmsNews,
  updateCmsNews,
  type ProductCode,
} from '../lib/api';
import {
  createLocalNews,
  deleteLocalNews,
  fromApiRow,
  itemToApiPayload,
  loadLocalCmsNews,
  processDueScheduledNews,
  saveLocalCmsNews,
  updateLocalNews,
  type CmsNewsItem,
  type NewsFormInput,
} from '../stores/cmsNews';
import { beijingTodayDate } from '../stores/cmsNewsSchedule';

export type CmsNewsLoadResult = {
  items: CmsNewsItem[];
  source: 'remote' | 'local';
  autoPublishedIds?: string[];
};

function mergeWithLocalExtended(apiItems: CmsNewsItem[], localItems: CmsNewsItem[]): CmsNewsItem[] {
  const localMap = new Map(localItems.map((item) => [item.id, item]));
  return apiItems.map((api) => {
    const local = localMap.get(api.id);
    if (!local) return api;
    return {
      ...api,
      heroTitle: local.heroTitle ?? api.heroTitle,
      coverImageHoverUrl: local.coverImageHoverUrl,
      heroImageUrl: local.heroImageUrl ?? api.heroImageUrl,
      featuredBadge: local.featuredBadge,
      imageAlt: local.imageAlt,
      displaySlots: local.displaySlots.length ? local.displaySlots : api.displaySlots,
      status: local.status ?? api.status,
      scheduledPublishAt: local.scheduledPublishAt ?? api.scheduledPublishAt,
      featuredReserveOnSchedule:
        local.featuredReserveOnSchedule ?? api.featuredReserveOnSchedule,
    };
  });
}

function itemToFormInput(item: CmsNewsItem): NewsFormInput {
  return {
    cardTitle: item.cardTitle,
    heroTitle: item.heroTitle,
    summary: item.summary,
    body: item.body,
    category: item.category,
    slug: item.slug,
    coverImageUrl: item.coverImageUrl,
    coverImageHoverUrl: item.coverImageHoverUrl,
    heroImageUrl: item.heroImageUrl,
    featuredBadge: item.featuredBadge,
    imageAlt: item.imageAlt,
    displaySlots: item.displaySlots,
    status: item.status,
    publishedAt: item.publishedAt,
    scheduledPublishAt: item.scheduledPublishAt,
    featuredReserveOnSchedule: item.featuredReserveOnSchedule,
  };
}

async function trySyncCreate(productCode: ProductCode, input: NewsFormInput) {
  await createCmsNews(productCode, itemToApiPayload(input) as Parameters<typeof createCmsNews>[1]);
}

async function trySyncUpdate(id: string, input: NewsFormInput) {
  await updateCmsNews(id, itemToApiPayload(input));
}

async function trySyncDelete(id: string) {
  await deleteCmsNews(id);
}

export async function fetchCmsNews(productCode: ProductCode): Promise<CmsNewsLoadResult> {
  const { items: dueProcessed, promotedIds } = processDueScheduledNews(productCode);
  try {
    const rows = await listCmsNews(productCode);
    const apiItems = rows.map((row) => fromApiRow(row, productCode));
    const merged = mergeWithLocalExtended(apiItems, dueProcessed);
    saveLocalCmsNews(productCode, merged);
    return {
      items: merged.sort((a, b) => a.sortOrder - b.sortOrder),
      source: 'remote',
      autoPublishedIds: promotedIds.length ? promotedIds : undefined,
    };
  } catch {
    return {
      items: dueProcessed,
      source: 'local',
      autoPublishedIds: promotedIds.length ? promotedIds : undefined,
    };
  }
}

export async function saveCmsNews(
  productCode: ProductCode,
  input: NewsFormInput,
  editingId?: string | null,
): Promise<CmsNewsItem> {
  const item = editingId
    ? updateLocalNews(productCode, editingId, input)
    : createLocalNews(productCode, input);
  try {
    if (editingId) await trySyncUpdate(editingId, input);
    else await trySyncCreate(productCode, input);
  } catch {
    /* local saved; API optional */
  }
  return item;
}

export async function removeCmsNews(productCode: ProductCode, id: string) {
  deleteLocalNews(productCode, id);
  try {
    await trySyncDelete(id);
  } catch {
    /* local deleted */
  }
}

export async function reorderCmsNewsDrag(
  productCode: ProductCode,
  activeId: string,
  overId: string,
): Promise<CmsNewsItem[]> {
  const items = loadLocalCmsNews(productCode);
  const reordered = reorderBySortOrder(items, activeId, overId).sort((a, b) => a.sortOrder - b.sortOrder);
  saveLocalCmsNews(productCode, reordered);
  await Promise.all(
    reordered.map(async (item) => {
      try {
        await updateCmsNews(item.id, { sortOrder: item.sortOrder });
      } catch {
        /* local reordered */
      }
    }),
  );
  return reordered;
}

export async function toggleCmsNewsPublish(
  productCode: ProductCode,
  item: CmsNewsItem,
): Promise<CmsNewsItem> {
  if (item.status === 'SCHEDULED') {
    return publishCmsNewsNow(productCode, item);
  }
  const nextStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  const input: NewsFormInput = {
    ...itemToFormInput(item),
    status: nextStatus,
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
    publishedAt:
      nextStatus === 'PUBLISHED'
        ? item.publishedAt || beijingTodayDate()
        : item.publishedAt,
  };
  return saveCmsNews(productCode, input, item.id);
}

export async function cancelCmsNewsSchedule(
  productCode: ProductCode,
  item: CmsNewsItem,
): Promise<CmsNewsItem> {
  const input: NewsFormInput = {
    ...itemToFormInput(item),
    status: 'DRAFT',
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
  };
  return saveCmsNews(productCode, input, item.id);
}

export async function publishCmsNewsNow(
  productCode: ProductCode,
  item: CmsNewsItem,
): Promise<CmsNewsItem> {
  const input: NewsFormInput = {
    ...itemToFormInput(item),
    status: 'PUBLISHED',
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
    publishedAt: item.publishedAt || beijingTodayDate(),
  };
  return saveCmsNews(productCode, input, item.id);
}
