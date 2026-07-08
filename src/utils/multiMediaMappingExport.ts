import * as XLSX from 'xlsx';
import { normalizeBookResourceType, type BookResourceType } from '../config/bookResourceTypes';

export const MULTI_MEDIA_MAPPING_EXPORT_HEADERS = [
  '序号',
  '教材名称',
  'ISBN',
  '页码',
  'Frame_Num',
  '资源类型',
  'ID',
  '资源名称',
] as const;

type ExportableBookFile = {
  type: BookResourceType | string;
  fileName: string;
  resourceName?: string;
  resourceId?: string;
  lessonId?: string;
  pageCode?: string;
  frameNum?: number;
};

function stripFileExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}

function resolveResourceId(file: ExportableBookFile): string {
  return file.resourceId?.trim() || file.lessonId?.trim() || '';
}

function resolveResourceName(file: ExportableBookFile): string {
  return file.resourceName?.trim() || stripFileExtension(file.fileName);
}

export function countMultiMediaMappingFiles(files: ExportableBookFile[]): number {
  return files.filter((file) => normalizeBookResourceType(file.type) === 'MULTI_MEDIA').length;
}

export function buildMultiMediaMappingExportRows(
  files: ExportableBookFile[],
  options: { bookTitle: string; isbn: string },
): unknown[][] {
  const mediaFiles = files.filter((file) => normalizeBookResourceType(file.type) === 'MULTI_MEDIA');
  const rows: unknown[][] = [[...MULTI_MEDIA_MAPPING_EXPORT_HEADERS]];

  mediaFiles.forEach((file, index) => {
    rows.push([
      index + 1,
      options.bookTitle,
      options.isbn,
      file.pageCode?.trim() ?? '',
      file.frameNum ?? 1,
      'video',
      resolveResourceId(file) || '',
      resolveResourceName(file),
    ]);
  });

  return rows;
}

export function downloadMultiMediaMappingWorkbook(
  files: ExportableBookFile[],
  options: { bookTitle: string; isbn: string; fileName?: string },
): number {
  const rows = buildMultiMediaMappingExportRows(files, options);
  const dataRowCount = rows.length - 1;
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const safeTitle = options.bookTitle.trim() || '书籍';
  const fileName = options.fileName ?? `${safeTitle}-多媒体资源映射表.xlsx`;
  XLSX.writeFile(workbook, fileName.replace(/[\\/:*?"<>|]/g, '_'));
  return dataRowCount;
}
