/** 整本书资源类型（对应后端枚举） */
export type BookResourceType =
  | 'VIDEO'
  | 'POINT_READ'
  | 'GUIDANCE'
  | 'KNOWLEDGE_CARD'
  | 'MULTI_MEDIA'
  | 'POINT_READ_JWR';

type BookResourceTypeMeta = {
  label: string;
  /** 添加资源弹窗中是否可选 */
  selectable: boolean;
  description?: string;
};

export const BOOK_RESOURCE_TYPE_META: Record<BookResourceType, BookResourceTypeMeta> = {
  VIDEO: { label: '视频', selectable: true, description: '书本视频' },
  POINT_READ: { label: '点读-JWRT', selectable: false, description: '暂时未使用' },
  GUIDANCE: { label: '辅导-JWL', selectable: true, description: '辅导资源包' },
  KNOWLEDGE_CARD: { label: '知识卡-JWL', selectable: true, description: '知识卡资源包' },
  MULTI_MEDIA: {
    label: '多媒体',
    selectable: true,
    description: '含视频打点、页码等（rms_study_resource_mapping.page_num）',
  },
  POINT_READ_JWR: { label: '点读-JWR', selectable: true, description: '点读资源包' },
};

export const BOOK_RESOURCE_TYPE_SELECT_OPTIONS = (
  Object.entries(BOOK_RESOURCE_TYPE_META) as Array<[BookResourceType, BookResourceTypeMeta]>
)
  .filter(([, meta]) => meta.selectable)
  .map(([value, meta]) => ({ value, label: meta.label }));

const LEGACY_TYPE_MAP: Record<string, BookResourceType> = {
  JWL: 'GUIDANCE',
  JWR: 'POINT_READ_JWR',
  JWRT: 'POINT_READ',
};

/** 教材页面编号，如 P002V */
export const BOOK_RESOURCE_PAGE_CODE_PATTERN = /^P\d{3}[A-Z]$/;

export function normalizeBookResourceType(type: string): BookResourceType {
  if (type in BOOK_RESOURCE_TYPE_META) return type as BookResourceType;
  return LEGACY_TYPE_MAP[type] ?? 'GUIDANCE';
}

export function getBookResourceTypeLabel(type: BookResourceType | string): string {
  const normalized = normalizeBookResourceType(type);
  return BOOK_RESOURCE_TYPE_META[normalized]?.label ?? type;
}

export function bookResourceBadgeClass(type: BookResourceType | string): string {
  return `library-format-badge-${normalizeBookResourceType(type).toLowerCase().replace(/_/g, '-')}`;
}

export const ALL_BOOK_RESOURCE_FILTER_OPTIONS: Array<{ value: 'all' | BookResourceType; label: string }> = [
  { value: 'all', label: '全部类型' },
  ...(Object.entries(BOOK_RESOURCE_TYPE_META) as Array<[BookResourceType, BookResourceTypeMeta]>).map(
    ([value, meta]) => ({ value, label: meta.label }),
  ),
];

/** 多媒体（.mp4）需配置对应教材页面编号 */
export function bookResourceNeedsPageNum(type: BookResourceType | string): boolean {
  return normalizeBookResourceType(type) === 'MULTI_MEDIA';
}

/** 视频资源不适用页码映射 */
export function bookResourcePageNotApplicable(type: BookResourceType | string): boolean {
  return normalizeBookResourceType(type) === 'VIDEO';
}

export function normalizeBookResourcePageCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isBookResourcePageCodeFormatValid(pageCode: string): boolean {
  return BOOK_RESOURCE_PAGE_CODE_PATTERN.test(normalizeBookResourcePageCode(pageCode));
}

export function isBookResourcePageValid(
  type: BookResourceType | string,
  pageCode?: string,
): boolean {
  if (!bookResourceNeedsPageNum(type)) return true;
  if (!pageCode?.trim()) return false;
  return isBookResourcePageCodeFormatValid(pageCode);
}

export function formatBookResourcePageDisplay(pageCode?: string): string {
  const normalized = pageCode ? normalizeBookResourcePageCode(pageCode) : '';
  return normalized;
}
