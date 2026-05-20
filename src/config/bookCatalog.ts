import catalog from './bookCatalog.json';

export type PublisherOption = {
  category: string;
  name: string;
  country: string;
  representativeBooks: string;
};

export type HskLevelOption = {
  tier: string;
  level: string;
  syllables: string;
  characters: string;
  vocabulary: string;
  grammar: string;
};

export type FeatureCategory = {
  category: string;
  tags: string[];
};

export const PUBLISHERS: PublisherOption[] = catalog.publishers;
export const HSK_LEVELS: HskLevelOption[] = catalog.hskLevels;
export const FEATURE_CATEGORIES: FeatureCategory[] = catalog.featureCategories;
export const ALL_FEATURE_TAGS: string[] = FEATURE_CATEGORIES.flatMap((c) => c.tags);

export const PUBLISHER_CATEGORIES = [...new Set(PUBLISHERS.map((p) => p.category))];

// 扩展等级选项：包含 HSK、BCT、YCT、HSKK
export type ExtendedLevelOption = {
  value: string;
  label: string;
  category: string;
  hskEquivalent: string; // 对应的 HSK 级别
};

export const EXTENDED_LEVEL_OPTIONS: ExtendedLevelOption[] = [
  // HSK 标准等级
  { value: 'HSK1级', label: 'HSK1级', category: 'HSK 标准', hskEquivalent: 'HSK1级' },
  { value: 'HSK2级', label: 'HSK2级', category: 'HSK 标准', hskEquivalent: 'HSK2级' },
  { value: 'HSK3级', label: 'HSK3级', category: 'HSK 标准', hskEquivalent: 'HSK3级' },
  { value: 'HSK4级', label: 'HSK4级', category: 'HSK 标准', hskEquivalent: 'HSK4级' },
  { value: 'HSK5级', label: 'HSK5级', category: 'HSK 标准', hskEquivalent: 'HSK5级' },
  { value: 'HSK6级', label: 'HSK6级', category: 'HSK 标准', hskEquivalent: 'HSK6级' },
  { value: 'HSK7-9级', label: 'HSK7-9级', category: 'HSK 标准', hskEquivalent: 'HSK7-9级' },
  // BCT 商务中文
  { value: 'BCT(A)-1', label: 'BCT(A) 一级', category: 'BCT 商务中文', hskEquivalent: 'HSK1级' },
  { value: 'BCT(A)-2', label: 'BCT(A) 二级', category: 'BCT 商务中文', hskEquivalent: 'HSK2级' },
  { value: 'BCT(A)-3', label: 'BCT(A) 三级', category: 'BCT 商务中文', hskEquivalent: 'HSK3级' },
  { value: 'BCT(B)-4', label: 'BCT(B) 四级', category: 'BCT 商务中文', hskEquivalent: 'HSK4级' },
  { value: 'BCT(B)-5', label: 'BCT(B) 五级', category: 'BCT 商务中文', hskEquivalent: 'HSK5级' },
  { value: 'BCT(B)-6', label: 'BCT(B) 六级', category: 'BCT 商务中文', hskEquivalent: 'HSK6级' },
  // YCT 中小学生
  { value: 'YCT-1', label: 'YCT 一级 (80词)', category: 'YCT 中小学生', hskEquivalent: 'HSK1级' },
  { value: 'YCT-2', label: 'YCT 二级 (150词)', category: 'YCT 中小学生', hskEquivalent: 'HSK1级' },
  { value: 'YCT-3', label: 'YCT 三级 (300词)', category: 'YCT 中小学生', hskEquivalent: 'HSK2级' },
  { value: 'YCT-4', label: 'YCT 四级 (600词)', category: 'YCT 中小学生', hskEquivalent: 'HSK3级' },
  // HSKK 口语
  { value: 'HSKK-初级', label: 'HSKK 初级 (HSK1-2)', category: 'HSKK 口语', hskEquivalent: 'HSK2级' },
  { value: 'HSKK-中级', label: 'HSKK 中级 (HSK3-4)', category: 'HSKK 口语', hskEquivalent: 'HSK4级' },
  { value: 'HSKK-高级', label: 'HSKK 高级 (HSK5-6)', category: 'HSKK 口语', hskEquivalent: 'HSK6级' },
];

export function getHskEquivalent(extendedLevel: string): string {
  const option = EXTENDED_LEVEL_OPTIONS.find((o) => o.value === extendedLevel);
  return option?.hskEquivalent ?? extendedLevel;
}

const HSK_ORDER = HSK_LEVELS.map((l) => l.level);

export function formatHskRange(min: string, max: string): string {
  if (!min && !max) return '';
  // 如果是扩展等级，查找对应的 label
  const minOpt = EXTENDED_LEVEL_OPTIONS.find((o) => o.value === min);
  const maxOpt = EXTENDED_LEVEL_OPTIONS.find((o) => o.value === max);
  const minLabel = minOpt?.label.replace('级', '') ?? min.replace('级', '');
  const maxLabel = maxOpt?.label.replace('级', '') ?? max.replace('级', '');
  if (!min || min === max) return minLabel;
  return `${minLabel} - ${maxLabel}`;
}

export function parseLegacyLevel(level: string): { min: string; max: string } {
  const normalized = level.replace(/\s+/g, '').toUpperCase();
  const rangeMatch = normalized.match(/HSK(\d+(?:-\d+)?(?:\/\d+)?)/);
  if (!rangeMatch) {
    const exact = HSK_LEVELS.find((l) => l.level.replace('级', '').toUpperCase() === normalized);
    if (exact) return { min: exact.level, max: exact.level };
    return { min: HSK_LEVELS[0]?.level ?? 'HSK1级', max: HSK_LEVELS[0]?.level ?? 'HSK1级' };
  }
  const part = rangeMatch[1];
  if (part.includes('-')) {
    const [a, b] = part.split('-');
    const min = HSK_LEVELS.find((l) => l.level.startsWith(`HSK${a}`))?.level ?? `HSK${a}级`;
    const max = HSK_LEVELS.find((l) => l.level.startsWith(`HSK${b}`))?.level ?? `HSK${b}级`;
    return { min, max };
  }
  const exact = HSK_LEVELS.find((l) => l.level.startsWith(`HSK${part}`))?.level;
  return { min: exact ?? 'HSK1级', max: exact ?? 'HSK1级' };
}

export function getHskCumulativeStats(level: string): { vocabulary: number; characters: number } | null {
  const row = HSK_LEVELS.find((l) => l.level === level);
  if (!row) return null;
  const vocab = row.vocabulary.split('/').pop()?.trim();
  const chars = row.characters.split('/').pop()?.trim();
  if (!vocab || !chars) return null;
  return { vocabulary: Number(vocab), characters: Number(chars) };
}

export function publishersByCategory(): Map<string, PublisherOption[]> {
  const map = new Map<string, PublisherOption[]>();
  for (const pub of PUBLISHERS) {
    const list = map.get(pub.category) ?? [];
    list.push(pub);
    map.set(pub.category, list);
  }
  return map;
}

export function clampHskRange(min: string, max: string): { min: string; max: string } {
  const minIdx = HSK_ORDER.indexOf(min);
  const maxIdx = HSK_ORDER.indexOf(max);
  if (minIdx === -1 || maxIdx === -1) return { min, max };
  if (minIdx <= maxIdx) return { min, max };
  return { min: max, max: min };
}
