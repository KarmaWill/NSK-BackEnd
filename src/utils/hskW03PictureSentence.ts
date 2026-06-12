import type { HskQuestionRow } from '../types/hskExams';

export type HskW03Content = {
  keywords?: string[];
  keywordsPinyin?: string[];
  sampleAnswer?: string;
  imageUrl?: string;
  imageDescription?: string;
  minLength?: number;
  maxLength?: number;
  /** 学员端展示用，通常由 keywords 拼接 */
  word?: string;
  hint?: string;
};

export function resolveW03Content(question: HskQuestionRow): Required<
  Pick<HskW03Content, 'keywords' | 'sampleAnswer'>
> & {
  keywordsPinyin: string[];
  minLength: number;
  maxLength: number;
} {
  const content = (question.payload?.content ?? {}) as HskW03Content;
  const keywords = content.keywords?.length
    ? content.keywords
    : content.word
      ? content.word.split(/[、,，]/).map((k) => k.trim()).filter(Boolean)
      : [];

  return {
    keywords,
    keywordsPinyin: content.keywordsPinyin ?? [],
    sampleAnswer: content.sampleAnswer?.trim() ?? '',
    minLength: content.minLength ?? 15,
    maxLength: content.maxLength ?? 50,
  };
}

export function normalizeW03Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'W03') return question;

  const resolved = resolveW03Content(question);
  const content = (question.payload?.content ?? {}) as HskW03Content;
  const word = resolved.keywords.length ? resolved.keywords.join('、') : content.word ?? '';

  return {
    ...question,
    payload: {
      ...question.payload,
      content: {
        ...content,
        keywords: resolved.keywords,
        keywordsPinyin: content.keywordsPinyin ?? resolved.keywordsPinyin,
        sampleAnswer: resolved.sampleAnswer,
        word,
      },
    },
  };
}

export function buildW03PayloadPatch(
  question: HskQuestionRow,
  patch: Partial<Pick<HskW03Content, 'keywords' | 'keywordsPinyin' | 'sampleAnswer'>>,
): HskQuestionRow['payload'] {
  const current = resolveW03Content(question);
  const keywords = patch.keywords ?? current.keywords;
  const keywordsPinyin = patch.keywordsPinyin ?? current.keywordsPinyin;
  const sampleAnswer = patch.sampleAnswer !== undefined ? patch.sampleAnswer : current.sampleAnswer;

  return {
    ...question.payload,
    content: {
      ...(question.payload?.content ?? {}),
      keywords,
      keywordsPinyin,
      sampleAnswer,
      word: keywords.length ? keywords.join('、') : '',
    },
  };
}

export const W03_PREVIEW_HINT = '请用所给词语造一个完整的句子';
