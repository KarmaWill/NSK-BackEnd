export const LIBRARY_FIELD_LIMITS = {
  title: 50,
  description: 200,
  isbn: 20,
  authors: 50,
  featureTag: 20,
} as const;

const FORBIDDEN_TITLE_CHARS = /[<>{}\\/]/g;

/** 系列名称 / 书名：50 字符；禁止 < > { } \ / */
export function sanitizeTitleName(value: string): string {
  return value.replace(FORBIDDEN_TITLE_CHARS, '').slice(0, LIBRARY_FIELD_LIMITS.title);
}

/** 系列描述 / 书籍描述：200 字符，保留换行 */
export function sanitizeDescription(value: string): string {
  return value.slice(0, LIBRARY_FIELD_LIMITS.description);
}

/** ISBN：20 字符，仅 0-9 与 - */
export function sanitizeIsbn(value: string): string {
  return value.replace(/[^0-9-]/g, '').slice(0, LIBRARY_FIELD_LIMITS.isbn);
}

/** 作者/主编：50 字符；中英文、数字、空格、,，、.· */
export function sanitizeAuthorsInput(value: string): string {
  return value.replace(/[^\u4e00-\u9fffA-Za-z0-9\s,，、.·]/g, '').slice(0, LIBRARY_FIELD_LIMITS.authors);
}

export function parseAuthorsInput(value: string): string[] {
  return sanitizeAuthorsInput(value)
    .split(/[,，、]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

/** 自定义功能标签输入：20 字符；仅中文、英文字母、数字 */
export function sanitizeFeatureTagInput(value: string): string {
  return value.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').slice(0, LIBRARY_FIELD_LIMITS.featureTag);
}

export const LIBRARY_FIELD_HINTS = {
  title:
    '最多 50 字；允许中英文、空格、短横线、书名号、引号及带重音的外文字符；禁止 < > { } \\ /',
  description: '最多 200 字；允许常规中英文标点及换行',
  isbn: '最多 20 字；仅数字 0-9 与短横线 -',
  authors: '最多 50 字；允许中英文、数字、空格及 ,，、.· 分隔符',
  featureTag: '最多 20 字；仅中文、英文字母、数字，不含标点或空格',
} as const;
