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

function splitKeywordText(text: string): string[] {
  return text.split(/[、,，]/).map((k) => k.trim()).filter(Boolean);
}

/** 从 explanation 解析「关键词：A、B、C」 */
export function parseW03KeywordsFromExplanation(explanation?: string): string[] {
  if (!explanation?.trim()) return [];
  const match = explanation.match(/关键词[：:]\s*([^。\n]+)/);
  if (!match) return [];
  return splitKeywordText(match[1]);
}

/** 从 explanation 解析「参考答案：…」 */
export function parseW03SampleAnswerFromExplanation(explanation?: string): string {
  if (!explanation?.trim()) return '';
  const match = explanation.match(/参考答案[：:]\s*([^。\n]+)/);
  return match?.[1]?.trim() ?? '';
}

export function resolveW03Keywords(
  content: HskW03Content,
  explanation?: string,
): string[] {
  if (content.keywords?.length) return content.keywords;
  if (content.word?.trim()) return splitKeywordText(content.word);
  return parseW03KeywordsFromExplanation(explanation);
}

export function resolveW03Content(question: HskQuestionRow): Required<
  Pick<HskW03Content, 'keywords' | 'sampleAnswer'>
> & {
  keywordsPinyin: string[];
  minLength: number;
  maxLength: number;
  word: string;
} {
  const content = (question.payload?.content ?? {}) as HskW03Content;
  const keywords = resolveW03Keywords(content, question.explanation);
  const sampleAnswer =
    content.sampleAnswer?.trim() || parseW03SampleAnswerFromExplanation(question.explanation);
  const word = keywords.length ? keywords.join('、') : content.word?.trim() ?? '';

  return {
    keywords,
    keywordsPinyin: content.keywordsPinyin ?? [],
    sampleAnswer,
    minLength: content.minLength ?? 15,
    maxLength: content.maxLength ?? 50,
    word,
  };
}

export function normalizeW03Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'W03') return question;

  const resolved = resolveW03Content(question);
  const content = (question.payload?.content ?? {}) as HskW03Content;

  return {
    ...question,
    payload: {
      ...question.payload,
      content: {
        ...content,
        keywords: resolved.keywords,
        keywordsPinyin: content.keywordsPinyin ?? resolved.keywordsPinyin,
        sampleAnswer: resolved.sampleAnswer,
        word: resolved.word,
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
