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
  resourceId: string;
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

const LEGACY_HEADER_ALIASES: Record<
  'resourceName' | 'bookName' | 'isbn' | 'resourceId' | 'type' | 'pageCode' | 'frameNum',
  string[]
> = {
  resourceName: ['资源名称', 'resourceName', 'resource_name'],
  bookName: ['bookName', '书名', '书籍名称', '教材名称'],
  isbn: ['ISBN', 'isbn'],
  resourceId: ['资源ID', 'resourceId', 'resource_id', 'lessonId', 'lesson_id', '课时ID', 'ID'],
  type: ['Type', 'type', '资源类型'],
  pageCode: ['页码', 'pageCode', 'page_code', '页面编号'],
  frameNum: ['frame_num', 'frameNum', 'Frame', '帧序号', '按钮编号'],
};

const LEGACY_HEADER_LABELS: Record<keyof typeof LEGACY_HEADER_ALIASES, string> = {
  resourceName: '资源名称',
  bookName: 'bookName',
  isbn: 'ISBN',
  resourceId: '资源ID',
  type: 'Type',
  pageCode: '页码',
  frameNum: 'frame_num',
};

const EXPORT_HEADER_ALIASES = {
  seq: ['序号'],
  bookName: ['教材名称', 'bookName', '书名'],
  isbn: ['ISBN', 'isbn'],
  pageCode: ['页码', 'pageCode', '页面编号'],
  frameNum: ['按钮编号', 'frame_num', 'frameNum', 'Frame', '帧序号'],
  resourceType: ['资源类型', 'type', 'Type'],
  resourceId: ['ID', '资源ID', 'resourceId', 'resource_id'],
  resourceName: ['资源名称', 'resourceName', 'resource_name'],
} as const;

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

function buildHeaderIndex<T extends string>(
  headerRow: unknown[],
  aliases: Record<T, readonly string[]>,
): Partial<Record<T, number>> {
  const index: Partial<Record<T, number>> = {};
  headerRow.forEach((cell, col) => {
    const text = cellText(cell);
    if (!text) return;
    (Object.entries(aliases) as Array<[T, readonly string[]]>).forEach(([key, names]) => {
      if (names.some((alias) => alias.toLowerCase() === text.toLowerCase())) {
        index[key] = col;
      }
    });
  });
  return index;
}

function readCell(row: unknown[], col: number | undefined): string {
  if (col == null) return '';
  return cellText(row[col]);
}

function parseFrameNum(raw: string, allowEmptyDefault = true): number | null {
  if (!raw) return allowEmptyDefault ? 1 : null;
  const num = Number(raw);
  if (!Number.isInteger(num) || num < 1) return null;
  return num;
}

function parseMappingType(raw: string): number {
  const lower = raw.trim().toLowerCase();
  if (lower === 'video' || lower === '情景视频') return 1;
  if (lower === '交际训练' || lower === 'commun') return 2;
  const num = Number(raw);
  if (Number.isInteger(num) && isBookResourceMappingTypeValid(num)) return num;
  return 2;
}

function isExportMappingFormat(headerRow: unknown[]): boolean {
  const index = buildHeaderIndex(headerRow, EXPORT_HEADER_ALIASES);
  return index.resourceId != null && index.resourceName != null && index.pageCode != null;
}

function parseExportFormatWorkbook(rows: unknown[][]): ParseMultiMediaMappingResult {
  const headerIndex = buildHeaderIndex(rows[0] ?? [], EXPORT_HEADER_ALIASES);
  const required: Array<keyof typeof EXPORT_HEADER_ALIASES> = [
    'bookName',
    'isbn',
    'resourceId',
    'resourceName',
    'pageCode',
    'frameNum',
  ];
  const missing = required.filter((key) => headerIndex[key] == null);
  if (missing.length > 0) {
    return {
      ok: false,
      message: `表头缺少必要列：${missing.join('、')}，请使用「导出映射表」生成的 Excel`,
    };
  }

  const parsed: ParsedMultiMediaMappingRow[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? [];
    const resourceName = readCell(row, headerIndex.resourceName);
    const resourceId = readCell(row, headerIndex.resourceId);
    if (!resourceName && !resourceId) continue;

    const pageRaw = readCell(row, headerIndex.pageCode);
    if (!pageRaw) continue;

    const pageCode = normalizeBookResourcePageCode(pageRaw);
    if (!isBookResourcePageCodeFormatValid(pageCode)) {
      return { ok: false, message: `第 ${i + 1} 行页码格式无效，应为 P002V 等形式` };
    }

    const frameNum = parseFrameNum(readCell(row, headerIndex.frameNum));
    if (frameNum == null || !isBookResourceFrameNumValid(frameNum)) {
      return { ok: false, message: `第 ${i + 1} 行按钮编号无效，应为大于等于 1 的整数` };
    }

    const type = parseMappingType(readCell(row, headerIndex.resourceType));

    parsed.push({
      rowIndex: i + 1,
      resourceName,
      bookName: readCell(row, headerIndex.bookName),
      isbn: readCell(row, headerIndex.isbn),
      resourceId,
      type,
      pageCode,
      frameNum,
    });
  }

  if (parsed.length === 0) {
    return { ok: false, message: '未解析到可导入的数据，请先在表格中填写「页码」列' };
  }

  if (parsed.length > MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      message: `导入行数不能超过 ${MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS} 行，请拆分表格后分批导入`,
    };
  }

  return { ok: true, rows: parsed };
}

function parseLegacyFormatWorkbook(rows: unknown[][]): ParseMultiMediaMappingResult {
  const headerIndex = buildHeaderIndex(rows[0] ?? [], LEGACY_HEADER_ALIASES);
  const requiredHeaders: Array<keyof typeof LEGACY_HEADER_ALIASES> = [
    'resourceName',
    'bookName',
    'isbn',
    'resourceId',
    'type',
    'pageCode',
    'frameNum',
  ];
  const missing = requiredHeaders.filter((key) => headerIndex[key] == null);
  if (missing.length > 0) {
    return {
      ok: false,
      message: `表头缺少必要列：${missing.map((key) => LEGACY_HEADER_LABELS[key]).join('、')}，请导出映射表后填写`,
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

    const typeRaw = readCell(row, headerIndex.type);
    const type = parseMappingType(typeRaw);
    if (!isBookResourceMappingTypeValid(type)) {
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
      resourceId: readCell(row, headerIndex.resourceId),
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

  if (isExportMappingFormat(rows[0] ?? [])) {
    return parseExportFormatWorkbook(rows);
  }

  return parseLegacyFormatWorkbook(rows);
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
  const normalizedId = row.resourceId.trim();
  return (
    mediaFiles.find((file) => file.resourceId && file.resourceId === normalizedId) ??
    mediaFiles.find((file) => file.lessonId && file.lessonId === normalizedId) ??
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
      resourceName: row.resourceName || nextFiles[index].resourceName,
      resourceId: row.resourceId || nextFiles[index].resourceId,
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
