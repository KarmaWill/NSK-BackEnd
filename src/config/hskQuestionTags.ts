import type { HskQuestionTag, HskQuestionTagCatalog } from '../types/hskExams';
import { DEFAULT_HSK_QUESTION_TAG_CATALOG } from '../types/hskExams';

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

export const HSK_QUESTION_TAG_MAX_LENGTH = 20;
export const HSK_QUESTION_TAG_CATEGORY_MAX_LENGTH = 20;

export const HSK_PRESET_TAG_CATEGORY_NAMES = HSK_TAG_CATEGORIES.map((cat) => cat.category);

export function sanitizeQuestionTagInput(value: string): string {
  return value.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').slice(0, HSK_QUESTION_TAG_MAX_LENGTH);
}

export function sanitizeQuestionTagCategoryInput(value: string): string {
  return value.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').slice(0, HSK_QUESTION_TAG_CATEGORY_MAX_LENGTH);
}

export function isPresetTagCategory(category: string): boolean {
  return HSK_PRESET_TAG_CATEGORY_NAMES.includes(category);
}

export function resolveTagCategory(
  label: string,
  categories: HskTagCategoryDef[] = HSK_TAG_CATEGORIES,
  allTags: HskQuestionTag[] = [],
): string {
  const stored = allTags.find((tag) => tag.label === label);
  if (stored?.category) return stored.category;
  for (const cat of categories) {
    if (cat.tags.includes(label)) return cat.category;
  }
  return '自定义标签';
}

export function groupSelectedTagsByCategory(
  selected: string[],
  categories: HskTagCategoryDef[],
  allTags: HskQuestionTag[] = [],
): Array<{ category: string; labels: string[] }> {
  const order = categories.map((cat) => cat.category);
  const grouped = new Map<string, string[]>();

  for (const label of selected) {
    const category = resolveTagCategory(label, categories, allTags);
    const list = grouped.get(category) ?? [];
    list.push(label);
    grouped.set(category, list);
  }

  const known = order.filter((category) => grouped.has(category));
  const extra = [...grouped.keys()].filter((category) => !order.includes(category));
  return [...known, ...extra].map((category) => ({
    category,
    labels: grouped.get(category) ?? [],
  }));
}

export function getQuestionTagPickerCategories(
  allTags: HskQuestionTag[],
  catalog: HskQuestionTagCatalog = DEFAULT_HSK_QUESTION_TAG_CATALOG,
): HskTagCategoryDef[] {
  const hidden = new Set(catalog.hiddenCategories);
  const preset = HSK_TAG_CATEGORIES.filter((cat) => !hidden.has(cat.category));
  const custom = catalog.customCategories
    .filter((category) => !hidden.has(category))
    .map((category) => ({ category, tags: [] as readonly string[] }));
  const merged: HskTagCategoryDef[] = [...preset, ...custom];
  const uncategorized = allTags
    .filter((tag) => !ALL_PRESET_TAG_LABELS.has(tag.label) && !tag.category)
    .map((tag) => tag.label);
  if (uncategorized.length > 0 && !hidden.has('自定义标签')) {
    merged.push({ category: '自定义标签', tags: uncategorized });
  }
  return merged;
}

export function countTagsInCategory(
  category: string,
  allTags: HskQuestionTag[],
  categories: HskTagCategoryDef[],
): number {
  const catDef = categories.find((cat) => cat.category === category);
  if (!catDef) return 0;
  return getTagLabelsInCategory(category, catDef.tags, allTags).length;
}

export function getTagLabelsInCategory(
  category: string,
  presetTags: readonly string[],
  allTags: HskQuestionTag[],
): string[] {
  const storeLabels = new Set(allTags.map((t) => t.label));
  if (category === '自定义标签') {
    return allTags
      .filter((tag) => !ALL_PRESET_TAG_LABELS.has(tag.label) && !tag.category)
      .map((tag) => tag.label);
  }
  const presetInStore = presetTags.filter((label) => storeLabels.has(label));
  const customInCategory = allTags
    .filter((tag) => tag.category === category && !presetTags.includes(tag.label))
    .map((tag) => tag.label);
  return [...presetInStore, ...customInCategory];
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
