import type { HskQuestionTag } from '../types/hskExams';

/** 与 5174 端 TagManager / mockData.INITIAL_TAGS 对齐的 22 个题型特征标签 */
export const HSK_DEFAULT_TAG_LABELS = [
  '听力题',
  '阅读题',
  '书写题',
  '写作题',
  '口语题',
  '翻译题',
  '单选题',
  '多选题',
  '填空题',
  '判断题',
  '简答题',
  '匹配题',
  '排序题',
  '图片题',
  '词语题',
  '汉字题',
  '文本输入',
  'AI评分',
  '多题',
  '部件题',
  '造句题',
  '含示例',
] as const;

const TAG_ID_BY_LABEL: Record<(typeof HSK_DEFAULT_TAG_LABELS)[number], string> = {
  听力题: 'tag-listening',
  阅读题: 'tag-reading',
  书写题: 'tag-writing-hand',
  写作题: 'tag-writing-essay',
  口语题: 'tag-speaking',
  翻译题: 'tag-translation',
  单选题: 'tag-single-choice',
  多选题: 'tag-multi-choice',
  填空题: 'tag-blank-fill',
  判断题: 'tag-true-false',
  简答题: 'tag-short-answer',
  匹配题: 'tag-matching',
  排序题: 'tag-ordering',
  图片题: 'tag-image',
  词语题: 'tag-vocab',
  汉字题: 'tag-character',
  文本输入: 'tag-text-input',
  AI评分: 'tag-ai-score',
  多题: 'tag-multi-question',
  部件题: 'tag-radical',
  造句题: 'tag-sentence-build',
  含示例: 'tag-with-example',
};

const LEGACY_SEED_LABELS = new Set(['2选1', '3选1', '4选1']);

/** 题目编辑页标签分组（对齐图书「功能模块标签」picker 交互） */
export type HskTagCategoryDef = {
  category: string;
  tags: readonly string[];
};

export const HSK_TAG_CATEGORIES: HskTagCategoryDef[] = [
  {
    category: '技能模块类',
    tags: ['听力题', '阅读题', '书写题', '写作题', '口语题', '翻译题'],
  },
  {
    category: '答题形式类',
    tags: ['单选题', '多选题', '填空题', '判断题', '简答题', '匹配题', '排序题'],
  },
  {
    category: '内容特征类',
    tags: ['图片题', '词语题', '汉字题', '文本输入', '部件题', '造句题'],
  },
  {
    category: '其他特征',
    tags: ['AI评分', '多题', '含示例'],
  },
];

const ALL_PRESET_TAG_LABELS = new Set(HSK_TAG_CATEGORIES.flatMap((c) => c.tags));

export function getQuestionTagPickerCategories(allTags: HskQuestionTag[]): HskTagCategoryDef[] {
  const uncategorized = allTags
    .map((t) => t.label)
    .filter((label) => !ALL_PRESET_TAG_LABELS.has(label));
  if (uncategorized.length === 0) return [...HSK_TAG_CATEGORIES];
  return [...HSK_TAG_CATEGORIES, { category: '自定义标签', tags: uncategorized }];
}

export function getTagLabelsInCategory(
  category: string,
  presetTags: readonly string[],
  allTags: HskQuestionTag[],
): string[] {
  const storeLabels = new Set(allTags.map((t) => t.label));
  if (category === '自定义标签') {
    return allTags.map((t) => t.label).filter((label) => !ALL_PRESET_TAG_LABELS.has(label));
  }
  return presetTags.filter((label) => storeLabels.has(label));
}

export function createDefaultQuestionTags(): HskQuestionTag[] {
  return HSK_DEFAULT_TAG_LABELS.map((label) => ({
    id: TAG_ID_BY_LABEL[label],
    label,
  }));
}

/** 加载 store 时补齐默认标签；若仅有旧版 2选1/3选1/4选1 则整体替换 */
export function ensureQuestionTags(tags: HskQuestionTag[]): HskQuestionTag[] {
  const defaults = createDefaultQuestionTags();
  if (!tags.length) return defaults;

  const onlyLegacy =
    tags.length <= 3 && tags.every((tag) => LEGACY_SEED_LABELS.has(tag.label));
  if (onlyLegacy) return defaults;

  const labels = new Set(tags.map((tag) => tag.label));
  const merged = [...tags];
  for (const tag of defaults) {
    if (!labels.has(tag.label)) merged.push(tag);
  }
  return merged;
}
