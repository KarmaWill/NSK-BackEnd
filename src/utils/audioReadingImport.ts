import * as XLSX from 'xlsx';
import { validateCatalogImportFile } from './catalogImport';

export const AUDIO_READING_IMPORT_HEADERS = [
  '书本名称',
  '书本ISBN',
  '单元名称',
  '资源ID',
  '资源类型',
  '音频名称',
  '原文',
  '拼音',
] as const;

export const AUDIO_READING_LIMITS = {
  nameId: 30,
  name: 30,
  namePinyin: 180,
  sentence: 200,
  sentencePinyin: 1000,
} as const;

export const AUDIO_READING_IMPORT_MAX_ROWS = 2000;

export type ParsedAudioReadingImportRow = {
  rowIndex: number;
  bookName: string;
  bookIsbn: string;
  unitName: string;
  resourceId: string;
  resourceType: string;
  audioName: string;
  text: string;
  pinyin: string;
};

export type ParseAudioReadingImportResult =
  | { ok: true; rows: ParsedAudioReadingImportRow[] }
  | { ok: false; message: string };

const HEADER_ALIASES: Record<keyof Omit<ParsedAudioReadingImportRow, 'rowIndex'>, string[]> = {
  bookName: ['书本名称', 'bookName', '书名', '教材名称'],
  bookIsbn: ['书本ISBN', 'ISBN', 'isbn', '书本Isbn'],
  unitName: ['单元名称', 'unitName', '单元'],
  resourceId: ['资源ID', 'resourceId', 'resource_id', 'NameID', 'nameId'],
  resourceType: ['资源类型', 'resourceType', 'type', 'Type'],
  audioName: ['音频名称', 'audioName', 'audio', '音频'],
  text: ['原文', 'text', '中文', '句子', 'CN'],
  pinyin: ['拼音', 'pinyin', 'py'],
};

function cellText(value: unknown): string {
  if (value == null) return '';
  return String(value).trim();
}

function stripAudioExtension(name: string): string {
  return name.replace(/\.[^.]+$/i, '');
}

function resolveHeaderIndex(headerRow: unknown[]): Partial<Record<keyof typeof HEADER_ALIASES, number>> {
  const index: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
  headerRow.forEach((cell, col) => {
    const text = cellText(cell);
    if (!text) return;
    (Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]).forEach((key) => {
      if (index[key] != null) return;
      if (HEADER_ALIASES[key].some((alias) => text === alias || text.includes(alias))) {
        index[key] = col;
      }
    });
  });
  return index;
}

function readCell(row: unknown[], col?: number): string {
  if (col == null) return '';
  return cellText(row[col]);
}

function validateRow(row: ParsedAudioReadingImportRow): string | null {
  if (!row.bookName) return `第 ${row.rowIndex} 行：缺少书本名称`;
  if (!row.unitName) return `第 ${row.rowIndex} 行：缺少单元名称`;
  if (!row.resourceId) return `第 ${row.rowIndex} 行：缺少资源ID`;
  if (row.resourceId.length > AUDIO_READING_LIMITS.nameId) {
    return `第 ${row.rowIndex} 行：资源ID 超过 ${AUDIO_READING_LIMITS.nameId} 字`;
  }
  if (!row.text) return `第 ${row.rowIndex} 行：缺少原文`;
  if (row.text.length > AUDIO_READING_LIMITS.sentence) {
    return `第 ${row.rowIndex} 行：原文超过 ${AUDIO_READING_LIMITS.sentence} 字`;
  }
  if (row.pinyin.length > AUDIO_READING_LIMITS.sentencePinyin) {
    return `第 ${row.rowIndex} 行：拼音超过 ${AUDIO_READING_LIMITS.sentencePinyin} 字`;
  }
  return null;
}

export function parseAudioReadingWorkbook(buffer: ArrayBuffer): ParseAudioReadingImportResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { ok: false, message: '表格为空，请检查文件内容' };

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], {
    header: 1,
    defval: '',
  });

  if (!rawRows.length) return { ok: false, message: '未解析到任何数据行' };

  const headerIndex = resolveHeaderIndex(rawRows[0] ?? []);
  const requiredKeys: (keyof typeof HEADER_ALIASES)[] = [
    'bookName',
    'unitName',
    'resourceId',
    'text',
  ];
  const missing = requiredKeys.filter((key) => headerIndex[key] == null);
  if (missing.length) {
    return {
      ok: false,
      message: `表头缺少必填列：${missing.map((k) => HEADER_ALIASES[k][0]).join('、')}`,
    };
  }

  const parsed: ParsedAudioReadingImportRow[] = [];
  for (let i = 1; i < rawRows.length; i += 1) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;

    const bookName = readCell(row, headerIndex.bookName);
    const unitName = readCell(row, headerIndex.unitName);
    const resourceId = readCell(row, headerIndex.resourceId);
    const text = readCell(row, headerIndex.text);
    const resourceType = readCell(row, headerIndex.resourceType);
    const audioName = readCell(row, headerIndex.audioName);
    const pinyin = readCell(row, headerIndex.pinyin);
    const bookIsbn = readCell(row, headerIndex.bookIsbn);

    if (!bookName && !unitName && !resourceId && !text) continue;

    const parsedRow: ParsedAudioReadingImportRow = {
      rowIndex: i + 1,
      bookName,
      bookIsbn,
      unitName,
      resourceId,
      resourceType,
      audioName,
      text,
      pinyin,
    };

    const err = validateRow(parsedRow);
    if (err) return { ok: false, message: err };

    if (resourceType && resourceType !== '句子') continue;

    parsed.push(parsedRow);
  }

  if (!parsed.length) return { ok: false, message: '未解析到可导入的「句子」行，请检查资源类型与内容' };
  if (parsed.length > AUDIO_READING_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      message: `导入行数不能超过 ${AUDIO_READING_IMPORT_MAX_ROWS} 行，请拆分表格后分批导入`,
    };
  }

  return { ok: true, rows: parsed };
}

export function downloadAudioReadingImportTemplate(fileName = '有声阅读导入模板.xlsx'): void {
  const rows: unknown[][] = [
    [...AUDIO_READING_IMPORT_HEADERS],
    [
      '快乐中文 第一册',
      '978-7-107-37765-5',
      '第一单元 我和你',
      'M0100009',
      '句子',
      'Y100079.mp3',
      '老师，这不是我的书。',
      'Lǎoshī, zhè bú shì wǒde shū.',
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, fileName.replace(/[\\/:*?"<>|]/g, '_'));
}

export function validateAudioReadingImportFile(file: File): { ok: true } | { ok: false; message: string } {
  return validateCatalogImportFile(file);
}

export { stripAudioExtension };
