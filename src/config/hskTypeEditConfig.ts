import type { AnswerModeId } from './hskAnswerModes';

/** 5174 QuestionTypeEditPage 分组作答模式 */
export const GROUPED_ANSWER_MODE_OPTIONS = [
  {
    group: '选择类',
    modes: [
      { label: '单项选择', value: 'single_choice', interaction: 'single_choice' },
      { label: '多项选择', value: 'multiple_choice', interaction: 'multiple_choice' },
    ],
  },
  {
    group: '匹配与排序类',
    modes: [
      { label: '连线匹配', value: 'mapping_match', interaction: 'mapping_match' },
      { label: '拖拽排序', value: 'drag_sort', interaction: 'drag_sort' },
    ],
  },
  {
    group: '填空类',
    modes: [
      { label: '选词/拖拽受控填空', value: 'fill_blank_controlled', interaction: 'fill_blank_controlled' },
      { label: '键盘输入开放填空', value: 'fill_blank_open', interaction: 'fill_blank_open' },
    ],
  },
  {
    group: '开放产出类',
    modes: [{ label: '文本写作', value: 'text_production', interaction: 'text_production' }],
  },
  {
    group: '中文特色 — 语音类',
    modes: [{ label: '语音录入 / 口语题', value: 'speech_record', interaction: 'speech_record' }],
  },
  {
    group: '中文特色 — 书写类',
    modes: [{ label: '汉字手写轨迹描红', value: 'handwriting_trace', interaction: 'handwriting_trace' }],
  },
] as const;

export type UiAnswerModeId = (typeof GROUPED_ANSWER_MODE_OPTIONS)[number]['modes'][number]['value'];

const UI_TO_STORE: Record<UiAnswerModeId, AnswerModeId> = {
  single_choice: 'single_choice',
  multiple_choice: 'multi_choice',
  mapping_match: 'image_text_match',
  drag_sort: 'drag_sort',
  fill_blank_controlled: 'word_fill',
  fill_blank_open: 'sentence_fill',
  text_production: 'essay',
  speech_record: 'single_choice',
  handwriting_trace: 'picture_sentence',
};

const STORE_TO_UI: Partial<Record<AnswerModeId, UiAnswerModeId>> = {
  single_choice: 'single_choice',
  multi_choice: 'multiple_choice',
  image_select: 'single_choice',
  true_false: 'single_choice',
  image_text_match: 'mapping_match',
  qa_match: 'mapping_match',
  drag_sort: 'drag_sort',
  word_fill: 'fill_blank_controlled',
  paragraph_fill: 'fill_blank_controlled',
  cloze: 'fill_blank_controlled',
  image_word: 'fill_blank_controlled',
  sentence_fill: 'fill_blank_open',
  picture_sentence: 'handwriting_trace',
  essay: 'text_production',
};

export const CHOICE_UI_MODES = new Set<UiAnswerModeId>(['single_choice', 'multiple_choice']);

export const STEM_FEATURES = [
  { key: 'audio', icon: '🎧', label: '音频', hint: '题干区显示音频上传与播放控件' },
  { key: 'image', icon: '🖼️', label: '图片', hint: '题干区显示图片上传与预览' },
  { key: 'prompt', icon: '📝', label: '提示文本', hint: '题干区显示提示文本输入框' },
  { key: 'pinyin', icon: '🔤', label: '拼音注音', hint: '题干文本字段附带拼音输入' },
] as const;

export const OPTION_FEATURES = [
  { key: 'image', icon: '🖼️', label: '图片', hint: '每个选项支持上传图片' },
  { key: 'audio', icon: '🎧', label: '音频', hint: '每个选项支持上传或录制独立音频' },
  { key: 'pinyin', icon: '🔤', label: '拼音注音', hint: '每个选项文本附带拼音输入' },
] as const;

export const GLOBAL_FEATURES = [
  { key: 'hasSubQuestions', icon: '📋', label: '子题目', hint: '题目包含子题目配置结构' },
  { key: 'hasWordBank', icon: '📚', label: '词库', hint: '提供全局备选词/选项池' },
] as const;

export type StemFeatureKey = (typeof STEM_FEATURES)[number]['key'];
export type OptionFeatureKey = (typeof OPTION_FEATURES)[number]['key'];
export type GlobalFeatureKey = (typeof GLOBAL_FEATURES)[number]['key'];

export type TypeFeatureState = {
  stem: Record<StemFeatureKey, boolean>;
  option: Record<OptionFeatureKey, boolean>;
  global: Record<GlobalFeatureKey, boolean>;
};

const MODE_RECOMMEND: Record<UiAnswerModeId, TypeFeatureState> = {
  single_choice: {
    stem: { audio: true, image: false, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  multiple_choice: {
    stem: { audio: true, image: false, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  mapping_match: {
    stem: { audio: true, image: true, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: true, hasWordBank: false },
  },
  drag_sort: {
    stem: { audio: false, image: false, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  fill_blank_controlled: {
    stem: { audio: false, image: true, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: true },
  },
  fill_blank_open: {
    stem: { audio: false, image: false, prompt: false, pinyin: true },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  text_production: {
    stem: { audio: false, image: true, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  speech_record: {
    stem: { audio: true, image: false, prompt: false, pinyin: false },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  handwriting_trace: {
    stem: { audio: false, image: false, prompt: false, pinyin: true },
    option: { image: false, audio: false, pinyin: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
};

export function uiModeLabel(mode: UiAnswerModeId): string {
  for (const group of GROUPED_ANSWER_MODE_OPTIONS) {
    const hit = group.modes.find((m) => m.value === mode);
    if (hit) return hit.label;
  }
  return mode;
}

export function uiModeInteraction(mode: UiAnswerModeId): string {
  for (const group of GROUPED_ANSWER_MODE_OPTIONS) {
    const hit = group.modes.find((m) => m.value === mode);
    if (hit) return hit.interaction;
  }
  return mode;
}

export function toUiAnswerMode(stored?: AnswerModeId): UiAnswerModeId {
  if (stored && STORE_TO_UI[stored]) return STORE_TO_UI[stored]!;
  return 'single_choice';
}

export function toStoredAnswerMode(ui: UiAnswerModeId): AnswerModeId {
  return UI_TO_STORE[ui];
}

export function recommendFeaturesForUiMode(mode: UiAnswerModeId): TypeFeatureState {
  return structuredClone(MODE_RECOMMEND[mode]);
}

export function featuresFromEditorFlags(flags: {
  audio?: boolean;
  image?: boolean;
  subQuestions?: boolean;
  wordBank?: boolean;
  pinyin?: boolean;
  writing?: boolean;
}): TypeFeatureState {
  return {
    stem: {
      audio: !!flags.audio,
      image: !!flags.image,
      prompt: !!flags.writing,
      pinyin: !!flags.pinyin,
    },
    option: {
      image: !!flags.image,
      audio: false,
      pinyin: !!flags.pinyin,
    },
    global: {
      hasSubQuestions: !!flags.subQuestions,
      hasWordBank: !!flags.wordBank,
    },
  };
}

export function editorFlagsFromFeatures(features: TypeFeatureState) {
  return {
    audio: features.stem.audio,
    image: features.stem.image || features.option.image,
    subQuestions: features.global.hasSubQuestions,
    wordBank: features.global.hasWordBank,
    pinyin: features.stem.pinyin || features.option.pinyin,
    writing: features.stem.prompt,
  };
}
