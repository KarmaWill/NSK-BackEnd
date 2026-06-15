import type { HskQuestionRow } from '../types/hskExams';
import { tokenizeR05Paragraph } from './hskR05ParagraphFill';

export type HskW02PinyinHint = {
  /** 整句文本，挖空用（pinyin）/（）/ ___ 标记 */
  sentence: string;
  /** 整句 ruby 拼音（挖空处汉字不计入，自动跳过） */
  sentencePinyin?: string;
  answer: string;
  /** 挖空处拼音（由 sentence 解析，供预览/兼容） */
  pinyin: string;
  textBefore: string;
  textAfter: string;
  /** @deprecated 请用 sentencePinyin */
  textBeforePinyin?: string;
  /** @deprecated 请用 sentencePinyin */
  textAfterPinyin?: string;
};

export type HskW02Content = {
  pinyinHints?: HskW02PinyinHint[];
  /** 学员端/预览作答时是否显示 ✓/✗ 对错反馈，默认开启 */
  showFillFeedback?: boolean;
  /** 首条运行时 sentence（学员端单题渲染） */
  sentence?: string;
  /** 首条运行时 pinyin（挖空提示） */
  pinyin?: string;
};

const BLANK_RE = /_{2,}/;

export function formatW02PinyinHintDisplay(pinyin: string): string {
  const trimmed = pinyin.trim();
  if (!trimmed) return '(pinyin)';
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return trimmed;
  return `(${trimmed})`;
}

/** 从 legacy 字段或 sentence 构建整句 */
export function buildW02Sentence(raw: Partial<HskW02PinyinHint>): string {
  if (raw.sentence?.trim()) return raw.sentence.trim();

  const before = raw.textBefore ?? '';
  const after = raw.textAfter ?? '';
  const py = raw.pinyin?.trim() ?? '';

  if (py && (before || after)) return `${before}（${py}）${after}`;
  if (BLANK_RE.test(`${before}${after}`) || BLANK_RE.test(before)) {
    return before.includes('___') ? before : `${before}___${after}`;
  }
  if (/[（(][^（）()]*[）)]/.test(`${before}${after}`)) return `${before}${after}`;
  if (before || after) return `${before}___${after}`;
  return '';
}

/** 从整句解析挖空前后文与括号内拼音提示 */
export function parseW02SentenceParts(sentence: string): {
  textBefore: string;
  textAfter: string;
  blankPinyin: string;
  hasBlank: boolean;
} {
  const tokens = tokenizeR05Paragraph(sentence);
  let textBefore = '';
  let textAfter = '';
  let blankPinyin = '';
  let hasBlank = false;
  let pastBlank = false;

  for (const token of tokens) {
    if (token.type === 'blank') {
      hasBlank = true;
      if (!pastBlank) {
        blankPinyin = token.embeddedPinyin?.trim() ?? '';
        pastBlank = true;
      }
    } else if (!pastBlank) {
      textBefore += token.text;
    } else {
      textAfter += token.text;
    }
  }

  if (!hasBlank && BLANK_RE.test(sentence)) {
    const [before, after = ''] = sentence.split(BLANK_RE);
    return {
      textBefore: before,
      textAfter: after,
      blankPinyin: '',
      hasBlank: true,
    };
  }

  return { textBefore, textAfter, blankPinyin, hasBlank };
}

export function normalizeW02Hint(raw: Partial<HskW02PinyinHint>): HskW02PinyinHint {
  const sentence = buildW02Sentence(raw);
  const { textBefore, textAfter, blankPinyin } = parseW02SentenceParts(sentence);
  const sentencePinyin =
    raw.sentencePinyin?.trim() ||
    raw.textBeforePinyin?.trim() ||
    raw.textAfterPinyin?.trim() ||
    undefined;

  return {
    sentence,
    sentencePinyin,
    answer: raw.answer?.trim() ?? '',
    pinyin: blankPinyin || raw.pinyin?.trim() || '',
    textBefore,
    textAfter,
    textBeforePinyin: raw.textBeforePinyin?.trim() || undefined,
    textAfterPinyin: raw.textAfterPinyin?.trim() || undefined,
  };
}

export function hintFromLegacy(raw: Partial<HskW02PinyinHint>): HskW02PinyinHint {
  return normalizeW02Hint(raw);
}

export function hintToSentence(hint: HskW02PinyinHint): string {
  return buildW02Sentence(hint);
}

export function createEmptyW02Hint(): HskW02PinyinHint {
  return normalizeW02Hint({ sentence: '', answer: '', pinyin: '', textBefore: '', textAfter: '' });
}

export function isW02HintComplete(hint: HskW02PinyinHint): boolean {
  const normalized = normalizeW02Hint(hint);
  if (!normalized.sentence.trim() || !normalized.answer.trim()) return false;
  const { hasBlank, blankPinyin } = parseW02SentenceParts(normalized.sentence);
  return hasBlank && Boolean(blankPinyin);
}

export function resolveW02ShowFillFeedback(question: HskQuestionRow): boolean {
  const content = (question.payload?.content ?? {}) as HskW02Content;
  return content.showFillFeedback !== false;
}

export function resolveW02PinyinHints(question: HskQuestionRow): HskW02PinyinHint[] {
  const content = (question.payload?.content ?? {}) as HskW02Content;
  const raw = content.pinyinHints ?? [];
  if (raw.length) return raw.map((item) => normalizeW02Hint(item));

  if (content.sentence?.trim()) {
    return [
      normalizeW02Hint({
        sentence: content.sentence,
        sentencePinyin: content.pinyin,
        answer: question.correctAnswer?.split(/[,，]/)[0]?.trim() ?? '',
        pinyin: content.pinyin ?? '',
      }),
    ];
  }

  return [createEmptyW02Hint()];
}

export function buildW02CorrectAnswer(hints: HskW02PinyinHint[]): string {
  return hints.map((h) => h.answer.trim()).filter(Boolean).join(',');
}

export function normalizeW02Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'W02') return question;

  let hints = resolveW02PinyinHints(question);
  if (hints.length === 1 && !hints[0].sentence.trim() && !hints[0].answer) {
    hints = getW02SeedDefaults(question.question_uid) ?? hints;
  }

  const normalized = hints.map((hint) => normalizeW02Hint(hint));
  const first = normalized[0] ?? createEmptyW02Hint();

  return {
    ...question,
    correctAnswer: buildW02CorrectAnswer(normalized) || question.correctAnswer,
    payload: {
      ...question.payload,
      content: {
        ...(question.payload?.content ?? {}),
        pinyinHints: normalized,
        sentence: hintToSentence(first),
        pinyin: first.pinyin,
      },
    },
  };
}

export function buildW02PayloadPatch(
  question: HskQuestionRow,
  patch: { pinyinHints?: HskW02PinyinHint[]; showFillFeedback?: boolean },
): HskQuestionRow['payload'] {
  const content = (question.payload?.content ?? {}) as HskW02Content;
  const hints = (patch.pinyinHints ?? resolveW02PinyinHints(question)).map((hint) =>
    normalizeW02Hint(hint),
  );
  const first = hints[0] ?? createEmptyW02Hint();
  const showFillFeedback =
    patch.showFillFeedback !== undefined ? patch.showFillFeedback : content.showFillFeedback;

  return {
    ...question.payload,
    content: {
      ...content,
      pinyinHints: hints,
      sentence: hintToSentence(first),
      pinyin: first.pinyin,
      ...(showFillFeedback !== undefined ? { showFillFeedback } : {}),
    },
  };
}

function getW02SeedDefaults(questionUid: string): HskW02PinyinHint[] | null {
  if (questionUid === 'Q-029') {
    return [
      normalizeW02Hint({ sentence: '我每天早（shàng）去学校。', answer: '上' }),
      normalizeW02Hint({ sentence: '这本书很（hǎo）看。', answer: '好' }),
      normalizeW02Hint({ sentence: '他是我最好的（péng）友。', answer: '朋' }),
    ];
  }
  if (questionUid === 'Q-030') {
    return [
      normalizeW02Hint({ sentence: '春天来了，天（qì）变暖和了。', answer: '气' }),
      normalizeW02Hint({ sentence: '我（xiǎng）去北京旅游。', answer: '想' }),
      normalizeW02Hint({ sentence: '这个菜太（xián）了。', answer: '咸' }),
      normalizeW02Hint({ sentence: '请关（shàng）门。', answer: '上' }),
    ];
  }
  return null;
}

export const W02_PREVIEW_HINT = '请根据拼音写出正确的汉字';
