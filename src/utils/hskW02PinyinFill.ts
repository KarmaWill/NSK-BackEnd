import type { HskQuestionRow } from '../types/hskExams';

export type HskW02PinyinHint = {
  textBefore: string;
  textAfter: string;
  /** 挖空处拼音提示，如 shuǐguǒ 或 (shuǐguǒ) */
  pinyin: string;
  answer: string;
  /** 前文 ruby 拼音（空格分隔音节，与汉字一一对应） */
  textBeforePinyin?: string;
  /** 后文 ruby 拼音 */
  textAfterPinyin?: string;
  /** 兼容 HSK-Exams：含 ___ 的整句 */
  sentence?: string;
};

export type HskW02Content = {
  pinyinHints?: HskW02PinyinHint[];
  /** 首条运行时 sentence（学员端单题渲染） */
  sentence?: string;
  /** 首条运行时 pinyin */
  pinyin?: string;
};

const BLANK_RE = /_{2,}/;

export function formatW02PinyinHintDisplay(pinyin: string): string {
  const trimmed = pinyin.trim();
  if (!trimmed) return '(pinyin)';
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return trimmed;
  return `(${trimmed})`;
}

export function hintFromLegacy(raw: Partial<HskW02PinyinHint>): HskW02PinyinHint {
  if (raw.textBefore !== undefined || raw.textAfter !== undefined) {
    return {
      textBefore: raw.textBefore?.trim() ?? '',
      textAfter: raw.textAfter?.trim() ?? '',
      pinyin: raw.pinyin?.trim() ?? '',
      answer: raw.answer?.trim() ?? '',
      textBeforePinyin: raw.textBeforePinyin?.trim(),
      textAfterPinyin: raw.textAfterPinyin?.trim(),
      sentence: raw.sentence,
    };
  }

  const sentence = raw.sentence?.trim() ?? '';
  if (sentence && BLANK_RE.test(sentence)) {
    const [textBefore, textAfter = ''] = sentence.split(BLANK_RE);
    return {
      textBefore: textBefore.trim(),
      textAfter: textAfter.trim(),
      pinyin: raw.pinyin?.trim() ?? '',
      answer: raw.answer?.trim() ?? '',
      sentence,
    };
  }

  return {
    textBefore: sentence,
    textAfter: '',
    pinyin: raw.pinyin?.trim() ?? '',
    answer: raw.answer?.trim() ?? '',
    sentence: sentence || undefined,
  };
}

export function hintToSentence(hint: HskW02PinyinHint): string {
  if (hint.sentence?.trim() && BLANK_RE.test(hint.sentence)) return hint.sentence.trim();
  return `${hint.textBefore}___${hint.textAfter}`;
}

export function createEmptyW02Hint(): HskW02PinyinHint {
  return { textBefore: '', textAfter: '', pinyin: '', answer: '' };
}

export function resolveW02PinyinHints(question: HskQuestionRow): HskW02PinyinHint[] {
  const content = (question.payload?.content ?? {}) as HskW02Content;
  const raw = content.pinyinHints ?? [];
  if (raw.length) return raw.map((item) => hintFromLegacy(item));

  if (content.sentence?.trim()) {
    return [
      hintFromLegacy({
        sentence: content.sentence,
        pinyin: content.pinyin,
        answer: question.correctAnswer?.split(/[,，]/)[0]?.trim() ?? '',
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
  if (hints.length === 1 && !hints[0].textBefore && !hints[0].answer) {
    hints = getW02SeedDefaults(question.question_uid) ?? hints;
  }

  const normalized = hints.map((hint) => {
    const next = hintFromLegacy(hint);
    return {
      ...next,
      sentence: hintToSentence(next),
    };
  });

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
  patch: { pinyinHints?: HskW02PinyinHint[] },
): HskQuestionRow['payload'] {
  const hints = (patch.pinyinHints ?? resolveW02PinyinHints(question)).map((hint) => {
    const next = hintFromLegacy(hint);
    return { ...next, sentence: hintToSentence(next) };
  });
  const first = hints[0] ?? createEmptyW02Hint();

  return {
    ...question.payload,
    content: {
      ...(question.payload?.content ?? {}),
      pinyinHints: hints,
      sentence: hintToSentence(first),
      pinyin: first.pinyin,
    },
  };
}

/** 种子题默认挖空句（对齐 HSK-Exams bundle） */
function getW02SeedDefaults(questionUid: string): HskW02PinyinHint[] | null {
  if (questionUid === 'Q-029') {
    return [
      { textBefore: '我每天早', textAfter: '去学校。', pinyin: 'shàng', answer: '上' },
      { textBefore: '这本书很', textAfter: '看。', pinyin: 'hǎo', answer: '好' },
      { textBefore: '他是我最好的', textAfter: '友。', pinyin: 'péng', answer: '朋' },
    ];
  }
  if (questionUid === 'Q-030') {
    return [
      { textBefore: '春天来了，天', textAfter: '变暖和了。', pinyin: 'qì', answer: '气' },
      { textBefore: '我', textAfter: '去北京旅游。', pinyin: 'xiǎng', answer: '想' },
      { textBefore: '这个菜太', textAfter: '了。', pinyin: 'xián', answer: '咸' },
      { textBefore: '请关', textAfter: '门。', pinyin: 'shàng', answer: '上' },
    ];
  }
  return null;
}

export const W02_PREVIEW_HINT = '请根据拼音写出正确的汉字';
