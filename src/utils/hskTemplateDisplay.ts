import type { HskPaperTemplate, HskQuestionTypeDef, HskTemplateSection } from '../types/hskExams';

export type SectionRange = {
  sectionId: string;
  range: string;
};

export const HSK_LEVEL_COLORS: Record<
  number,
  { primary: string; light: string; dark: string; gradient: string }
> = {
  1: { primary: '#22c55e', light: '#dcfce7', dark: '#16a34a', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  2: { primary: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8', gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' },
  3: { primary: '#8b5cf6', light: '#ede9fe', dark: '#7c3aed', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' },
  4: { primary: '#f97316', light: '#ffedd5', dark: '#ea580c', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
  5: { primary: '#9333ea', light: '#f3e8ff', dark: '#7e22ce', gradient: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)' },
  6: { primary: '#ec4899', light: '#fce7f3', dark: '#db2777', gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
};

export const CUSTOM_COLORS = {
  primary: '#0d9488',
  light: '#ccfbf1',
  dark: '#0f766e',
  gradient: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
};

export const MODULE_META = {
  listening: { primary: '#7C3AED', light: '#f5f3ff', dark: '#6d28d9', icon: '🎧', label: '听力' },
  reading: { primary: '#059669', light: '#ecfdf5', dark: '#047857', icon: '📖', label: '阅读' },
  writing: { primary: '#EA580C', light: '#fff7ed', dark: '#c2410c', icon: '✍️', label: '书写' },
} as const;

export const TYPE_CARD_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  L: { bg: 'is-l', border: 'is-l', text: 'is-l', badge: 'is-l' },
  R: { bg: 'is-r', border: 'is-r', text: 'is-r', badge: 'is-r' },
  W: { bg: 'is-w', border: 'is-w', text: 'is-w', badge: 'is-w' },
};

export function formatQuestionRange(first: number, last: number): string {
  if (first === last) return `第${first}题`;
  return `第${first}-${last}题`;
}

export function computeSectionNumberRanges(template: HskPaperTemplate): SectionRange[] {
  const ranges: SectionRange[] = [];
  let num = 0;
  for (const mod of template.modules) {
    for (const sec of mod.sections) {
      let firstNum: number | null = null;
      let lastNum: number | null = null;
      for (const group of sec.groups) {
        for (let i = 0; i < group.questionCount; i += 1) {
          num += 1;
          if (firstNum === null) firstNum = num;
          lastNum = num;
        }
      }
      ranges.push({
        sectionId: sec.id,
        range:
          firstNum !== null && lastNum !== null
            ? formatQuestionRange(firstNum, lastNum)
            : '（无题）',
      });
    }
  }
  return ranges;
}

export function getTemplateDisplayDuration(template: HskPaperTemplate): number {
  if (template.totalDuration != null) return template.totalDuration;
  const tb = template.timeBlocks;
  return (tb.prep || 0) + (tb.listening || 0) + (tb.buffer || 0) + (tb.reading || 0) + (tb.writing || 0);
}

export function getTemplateColors(template?: HskPaperTemplate | null) {
  if (!template) return HSK_LEVEL_COLORS[3];
  if (template.category === 'custom' || template.parentCategory === null) return CUSTOM_COLORS;
  if (template.parentCategory === 'KLZW') {
    return template.level === 'midterm' ? HSK_LEVEL_COLORS[4] : HSK_LEVEL_COLORS[5];
  }
  const lv = parseInt(String(template.level).replace(/\D/g, ''), 10) || 3;
  return HSK_LEVEL_COLORS[lv] || HSK_LEVEL_COLORS[3];
}

export function sectionHasExample(section: HskTemplateSection): boolean {
  return section.groups.some((g) => g.hasExample);
}

export function moduleUniqueTypeCount(mod: HskPaperTemplate['modules'][number]): number {
  return new Set(mod.sections.map((s) => s.questionType)).size;
}

export function getTypeCardColorPrefix(questionType: string): string {
  return questionType.charAt(0);
}

export function findTypeDef(typeDefs: HskQuestionTypeDef[], questionType: string) {
  return typeDefs.find((t) => t.hskTypeCode === questionType || t.id === questionType);
}
