import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';

const now = () => new Date().toISOString().slice(0, 10);

type SeedRow = Omit<HskQuestionTypeDef, 'hskTypeCode' | 'lastModified'>;

const rows: SeedRow[] = [
  { id: 'L01', name: '图片选择', section: 'listening', description: '听音频后从多张图片中选择正确答案', defaultScore: 2, hskLevels: [1, 2], difficulty: '★☆☆☆☆', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 3 },
  { id: 'L02', name: '对话-图片匹配', section: 'listening', description: '听对话后将问题与对应图片进行匹配', defaultScore: 3, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'image_text_match' },
  { id: 'L03', name: '短句选答', section: 'listening', description: '听短句后从文字选项中选择正确答案', defaultScore: 2, hskLevels: [1, 2, 3], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 3 },
  { id: 'L04', name: '对话选答', section: 'listening', description: '听完整对话后从文字选项中选择正确答案', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★☆☆', isPublished: true, answerMode: 'single_choice', defaultOptionCount: 4 },
  { id: 'L05', name: '多题', section: 'listening', description: '听长对话后回答多个选择题', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★★☆', isPublished: false, answerMode: 'single_choice', defaultOptionCount: 3 },
  { id: 'L06', name: '图片判断', section: 'listening', description: '听句子判断图片内容是否正确', defaultScore: 2, hskLevels: [5, 6], difficulty: '★★★★☆', isPublished: true, answerMode: 'true_false', defaultOptionCount: 2 },
  { id: 'R01', name: '图文匹配', section: 'reading', description: '将图片与对应的文字描述进行匹配', defaultScore: 2, hskLevels: [1, 2, 3], difficulty: '★☆☆☆☆', isPublished: true, answerMode: 'image_text_match' },
  { id: 'R02', name: '问答匹配', section: 'reading', description: '将问题与对应的答案进行匹配（含干扰项）', defaultScore: 2, hskLevels: [2, 3], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'qa_match' },
  { id: 'R03', name: '选词填空', section: 'reading', description: '从词库中选择合适的词语填入句子空白处', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★☆☆', isPublished: true, answerMode: 'word_fill' },
  { id: 'R04', name: '句子排序', section: 'reading', description: '将打乱的句子片段按正确顺序排列', defaultScore: 2, hskLevels: [3, 4, 5, 6], difficulty: '★★★★☆', isPublished: true, answerMode: 'drag_sort' },
  { id: 'R05', name: '段落填空', section: 'reading', description: '选择句子填入段落空白处', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★☆☆', isPublished: true, answerMode: 'paragraph_fill' },
  { id: 'R06', name: '完形填空', section: 'reading', description: '选择词语填入文章空白处（分屏预览）', defaultScore: 2, hskLevels: [4, 5, 6], difficulty: '★★★★☆', isPublished: false, answerMode: 'cloze', defaultOptionCount: 4 },
  { id: 'R07', name: '阅读理解', section: 'reading', description: '阅读文章后回答选择题', defaultScore: 2, hskLevels: [5, 6], difficulty: '★★★★★', isPublished: false, answerMode: 'single_choice', defaultOptionCount: 4 },
  { id: 'R08', name: '图片判断', section: 'reading', description: '看图片和句子，判断句子描述是否与图片一致', defaultScore: 2, hskLevels: [1, 2, 3], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'true_false' },
  { id: 'R09', name: '图片选词填空', section: 'reading', description: '根据图片选择词语填入空白处', defaultScore: 2, hskLevels: [2, 3, 4], difficulty: '★★★☆☆', isPublished: true, answerMode: 'word_fill' },
  { id: 'W01', name: '部件选择', section: 'writing', description: '将汉字部件组合成完整汉字', defaultScore: 2, hskLevels: [1, 2], difficulty: '★★☆☆☆', isPublished: true, answerMode: 'picture_sentence' },
  { id: 'W02', name: '填写汉字', section: 'writing', description: '根据拼音提示在空白处填写正确的汉字', defaultScore: 2, hskLevels: [2, 3, 4], difficulty: '★★★☆☆', isPublished: true, answerMode: 'sentence_fill' },
  { id: 'W03', name: '看图造句', section: 'writing', description: '根据图片和关键词进行造句', defaultScore: 2, hskLevels: [3, 4, 5], difficulty: '★★★★☆', isPublished: true, answerMode: 'essay' },
  { id: 'W04', name: '命题作文', section: 'writing', description: '根据给定话题和关键词进行写作', defaultScore: 10, hskLevels: [4, 5, 6], difficulty: '★★★★★', isPublished: false, answerMode: 'essay' },
];

export const HSK_QUESTION_TYPE_DEFS: HskQuestionTypeDef[] = rows.map((row) => ({
  ...row,
  hskTypeCode: row.id,
  lastModified: now(),
}));

export const HSK_TYPE_CODES = HSK_QUESTION_TYPE_DEFS.map((t) => t.id);

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
  const byId = new Map(
    types.filter((t) => !isLegacyGenericTypeId(t.id)).map((type) => [type.id, type]),
  );
  return HSK_QUESTION_TYPE_DEFS.map((def) => {
    const existing = byId.get(def.id);
    if (!existing) return def;
    return {
      ...existing,
      name: def.name,
      description: def.description,
      section: def.section,
      defaultScore: def.defaultScore,
      hskLevels: def.hskLevels,
      answerMode: def.answerMode ?? existing.answerMode,
      defaultOptionCount: def.defaultOptionCount ?? existing.defaultOptionCount,
    };
  });
}

export function getQuestionTypeDef(code: HskQuestionTypeCode) {
  return HSK_QUESTION_TYPE_DEFS.find((t) => t.id === code);
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
