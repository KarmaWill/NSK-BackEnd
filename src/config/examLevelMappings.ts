import data from './examLevelMappings.json';
import { HSK_LEVELS, clampHskRange } from './bookCatalog';

export type BctMapping = {
  examGroup: string;
  hskLevel: string;
  cefr: string;
  intlStandard: string;
  vocabRef: string;
  description: string;
};

export type YctMapping = {
  yctLevel: string;
  hskLevel: string | null;
  cefr: string;
  intlStandard: string;
  vocabRef: string;
  description: string;
};

export type HskkLevel = {
  hskkLevel: string;
  hskLevels: string[];
  intlStandard: string;
  targetDescription: string;
  fullScore: number;
  passScore: number;
};

export const BCT_MAPPINGS: BctMapping[] = data.bctMappings;
export const YCT_MAPPINGS: YctMapping[] = data.yctMappings;
export const HSKK_LEVELS: HskkLevel[] = data.hskkLevels;

const HSK_ORDER = HSK_LEVELS.map((l) => l.level);

function levelsInRange(min: string, max: string): string[] {
  const { min: lo, max: hi } = clampHskRange(min, max);
  const start = HSK_ORDER.indexOf(lo);
  const end = HSK_ORDER.indexOf(hi);
  if (start === -1 || end === -1) return [];
  return HSK_ORDER.slice(start, end + 1);
}

export function getBctMappingsForRange(min: string, max: string): BctMapping[] {
  const set = new Set(levelsInRange(min, max));
  return BCT_MAPPINGS.filter((m) => set.has(m.hskLevel));
}

export function getYctMappingsForRange(min: string, max: string): YctMapping[] {
  const set = new Set(levelsInRange(min, max));
  return YCT_MAPPINGS.filter((m) => m.hskLevel && set.has(m.hskLevel));
}

export function getHskkLevelsForRange(min: string, max: string): HskkLevel[] {
  const inRange = new Set(levelsInRange(min, max));
  return HSKK_LEVELS.filter((h) => h.hskLevels.some((l) => inRange.has(l)));
}

export function getYctBelowRange(min: string): YctMapping[] {
  const minIdx = HSK_ORDER.indexOf(min);
  if (minIdx <= 0) {
    return YCT_MAPPINGS.filter((m) => m.hskLevel === null);
  }
  return [];
}
