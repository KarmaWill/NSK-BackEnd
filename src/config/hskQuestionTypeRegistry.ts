import type { HskQuestionTypeCode, HskSectionModule } from '../types/hskExams';

export type HskRenderKey =
  | 'L01' | 'L02' | 'L02_group' | 'L03' | 'L04' | 'L05' | 'L06'
  | 'R01' | 'R02' | 'R03' | 'R03_group' | 'R04' | 'R05' | 'R05_group' | 'R06' | 'R07' | 'R08' | 'R09'
  | 'W01' | 'W02' | 'W03' | 'W04';

export type QuestionTypeRegistryEntry = {
  hskTypeCode: HskQuestionTypeCode;
  renderKey: HskRenderKey;
  runtimeTypeName: string;
  category: HskSectionModule;
  isCompoundGroup: boolean;
  compoundSlotCount?: number;
  sharedOptions: boolean;
  sharedContent: boolean;
  editorFields: Array<'content' | 'options' | 'audio' | 'subQuestions' | 'answer'>;
};

const entry = (
  hskTypeCode: HskQuestionTypeCode,
  renderKey: HskRenderKey,
  runtimeTypeName: string,
  category: HskSectionModule,
  opts: Partial<Omit<QuestionTypeRegistryEntry, 'hskTypeCode' | 'renderKey' | 'runtimeTypeName' | 'category'>> = {},
): QuestionTypeRegistryEntry => ({
  hskTypeCode,
  renderKey,
  runtimeTypeName,
  category,
  isCompoundGroup: false,
  sharedOptions: false,
  sharedContent: false,
  editorFields: ['content', 'options', 'answer'],
  ...opts,
});

export const QUESTION_TYPE_REGISTRY: QuestionTypeRegistryEntry[] = [
  entry('L01', 'L01', '图片选择', 'listening', { editorFields: ['content', 'options', 'audio', 'answer'] }),
  entry('L02', 'L02_group', '对话-图片匹配', 'listening', {
    isCompoundGroup: true,
    compoundSlotCount: 5,
    sharedOptions: true,
    editorFields: ['options', 'subQuestions', 'audio'],
  }),
  entry('L03', 'L03', '短句选答', 'listening', { editorFields: ['options', 'audio', 'answer'] }),
  entry('L04', 'L04', '对话选答', 'listening', { editorFields: ['content', 'options', 'audio', 'answer'] }),
  entry('L05', 'L05', '对话多题', 'listening', {
    isCompoundGroup: true,
    sharedContent: true,
    editorFields: ['content', 'subQuestions', 'audio'],
  }),
  entry('L06', 'L06', '图片判断', 'listening', {
    editorFields: ['content', 'options', 'audio', 'answer'],
  }),
  entry('R01', 'R01', '图文匹配', 'reading', { editorFields: ['content', 'options', 'answer'] }),
  entry('R02', 'R02', '问答匹配', 'reading', { editorFields: ['content', 'options', 'answer'] }),
  entry('R03', 'R03_group', '选词填空', 'reading', {
    isCompoundGroup: true,
    sharedOptions: true,
    editorFields: ['content', 'options', 'subQuestions'],
  }),
  entry('R04', 'R04', '句子排序', 'reading', {
    isCompoundGroup: true,
    sharedContent: true,
    editorFields: ['content', 'subQuestions'],
  }),
  entry('R05', 'R05_group', '段落填空', 'reading', {
    isCompoundGroup: true,
    sharedContent: true,
    editorFields: ['content', 'subQuestions'],
  }),
  entry('R06', 'R06', '完形填空', 'reading', {
    isCompoundGroup: true,
    sharedContent: true,
    editorFields: ['content', 'subQuestions'],
  }),
  entry('R07', 'R07', '阅读理解', 'reading', { editorFields: ['content', 'subQuestions'] }),
  entry('R08', 'R08', '图片判断', 'reading', { editorFields: ['content', 'options', 'answer'] }),
  entry('R09', 'R09', '图片选词填空', 'reading', { editorFields: ['content', 'options', 'answer'] }),
  entry('W01', 'W01', '部件选择', 'writing', { editorFields: ['content', 'answer'] }),
  entry('W02', 'W02', '填写汉字', 'writing', { editorFields: ['content', 'answer'] }),
  entry('W03', 'W03', '看图写句', 'writing', { editorFields: ['content', 'answer'] }),
  entry('W04', 'W04', '命题作文', 'writing', { editorFields: ['content', 'answer'] }),
];

export function getRegistryEntry(
  hskTypeCode: HskQuestionTypeCode,
  isCompound = false,
): QuestionTypeRegistryEntry | undefined {
  const matches = QUESTION_TYPE_REGISTRY.filter((r) => r.hskTypeCode === hskTypeCode);
  if (isCompound) {
    return matches.find((r) => r.isCompoundGroup) ?? matches[0];
  }
  return matches.find((r) => !r.isCompoundGroup) ?? matches[0];
}

export function getRegistryByRenderKey(renderKey: string): QuestionTypeRegistryEntry | undefined {
  return QUESTION_TYPE_REGISTRY.find((r) => r.renderKey === renderKey);
}

export function typeSupportsCompound(hskTypeCode: HskQuestionTypeCode): boolean {
  return QUESTION_TYPE_REGISTRY.some((r) => r.hskTypeCode === hskTypeCode && r.isCompoundGroup);
}

export function typeRequiresCompound(hskTypeCode: HskQuestionTypeCode): boolean {
  const entries = QUESTION_TYPE_REGISTRY.filter((r) => r.hskTypeCode === hskTypeCode);
  return entries.length > 0 && entries.every((r) => r.isCompoundGroup);
}

export function defaultCompoundForType(hskTypeCode: HskQuestionTypeCode): boolean {
  return typeRequiresCompound(hskTypeCode);
}

export function sectionDisplayLabel(hskTypeCode: HskQuestionTypeCode, isCompound: boolean): string {
  const entry = getRegistryEntry(hskTypeCode, isCompound);
  if (!entry) return hskTypeCode;
  if (entry.isCompoundGroup) {
    const count = entry.compoundSlotCount ? `，${entry.compoundSlotCount} 小题一屏` : '，多小题一屏';
    return `${entry.runtimeTypeName}${count}`;
  }
  return entry.runtimeTypeName;
}
