import { HSK_QUESTION_TYPE_DEFS } from '../config/hskQuestionTypes';
import type { HskPaperTemplate, HskTemplateModule, HskTimeBlocks } from '../types/hskExams';
import { recalcTemplateTotals } from '../utils/hskPaperUtils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error — static reference data (examTemplates.js)
import { OFFICIAL_TEMPLATES } from './examTemplates.js';

type RawOfficialTemplate = {
  id: string;
  name: string;
  category: 'HSK' | 'KLZW' | string;
  level: string;
  book?: string;
  testType?: string;
  totalQuestions: number;
  totalDuration: number;
  fullScore?: number;
  passScore?: number;
  timeBlocks: HskTimeBlocks;
  modules: HskTemplateModule[];
  lastUpdated?: string;
};

export const KLZW_BOOK_TABS = [
  { id: '1', label: '第一册' },
  { id: '2', label: '第二册' },
  { id: '3', label: '第三册' },
] as const;

export const KLZW_BOOK1_TESTS = [
  { key: 'midterm', label: '期中测试', icon: '📝' },
  { key: 'final', label: '期末测试', icon: '📋' },
  { key: 'unit_a', label: '单元测试A', icon: '📄' },
  { key: 'unit_b', label: '单元测试B', icon: '📑' },
] as const;

export type KlzwTestKey = (typeof KLZW_BOOK1_TESTS)[number]['key'];

function mapRawTemplate(raw: RawOfficialTemplate): HskPaperTemplate {
  const isKlzw = raw.category === 'KLZW';
  const level = isKlzw ? raw.level : `HSK${raw.level}`;
  const base: HskPaperTemplate = {
    id: `official-${raw.id}`,
    name: raw.name,
    category: 'official',
    level,
    parentCategory: isKlzw ? 'KLZW' : 'HSK',
    categoryId: isKlzw && raw.book ? `book-${raw.book}` : null,
    totalQuestions: raw.totalQuestions,
    totalDuration: raw.totalDuration,
    totalScore: raw.fullScore ?? 0,
    passScore: raw.passScore ?? 0,
    timeBlocks: raw.timeBlocks,
    modules: raw.modules,
    status: 'published',
    updatedAt: raw.lastUpdated ?? '2024-01-15',
  };
  return recalcTemplateTotals(base, HSK_QUESTION_TYPE_DEFS);
}

const ALL_OFFICIAL = (OFFICIAL_TEMPLATES as RawOfficialTemplate[]).map(mapRawTemplate);

export const HSK_OFFICIAL_TEMPLATES = ALL_OFFICIAL.filter((t) => t.parentCategory === 'HSK');

export const KLZW_OFFICIAL_TEMPLATES = ALL_OFFICIAL.filter((t) => t.parentCategory === 'KLZW');

export function getOfficialTemplateByHskLevel(level: number): HskPaperTemplate | undefined {
  return HSK_OFFICIAL_TEMPLATES.find((t) => t.level === `HSK${level}`);
}

export function getKlzwTemplate(testType: string, book = '1'): HskPaperTemplate | undefined {
  return KLZW_OFFICIAL_TEMPLATES.find(
    (t) => t.level === testType && t.categoryId === `book-${book}`,
  );
}

export function getKlzwTemplatesByBook(book: string): HskPaperTemplate[] {
  return KLZW_OFFICIAL_TEMPLATES.filter((t) => t.categoryId === `book-${book}`);
}
