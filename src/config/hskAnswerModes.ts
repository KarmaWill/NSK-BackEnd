import type { HskQuestionTypeCode } from '../types/hskExams';
import { defaultCompoundForType, getRegistryEntry } from './hskQuestionTypeRegistry';

export type AnswerModeId =
  | 'single_choice'
  | 'multi_choice'
  | 'image_select'
  | 'true_false'
  | 'image_text_match'
  | 'qa_match'
  | 'drag_sort'
  | 'word_fill'
  | 'paragraph_fill'
  | 'cloze'
  | 'image_word'
  | 'sentence_fill'
  | 'picture_sentence'
  | 'essay';

export type EditorFieldFlag = 'audio' | 'image' | 'subQuestions' | 'wordBank' | 'pinyin' | 'writing';

export type AnswerModeDef = {
  id: AnswerModeId;
  label: string;
  interaction: string;
  recommendedFields: EditorFieldFlag[];
};

export const ANSWER_MODE_OPTIONS: AnswerModeDef[] = [
  { id: 'single_choice', label: '单选题', interaction: 'single_choice', recommendedFields: ['image'] },
  { id: 'multi_choice', label: '多选题', interaction: 'multi_choice', recommendedFields: ['image'] },
  { id: 'image_select', label: '图片单选', interaction: 'image_select', recommendedFields: ['audio', 'image'] },
  { id: 'true_false', label: '判断题', interaction: 'true_false', recommendedFields: ['audio'] },
  { id: 'image_text_match', label: '图文配对', interaction: 'image_text_match', recommendedFields: ['image'] },
  { id: 'qa_match', label: '问答匹配', interaction: 'qa_match', recommendedFields: ['image'] },
  { id: 'drag_sort', label: '拖拽排序', interaction: 'drag_sort', recommendedFields: ['image'] },
  { id: 'word_fill', label: '选词填空', interaction: 'word_fill', recommendedFields: ['wordBank', 'subQuestions'] },
  { id: 'paragraph_fill', label: '段落填空', interaction: 'paragraph_fill', recommendedFields: ['subQuestions', 'wordBank'] },
  { id: 'cloze', label: '完形填空', interaction: 'cloze', recommendedFields: ['subQuestions', 'wordBank'] },
  { id: 'image_word', label: '图片选词', interaction: 'image_word', recommendedFields: ['audio', 'image'] },
  { id: 'sentence_fill', label: '句子填写', interaction: 'sentence_fill', recommendedFields: ['writing', 'pinyin'] },
  { id: 'picture_sentence', label: '看图造句', interaction: 'picture_sentence', recommendedFields: ['image', 'writing', 'pinyin'] },
  { id: 'essay', label: '短文写作', interaction: 'essay', recommendedFields: ['writing', 'pinyin'] },
];

export const EDITOR_FIELD_OPTIONS: { id: EditorFieldFlag; label: string; hint: string; icon: string }[] = [
  { id: 'audio', label: '音频', hint: '显示音频上传区块', icon: '🎧' },
  { id: 'image', label: '图片', hint: '显示图片选择区块', icon: '🖼️' },
  { id: 'subQuestions', label: '子题目', hint: '显示子题目配置区块', icon: '📋' },
  { id: 'wordBank', label: '词库', hint: '显示词语池区块', icon: '📚' },
  { id: 'pinyin', label: '拼音注音', hint: '文本字段显示拼音输入', icon: '🔤' },
  { id: 'writing', label: '写作/作文', hint: '显示写作配置区块', icon: '✍️' },
];

const TYPE_DEFAULT_MODE: Partial<Record<HskQuestionTypeCode, AnswerModeId>> = {
  L01: 'image_select',
  L02: 'image_text_match',
  L03: 'image_select',
  L04: 'single_choice',
  L05: 'cloze',
  L06: 'cloze',
  R01: 'image_text_match',
  R02: 'qa_match',
  R03: 'word_fill',
  R04: 'cloze',
  R05: 'drag_sort',
  R06: 'paragraph_fill',
  R07: 'cloze',
  R08: 'true_false',
  R09: 'word_fill',
  W01: 'picture_sentence',
  W02: 'sentence_fill',
  W03: 'picture_sentence',
  W04: 'essay',
};

export function getAnswerModeDef(id: AnswerModeId): AnswerModeDef {
  return ANSWER_MODE_OPTIONS.find((m) => m.id === id) ?? ANSWER_MODE_OPTIONS[0];
}

export function guessAnswerMode(typeId: HskQuestionTypeCode, stored?: AnswerModeId): AnswerModeId {
  if (stored) return stored;
  if (TYPE_DEFAULT_MODE[typeId]) return TYPE_DEFAULT_MODE[typeId]!;
  const reg = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  if (reg?.isCompoundGroup) return 'cloze';
  if (reg?.editorFields.includes('audio')) return 'image_select';
  return 'single_choice';
}

export function registryFieldsToFlags(typeId: HskQuestionTypeCode): Record<EditorFieldFlag, boolean> {
  const reg = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  const fields = reg?.editorFields ?? [];
  return {
    audio: fields.includes('audio'),
    image: fields.includes('content') || fields.includes('options'),
    subQuestions: fields.includes('subQuestions'),
    wordBank: typeId.startsWith('R') && fields.includes('options'),
    pinyin: typeId.startsWith('W'),
    writing: typeId.startsWith('W'),
  };
}

export function defaultOptionCountForType(typeId: HskQuestionTypeCode): number {
  if (typeId === 'L01' || typeId === 'L03') return 3;
  if (typeId.startsWith('W')) return 0;
  return 4;
}

export function optionLabelsFromCount(count: number): string[] {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
  if (count <= 0) return [];
  return labels.slice(0, Math.min(count, labels.length));
}

export const HSK_TYPE_CODE_REFERENCE: { code: HskQuestionTypeCode; label: string }[] = [
  { code: 'L01', label: '图片选择' },
  { code: 'L02', label: '对话-图片匹配' },
  { code: 'L03', label: '短句选答' },
  { code: 'L04', label: '对话选答' },
  { code: 'L05', label: '多题' },
  { code: 'L06', label: '图片判断' },
  { code: 'R01', label: '图文匹配' },
  { code: 'R02', label: '问答匹配' },
  { code: 'R03', label: '选词填空' },
  { code: 'R04', label: '句子排序' },
  { code: 'R05', label: '段落填空' },
  { code: 'R06', label: '完形填空' },
  { code: 'R07', label: '阅读理解' },
  { code: 'W01', label: '部件选择' },
  { code: 'W02', label: '填写汉字' },
  { code: 'W03', label: '看图写句' },
  { code: 'W04', label: '命题作文' },
];
