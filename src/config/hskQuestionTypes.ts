import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';

const now = () => new Date().toISOString().slice(0, 10);

type SeedRow = Omit<HskQuestionTypeDef, 'hskTypeCode' | 'lastModified'>;

const rows: SeedRow[] = [
  { id: 'L01', name: '图片选择', section: 'listening', description: '听音频后从多张图片中选择正确答案', defaultScore: 2, hskLevels: [1, 2], difficulty: '★☆☆☆☆', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 3 },
  { id: 'L02', name: '对话-图片匹配', section: 'listening', description: '听对话后将问题与对应图片进行匹配', defaultScore: 3, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'image_text_match' },
  { id: 'L03', name: '短句选答', section: 'listening', description: '听短句后从文字选项中选择正确答案', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 3 },
  { id: 'R01', name: '图文匹配', section: 'reading', description: '将图片与对应的文字描述进行匹配', defaultScore: 2, hskLevels: [1, 2], difficulty: '★☆☆☆☆', isPublished: true, answerMode: 'image_text_match' },
  { id: 'R02', name: '问答匹配', section: 'reading', description: '将问题与对应的答案进行匹配（含干扰项）', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'qa_match' },
  { id: 'R03', name: '选词填空', section: 'reading', description: '从词库中选择合适的词语填入句子空白处', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★★☆☆', isPublished: true, answerMode: 'word_fill' },
  { id: 'R07', name: '阅读理解', section: 'reading', description: '阅读文章后回答选择题', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★★★★', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 4 },
  { id: 'W01', name: '部件选择', section: 'writing', description: '将汉字部件组合成完整汉字', defaultScore: 2, hskLevels: [2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'picture_sentence' },
  { id: 'W02', name: '填写汉字', section: 'writing', description: '根据拼音提示在空白处填写正确的汉字', defaultScore: 2, hskLevels: [2], difficulty: '★★★☆☆', isPublished: true, answerMode: 'sentence_fill' },
];

export const HSK_QUESTION_TYPE_DEFS: HskQuestionTypeDef[] = rows.map((row) => ({
  ...row,
  hskTypeCode: row.id,
  lastModified: now(),
}));

export const HSK_TYPE_CODES = HSK_QUESTION_TYPE_DEFS.map((t) => t.id);
const HSK_TYPE_CODE_SET = new Set<string>(HSK_TYPE_CODES);

/** 已废弃的通用题型 T01–T06 → 对应 HSK 官方题型 */
export const LEGACY_GENERIC_TYPE_TO_HSK: Record<string, HskQuestionTypeCode> = {
  T01: 'R07',
  T02: 'R07',
  T03: 'R03',
  T04: 'W04',
  T05: 'R08',
  T06: 'L03',
};

export function isLegacyGenericTypeId(id: string): boolean {
  return /^T\d{2}$/.test(id);
}

export function migrateLegacyTypeId(typeId: string): HskQuestionTypeCode {
  if (isLegacyGenericTypeId(typeId)) {
    return LEGACY_GENERIC_TYPE_TO_HSK[typeId] ?? 'R07';
  }
  return typeId as HskQuestionTypeCode;
}

export function ensureQuestionTypes(types: HskQuestionTypeDef[]): HskQuestionTypeDef[] {
  return types
    .filter((type) => !isLegacyGenericTypeId(type.id) && HSK_TYPE_CODE_SET.has(type.id))
    .map((type) => ({
      ...type,
      hskTypeCode: type.id,
      lastModified: type.lastModified ?? now(),
    }));
}

export function getQuestionTypeDef(code: HskQuestionTypeCode) {
  return HSK_QUESTION_TYPE_DEFS.find((t) => t.id === code);
}

export function buildDefaultQuestionOptions(defaultOptionCount?: number) {
  const count = Math.max(2, defaultOptionCount ?? 2);
  return Array.from({ length: count }, (_, index) => ({
    label: String.fromCharCode(65 + index),
    text: '',
  }));
}

export function getSectionName(section: HskSectionModule) {
  switch (section) {
    case 'listening':
      return '听力';
    case 'reading':
      return '阅读';
    case 'writing':
      return '书写';
  }
}

export function levelToNumber(level: string): number | null {
  const m = level.match(/HSK(\d)/i);
  return m ? Number(m[1]) : null;
}
