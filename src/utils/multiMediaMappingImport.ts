import * as XLSX from 'xlsx';
import {
  isBookResourceFrameNumValid,
  isBookResourceMappingTypeValid,
  isBookResourcePageCodeFormatValid,
  normalizeBookResourcePageCode,
  normalizeBookResourceType,
  type BookResourceType,
} from '../config/bookResourceTypes';
import { validateCatalogImportFile } from './catalogImport';
import { sanitizeIsbn } from './libraryFieldValidation';

/** 多媒体映射导入单次最大有效数据行数 */
export const MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS = 500;

export type ParsedMultiMediaMappingRow = {
  rowIndex: number;
  resourceName: string;
  bookName: string;
  isbn: string;
  lessonId: string;
  type: number;
  pageCode: string;
  frameNum: number;
};

export type ParseMultiMediaMappingResult =
  | { ok: true; rows: ParsedMultiMediaMappingRow[] }
  | { ok: false; message: string };

export type MultiMediaMappingApplySkip = {
  rowIndex: number;
  resourceName: string;
  reason: string;
};

export type ApplyMultiMediaMappingResult<T> = {
  files: T[];
  updated: number;
  skipped: MultiMediaMappingApplySkip[];
};

type BookFileResourceLike = {
  id: string;
  type: BookResourceType | string;
  fileName: string;
  resourceName?: string;
  resourceId?: string;
  lessonId?: string;
  pageCode?: string;
  frameNum?: number;
  mappingType?: number;
};

const HEADER_ALIASES: Record<keyof Omit<ParsedMultiMediaMappingRow, 'rowIndex'>, string[]> = {
  resourceName: ['资源名称', 'resourceName', 'resource_name'],
  bookName: ['bookName', '书名', '书籍名称'],
  isbn: ['ISBN', 'isbn'],
  lessonId: ['lessonId', 'lesson_id', '课时ID'],
  type: ['Type', 'type', '资源类型'],
  pageCode: ['页码', 'pageCode', 'page_code', '页面编号'],
  frameNum: ['frame_num', 'frameNum', 'Frame', '帧序号'],
};

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function normalizeIsbn(value: string): string {
  return sanitizeIsbn(value).replace(/-/g, '');
}

function stripFileExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function buildHeaderIndex(headerRow: unknown[]): Partial<Record<keyof typeof HEADER_ALIASES, number>> {
  const index: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  headerRow.forEach((cell, col) => {
    const text = cellText(cell);
    if (!text) return;
    (Object.entries(HEADER_ALIASES) as Array<[keyof typeof HEADER_ALIASES, string[]]>).forEach(
      ([key, aliases]) => {
        if (aliases.some((alias) => alias.toLowerCase() === text.toLowerCase())) {
          index[key] = col;
        }
      },
    );
  });
  return index;
}

function readCell(row: unknown[], col: number | undefined): string {
  if (col == null) return '';
  return cellText(row[col]);
}

function parseFrameNum(raw: string): number | null {
  if (!raw) return 1;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

function parseType(raw: string): number | null {
  if (!raw) return null;
  const num = Number(raw);
  if (!Number.isInteger(num)) return null;
  return num;
}

export function parseMultiMediaMappingWorkbook(buffer: ArrayBuffer): ParseMultiMediaMappingResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: false, message: '表格为空，请检查文件内容' };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
  }) as unknown[][];

  if (rows.length < 2) {
    return { ok: false, message: '表格至少需要表头行与一行数据' };
  }

  const headerIndex = buildHeaderIndex(rows[0] ?? []);
  const requiredHeaders: Array<keyof typeof HEADER_ALIASES> = [
    'resourceName',
    'bookName',
    'isbn',
    'lessonId',
    'type',
    'pageCode',
    'frameNum',
  ];
  const missing = requiredHeaders.filter((key) => headerIndex[key] == null);
  if (missing.length > 0) {
    return {
      ok: false,
      message: `表头缺少必要列：${missing.join('、')}，请下载模板对照填写`,
    };
  }

  const parsed: ParsedMultiMediaMappingRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const resourceName = readCell(row, headerIndex.resourceName);
    if (!resourceName) continue;

    const pageCode = normalizeBookResourcePageCode(readCell(row, headerIndex.pageCode));
    if (!isBookResourcePageCodeFormatValid(pageCode)) {
      return { ok: false, message: `第 ${i + 1} 行页码格式无效，应为 P002V 等形式` };
    }

    const frameNum = parseFrameNum(readCell(row, headerIndex.frameNum));
    if (frameNum == null || !isBookResourceFrameNumValid(frameNum)) {
      return { ok: false, message: `第 ${i + 1} 行 frame_num 无效，应为大于等于 1 的整数` };
    }

    const type = parseType(readCell(row, headerIndex.type));
    if (type == null || !isBookResourceMappingTypeValid(type)) {
      return {
        ok: false,
        message: `第 ${i + 1} 行 Type 无效，情景视频填 1，交际训练填 2`,
      };
    }

    parsed.push({
      rowIndex: i + 1,
      resourceName,
      bookName: readCell(row, headerIndex.bookName),
      isbn: readCell(row, headerIndex.isbn),
      lessonId: readCell(row, headerIndex.lessonId),
      type,
      pageCode,
      frameNum,
    });
  }

  if (parsed.length === 0) {
    return { ok: false, message: '未解析到有效数据行，请检查表格内容' };
  }

  if (parsed.length > MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      message: `导入行数不能超过 ${MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS} 行，请拆分表格后分批导入`,
    };
  }

  return { ok: true, rows: parsed };
}

function matchesResourceName(file: BookFileResourceLike, resourceName: string): boolean {
  const normalized = resourceName.trim();
  if (!normalized) return false;
  if (file.resourceName === normalized) return true;
  if (file.fileName === normalized) return true;
  if (stripFileExtension(file.fileName) === normalized) return true;
  return false;
}

function findMatchingMediaFile(
  files: BookFileResourceLike[],
  row: ParsedMultiMediaMappingRow,
): BookFileResourceLike | undefined {
  const mediaFiles = files.filter((file) => normalizeBookResourceType(file.type) === 'MULTI_MEDIA');
  return (
    mediaFiles.find((file) => file.resourceId && file.resourceId === row.lessonId) ??
    mediaFiles.find((file) => file.lessonId && file.lessonId === row.lessonId) ??
    mediaFiles.find((file) => matchesResourceName(file, row.resourceName))
  );
}

export function applyMultiMediaMappings<T extends BookFileResourceLike>(
  rows: ParsedMultiMediaMappingRow[],
  files: T[],
  options: { bookIsbn: string; bookTitle?: string },
): ApplyMultiMediaMappingResult<T> {
  const expectedIsbn = normalizeIsbn(options.bookIsbn);
  const skipped: MultiMediaMappingApplySkip[] = [];
  let updated = 0;

  const nextFiles = files.map((file) => ({ ...file }));

  for (const row of rows) {
    if (!isBookResourceMappingTypeValid(row.type)) {
      skipped.push({
        rowIndex: row.rowIndex,
        resourceName: row.resourceName,
        reason: `Type=${row.type} 不在支持范围内（1 情景视频 / 2 交际训练）`,
      });
      continue;
    }

    const rowIsbn = normalizeIsbn(row.isbn);
    if (expectedIsbn && rowIsbn && rowIsbn !== expectedIsbn) {
      skipped.push({
        rowIndex: row.rowIndex,
        resourceName: row.resourceName,
        reason: `ISBN 与当前书籍不一致（${row.isbn}）`,
      });
      continue;
    }

    const target = findMatchingMediaFile(nextFiles, row);
    if (!target) {
      skipped.push({
        rowIndex: row.rowIndex,
        resourceName: row.resourceName,
        reason: '未找到已挂载的多媒体资源，请先添加对应 .mp4',
      });
      continue;
    }

    const index = nextFiles.findIndex((file) => file.id === target.id);
    if (index < 0) continue;

    nextFiles[index] = {
      ...nextFiles[index],
      resourceName: row.resourceName,
      resourceId: row.lessonId || nextFiles[index].resourceId,
      lessonId: row.lessonId,
      mappingType: row.type,
      pageCode: row.pageCode,
      frameNum: row.frameNum,
    };
    updated += 1;
  }

  return { files: nextFiles, updated, skipped };
}

export function validateMultiMediaMappingImportFile(
  file: File,
): { ok: true } | { ok: false; message: string } {
  return validateCatalogImportFile(file);
}
