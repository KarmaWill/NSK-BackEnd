import type { AnswerModeId } from './hskAnswerModes';
import { guessAnswerMode } from './hskAnswerModes';
import { HSK_TYPE_CARD_META } from './hskTypeCardMeta';
import { defaultCompoundForType, getRegistryEntry } from './hskQuestionTypeRegistry';
import type { HskQuestionTypeCode, HskQuestionTypeDef } from '../types/hskExams';

/** 5174 QuestionTypeEditPage 分组作答模式 */
export const GROUPED_ANSWER_MODE_OPTIONS = [
  {
    group: '选择类',
    modes: [
      { label: '单项选择', value: 'single_choice', interaction: 'single_choice' },
      { label: '多项选择', value: 'multiple_choice', interaction: 'multiple_choice' },
      { label: '图片单选', value: 'image_single_choice', interaction: 'image_select' },
      { label: '判断', value: 'true_false', interaction: 'true_false' },
    ],
  },
  {
    group: '匹配与排序类',
    modes: [
      { label: '点击匹配', value: 'mapping_match', interaction: 'mapping_match' },
      { label: '点击排序', value: 'drag_sort', interaction: 'drag_sort' },
    ],
  },
  {
    group: '填空类',
    modes: [
      { label: '点击填空', value: 'fill_blank_controlled', interaction: 'fill_blank_controlled' },
      { label: '键盘输入填空', value: 'fill_blank_open', interaction: 'fill_blank_open' },
    ],
  },
  {
    group: '开放产出类',
    modes: [{ label: '文本写作', value: 'text_production', interaction: 'text_production' }],
  },
  {
    group: '中文特色 — 语音类',
    modes: [{ label: '语音录入', value: 'speech_record', interaction: 'speech_record' }],
  },
  {
    group: '中文特色 — 书写类',
    modes: [{ label: '汉字描红', value: 'handwriting_trace', interaction: 'handwriting_trace' }],
  },
] as const;

export const ANSWER_MODE_UI_OPTIONS = GROUPED_ANSWER_MODE_OPTIONS.flatMap((group) => [...group.modes]);

export type UiAnswerModeId = (typeof GROUPED_ANSWER_MODE_OPTIONS)[number]['modes'][number]['value'];

const UI_TO_STORE: Record<UiAnswerModeId, AnswerModeId> = {
  single_choice: 'single_choice',
  multiple_choice: 'multi_choice',
  image_single_choice: 'image_select',
  true_false: 'true_false',
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
  image_select: 'image_single_choice',
  true_false: 'true_false',
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

export const CHOICE_UI_MODES = new Set<UiAnswerModeId>([
  'single_choice',
  'multiple_choice',
  'image_single_choice',
  'true_false',
]);

export const STEM_FEATURES = [
  { key: 'audio', icon: '🎧', label: '音频', hint: '题干区显示音频上传与播放控件' },
  { key: 'image', icon: '🖼️', label: '图片', hint: '题干区显示图片上传与预览' },
  {
    key: 'multilang',
    icon: '🌐',
    label: '多语言/翻译',
    hint: '题干支持多语言字段，并在录入时提供 AI 一键翻译功能。',
  },
] as const;

export const OPTION_FEATURES = [
  { key: 'image', icon: '🖼️', label: '图片', hint: '每个选项支持上传图片' },
  { key: 'audio', icon: '🎧', label: '音频', hint: '每个选项支持上传或录制独立音频' },
  {
    key: 'multilang',
    icon: '🌐',
    label: '多语言/翻译',
    hint: '每个选项支持多语言字段，并在录入时提供 AI 一键翻译功能。',
  },
] as const;

export const GLOBAL_FEATURES = [
  { key: 'hasSubQuestions', icon: '📋', label: '子题目', hint: '题目包含子题目配置结构（共用题干/材料）' },
  { key: 'hasWordBank', icon: '📚', label: '词库', hint: '提供全局备选词/选项池' },
] as const;

export const FEATURE_CONFIG_GROUPS = [
  {
    id: 'stem' as const,
    title: '题干附加组件',
    lead: '勾选后，在录入该题型时，题干区将提供对应的多媒体上传或输入框。',
    features: STEM_FEATURES,
  },
  {
    id: 'option' as const,
    title: '选项附加组件',
    lead: '勾选后，该题型的每一个选项在录入时将提供对应的附加控件。',
    features: OPTION_FEATURES,
  },
  {
    id: 'global' as const,
    title: '全局结构附加组件',
    lead: '勾选后，题目编辑页将启用子题目、词库等全局复合结构。',
    features: GLOBAL_FEATURES,
  },
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
    stem: { audio: true, image: false, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  multiple_choice: {
    stem: { audio: true, image: false, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  image_single_choice: {
    stem: { audio: true, image: true, multilang: false },
    option: { image: true, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  true_false: {
    stem: { audio: true, image: true, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  mapping_match: {
    stem: { audio: true, image: true, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: true, hasWordBank: false },
  },
  drag_sort: {
    stem: { audio: false, image: false, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  fill_blank_controlled: {
    stem: { audio: false, image: true, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: true },
  },
  fill_blank_open: {
    stem: { audio: false, image: false, multilang: true },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  text_production: {
    stem: { audio: false, image: true, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  speech_record: {
    stem: { audio: true, image: false, multilang: false },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
  handwriting_trace: {
    stem: { audio: false, image: false, multilang: true },
    option: { image: false, audio: false, multilang: false },
    global: { hasSubQuestions: false, hasWordBank: false },
  },
};

export function uiModeLabel(mode: UiAnswerModeId): string {
  const hit = ANSWER_MODE_UI_OPTIONS.find((m) => m.value === mode);
  return hit?.label ?? mode;
}

export function uiModeInteraction(mode: UiAnswerModeId): string {
  const hit = ANSWER_MODE_UI_OPTIONS.find((m) => m.value === mode);
  return hit?.interaction ?? mode;
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
      multilang: !!flags.pinyin || !!flags.writing,
    },
    option: {
      image: !!flags.image,
      audio: false,
      multilang: !!flags.pinyin,
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
    pinyin: features.stem.multilang || features.option.multilang,
    writing: features.stem.multilang,
  };
}

const WORD_BANK_MODES = new Set(['word_fill', 'paragraph_fill', 'cloze', 'image_word']);

const OPTION_IMAGE_TYPES = new Set<HskQuestionTypeCode>(['L01', 'L06']);

export function hasExplicitEditorFlags(flags?: HskQuestionTypeDef['editorFieldFlags']): boolean {
  if (!flags) return false;
  return Object.values(flags).some(Boolean);
}

/** 根据题型 ID / 作答模式 / 卡片元数据推断特征勾选状态 */
export function inferFeaturesFromTypeDef(typeDef: HskQuestionTypeDef): TypeFeatureState {
  const storedMode = guessAnswerMode(typeDef.id, typeDef.answerMode as AnswerModeId | undefined);
  const uiMode = toUiAnswerMode(storedMode);
  const features = recommendFeaturesForUiMode(uiMode);

  const typeId = typeDef.id as HskQuestionTypeCode;
  const meta = HSK_TYPE_CARD_META[typeId];
  if (meta) {
    if (meta.fields.includes('audio')) features.stem.audio = true;
    if (meta.fields.includes('image')) {
      features.stem.image = true;
      if (
        OPTION_IMAGE_TYPES.has(typeId) ||
        meta.interaction.includes('image_select') ||
        meta.interaction === 'image_judgment'
      ) {
        features.option.image = true;
      }
    }
    if (meta.fields.includes('subQuestions')) features.global.hasSubQuestions = true;
  }

  const registry = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  if (registry?.editorFields.includes('subQuestions')) {
    features.global.hasSubQuestions = true;
  }
  if (registry?.editorFields.includes('audio')) {
    features.stem.audio = true;
  }

  const am = typeDef.answerMode ?? storedMode;
  if (WORD_BANK_MODES.has(am)) {
    features.global.hasWordBank = true;
  }
  if (am === 'sentence_fill' || am === 'picture_sentence') {
    features.stem.multilang = true;
  }
  if (am === 'essay') {
    features.stem.multilang = true;
  }

  return features;
}

/** 优先使用已保存的 editorFieldFlags，否则按题型定义推断 */
export function resolveTypeFeatures(typeDef: HskQuestionTypeDef): TypeFeatureState {
  if (hasExplicitEditorFlags(typeDef.editorFieldFlags)) {
    return featuresFromEditorFlags(typeDef.editorFieldFlags!);
  }
  return inferFeaturesFromTypeDef(typeDef);
}
