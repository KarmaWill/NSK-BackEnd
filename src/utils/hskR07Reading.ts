import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { sumSubQuestionScores } from './hskL02SubQuestions';

const DEFAULT_OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function defaultSubOptions(): HskRuntimeOption[] {
  return DEFAULT_OPTION_KEYS.map((key) => ({ key, text: '', pinyin: '' }));
}

export function createR07SubQuestion(index: number): HskSubQuestionPayload {
  return {
    id: index,
    question: '',
    answer: '',
    score: 2,
    options: defaultSubOptions(),
  };
}

export function defaultR07SubQuestions(): HskSubQuestionPayload[] {
  return [createR07SubQuestion(1), createR07SubQuestion(2)];
}

export function normalizeR07SubQuestion(
  sub: HskSubQuestionPayload,
  index: number,
  fallbackAnswer?: string,
): HskSubQuestionPayload {
  const options =
    sub.options && sub.options.length >= 2
      ? sub.options.map((opt, optIdx) => ({
          key: opt.key || String.fromCharCode(65 + optIdx),
          text: opt.text ?? '',
          pinyin: opt.pinyin ?? '',
        }))
      : defaultSubOptions();

  return {
    ...sub,
    id: sub.id ?? index + 1,
    question: sub.question ?? '',
    answer: sub.answer || fallbackAnswer || '',
    score: sub.score > 0 ? sub.score : 2,
    options,
  };
}

export function parseR07CorrectAnswer(correctAnswer: string): string[] {
  if (!correctAnswer.trim()) return [];
  return correctAnswer
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildR07CorrectAnswer(subQuestions: HskSubQuestionPayload[]): string {
  return subQuestions
    .map((sub) => sub.answer?.trim() ?? '')
    .filter(Boolean)
    .join(',');
}

export function resolveR07SubQuestions(
  subQuestions: HskSubQuestionPayload[] | undefined,
  correctAnswer: string,
): HskSubQuestionPayload[] {
  const answers = parseR07CorrectAnswer(correctAnswer);
  if (subQuestions?.length) {
    return subQuestions.map((sub, idx) => normalizeR07SubQuestion(sub, idx, answers[idx]));
  }
  const count = Math.max(answers.length, 2);
  return Array.from({ length: count }, (_, idx) =>
    normalizeR07SubQuestion(createR07SubQuestion(idx + 1), idx, answers[idx]),
  );
}

/** 预览/答题区题号：1、2、3…（不含 r7q 前缀与尾部句点） */
export function formatR07SubDisplayId(sub: HskSubQuestionPayload, index: number): string {
  const raw = sub.id;
  if (typeof raw === 'number' && raw > 0) return String(raw);
  if (typeof raw === 'string') {
    const legacy = raw.match(/^r7q(\d+)$/i);
    if (legacy) return legacy[1];
    if (/^\d+$/.test(raw)) return raw;
  }
  return String(index + 1);
}

export function rekeySubQuestionOptions(options: HskRuntimeOption[]): HskRuntimeOption[] {
  return options.map((option, idx) => ({
    ...option,
    key: String.fromCharCode(65 + idx),
  }));
}

export function resolveR07Content(
  content:
    | {
        article?: string;
        articlePinyin?: string;
        paragraph?: string;
        paragraphPinyin?: string;
      }
    | undefined,
  subQuestions: HskSubQuestionPayload[] | undefined,
  correctAnswer: string,
): {
  article: string;
  articlePinyin: string;
  subQuestions: HskSubQuestionPayload[];
} {
  return {
    article: content?.article ?? content?.paragraph ?? '',
    articlePinyin: content?.articlePinyin ?? content?.paragraphPinyin ?? '',
    subQuestions: resolveR07SubQuestions(subQuestions, correctAnswer),
  };
}

export function syncR07AggregatedScore(subQuestions: HskSubQuestionPayload[]): number {
  return sumSubQuestionScores(subQuestions);
}

export function optionDisplayLabel(option: HskRuntimeOption): string {
  const text = option.text?.trim();
  return text ? `${option.key}. ${text}` : option.key;
}
