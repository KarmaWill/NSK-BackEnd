import type { HskQuestionTypeCode } from '../types/hskExams';

export type TypeCardModeTone =
  | 'single'
  | 'multi'
  | 'fill'
  | 'essay'
  | 'judgment'
  | 'matching'
  | 'ordering'
  | 'default';

export type TypeCardField = 'audio' | 'image' | 'subQuestions';

export type HskTypeCardMeta = {
  icon: string;
  modeLabel: string;
  modeTone: TypeCardModeTone;
  interaction: string;
  optionSummary: string;
  fields: TypeCardField[];
};

const LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

function optionSummary(count: number): string {
  if (count <= 0) return '—';
  return `${count} 个选项（${LABELS.slice(0, count).join('、')}）`;
}

export const HSK_TYPE_CARD_META: Record<HskQuestionTypeCode, HskTypeCardMeta> = {
  L01: {
    icon: '⭕',
    modeLabel: '单选题',
    modeTone: 'single',
    interaction: 'image_select',
    optionSummary: optionSummary(3),
    fields: ['audio', 'image'],
  },
  L02: {
    icon: '🔗',
    modeLabel: '匹配题',
    modeTone: 'matching',
    interaction: 'two_tap_pair',
    optionSummary: '—',
    fields: ['audio', 'image', 'subQuestions'],
  },
  L03: {
    icon: '🖼️',
    modeLabel: '单选题',
    modeTone: 'single',
    interaction: 'text_select',
    optionSummary: optionSummary(3),
    fields: ['audio'],
  },
  L04: {
    icon: '💬',
    modeLabel: '单选题',
    modeTone: 'single',
    interaction: 'text_select',
    optionSummary: optionSummary(4),
    fields: ['audio'],
  },
  L05: {
    icon: '📋',
    modeLabel: '单选题',
    modeTone: 'single',
    interaction: 'multi_sub_choice',
    optionSummary: optionSummary(3),
    fields: ['audio', 'subQuestions'],
  },
  L06: {
    icon: '📄',
    modeLabel: '判断题',
    modeTone: 'judgment',
    interaction: 'image_judgment',
    optionSummary: '2 个选项（✓ 正确、✗ 错误）',
    fields: ['audio', 'image'],
  },
  R01: {
    icon: '🔗',
    modeLabel: '匹配题',
    modeTone: 'matching',
    interaction: 'two_tap_pair_image_text',
    optionSummary: '—',
    fields: ['image'],
  },
  R02: {
    icon: '↔️',
    modeLabel: '匹配题',
    modeTone: 'matching',
    interaction: 'two_tap_pair_text_text',
    optionSummary: '—',
    fields: ['image'],
  },
  R03: {
    icon: '📝',
    modeLabel: '填空题',
    modeTone: 'fill',
    interaction: 'word_bank_select',
    optionSummary: '—',
    fields: ['subQuestions'],
  },
  R04: {
    icon: '🔀',
    modeLabel: '排序题',
    modeTone: 'ordering',
    interaction: 'two_tap_sort',
    optionSummary: '—',
    fields: ['subQuestions'],
  },
  R05: {
    icon: '📑',
    modeLabel: '填空题',
    modeTone: 'fill',
    interaction: 'passage_option_select',
    optionSummary: '—',
    fields: ['subQuestions'],
  },
  R06: {
    icon: '📖',
    modeLabel: '填空题',
    modeTone: 'fill',
    interaction: 'cloze_split_screen',
    optionSummary: optionSummary(4),
    fields: ['subQuestions'],
  },
  R07: {
    icon: '📰',
    modeLabel: '单选题',
    modeTone: 'single',
    interaction: 'passage_sub_choice',
    optionSummary: optionSummary(4),
    fields: ['subQuestions'],
  },
  R08: {
    icon: '🖼️',
    modeLabel: '判断题',
    modeTone: 'judgment',
    interaction: 'image_judgment',
    optionSummary: '2 个选项（✓ 对、✗ 错）',
    fields: ['image'],
  },
  R09: {
    icon: '📝',
    modeLabel: '填空题',
    modeTone: 'fill',
    interaction: 'image_word_select',
    optionSummary: '—',
    fields: ['image', 'subQuestions'],
  },
  W01: {
    icon: '✍️',
    modeLabel: '匹配题',
    modeTone: 'matching',
    interaction: 'component_match',
    optionSummary: '—',
    fields: ['image'],
  },
  W02: {
    icon: '🔤',
    modeLabel: '填空题',
    modeTone: 'fill',
    interaction: 'pinyin_hint_blank',
    optionSummary: '—',
    fields: ['image'],
  },
  W03: {
    icon: '🖊️',
    modeLabel: '简答题',
    modeTone: 'essay',
    interaction: 'image_sentence',
    optionSummary: '—',
    fields: ['image'],
  },
  W04: {
    icon: '📃',
    modeLabel: '简答题',
    modeTone: 'essay',
    interaction: 'topic_free_text',
    optionSummary: '—',
    fields: [],
  },
};

const FIELD_LABELS: Record<TypeCardField, { icon: string; label: string }> = {
  audio: { icon: '🎧', label: '音频' },
  image: { icon: '🖼️', label: '图片' },
  subQuestions: { icon: '📋', label: '子题' },
};

export function getTypeCardMeta(typeId: string): HskTypeCardMeta {
  return HSK_TYPE_CARD_META[typeId as HskQuestionTypeCode] ?? {
    icon: '◇',
    modeLabel: '自定义题型',
    modeTone: 'default',
    interaction: 'custom',
    optionSummary: '—',
    fields: [],
  };
}

export function getTypeCardFieldLabel(field: TypeCardField) {
  return FIELD_LABELS[field];
}
