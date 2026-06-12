import type { HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';

export const HSK_SECTION_TYPE_META: Record<
  HskSectionModule,
  { icon: string; label: string; range: string }
> = {
  listening: { icon: '🎧', label: '听力', range: 'L01-L06' },
  reading: { icon: '📖', label: '阅读', range: 'R01-R09' },
  writing: { icon: '✍️', label: '写作', range: 'W01-W04' },
};

export type GroupedQuestionTypeOption = {
  value: HskQuestionTypeCode;
  label: string;
  icon: string;
};

export type GroupedQuestionTypeGroup = {
  section: HskSectionModule;
  groupLabel: string;
  icon: string;
  options: GroupedQuestionTypeOption[];
};

export const IMAGE_OPTION_QUESTION_TYPES = ['L01', 'L02', 'R01'] as const satisfies readonly HskQuestionTypeCode[];

export function isImageOptionQuestionType(typeId: HskQuestionTypeCode): boolean {
  return (IMAGE_OPTION_QUESTION_TYPES as readonly string[]).includes(typeId);
}

export const JUDGMENT_QUESTION_TYPES = ['L06', 'R08'] as const satisfies readonly HskQuestionTypeCode[];

export function isJudgmentQuestionType(typeId: HskQuestionTypeCode): boolean {
  return (JUDGMENT_QUESTION_TYPES as readonly string[]).includes(typeId);
}

/** 题目编辑页题型下拉顺序（对齐 HSK-Exams QuestionEditPage） */
export const HSK_QUESTION_EDIT_TYPE_ORDER = [
  'L01',
  'L02',
  'L03',
  'R01',
  'R02',
  'R03',
  'R04',
  'W01',
  'W02',
  'W04',
  'L05',
  'L06',
  'R05',
  'R06',
  'R07',
  'R08',
  'R09',
  'W03',
] as const satisfies readonly HskQuestionTypeCode[];

/** 编辑页下拉中隐藏 L04，由 L03 选项代表 L03/L04 */
export const HSK_QUESTION_EDIT_TYPE_HIDDEN: HskQuestionTypeCode[] = ['L04'];

export function questionEditTypeOptionLabel(type: HskQuestionTypeDef): string {
  if (type.id === 'L03') return 'L03/L04 - 听力单选题';
  return `${type.name} (${type.id})`;
}

export function buildQuestionEditTypeOptions(types: HskQuestionTypeDef[]): HskQuestionTypeDef[] {
  const byId = new Map(
    types.filter((t) => !t.id.startsWith('T')).map((t) => [t.id, t] as const),
  );
  return HSK_QUESTION_EDIT_TYPE_ORDER.map((id) => byId.get(id)).filter(
    (t): t is HskQuestionTypeDef => !!t && !HSK_QUESTION_EDIT_TYPE_HIDDEN.includes(t.id),
  );
}

/** L04 在编辑页下拉中与 L03 共用同一选项 */
export function questionEditTypeSelectValue(typeId: HskQuestionTypeCode): HskQuestionTypeCode {
  return typeId === 'L04' ? 'L03' : typeId;
}

export function buildGroupedQuestionTypes(types: HskQuestionTypeDef[]): GroupedQuestionTypeGroup[] {
  const sections: HskSectionModule[] = ['listening', 'reading', 'writing'];
  const seen = new Set<string>();
  return sections
    .map((section) => {
      const meta = HSK_SECTION_TYPE_META[section];
      const sectionTypes = types
        .filter((t) => t.section === section && !t.id.startsWith('T'))
        .filter((t) => {
          if (seen.has(t.id)) return false;
          seen.add(t.id);
          return true;
        })
        .sort((a, b) => a.id.localeCompare(b.id));
      return {
        section,
        groupLabel: `${meta.label} (${meta.range})`,
        icon: meta.icon,
        options: sectionTypes.map((t) => ({
          value: t.id,
          label: `${t.name} (${t.id})`,
          icon: meta.icon,
        })),
      };
    })
    .filter((g) => g.options.length > 0);
}

export function questionTypeSelectLabel(
  value: HskQuestionTypeCode | 'all',
  types: HskQuestionTypeDef[],
): string {
  if (value === 'all') return '全部题型';
  const type = types.find((t) => t.id === value);
  if (!type) return value;
  return `${type.name} (${type.id})`;
}
