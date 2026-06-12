import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { sumSubQuestionScores } from './hskL02SubQuestions';

const DEFAULT_OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function defaultSubOptions(): HskRuntimeOption[] {
  return DEFAULT_OPTION_KEYS.map((key) => ({ key, text: '', pinyin: '' }));
}

export function createL05SubQuestion(index: number): HskSubQuestionPayload {
  return {
    id: index,
    question: '',
    answer: 'A',
    score: 2,
    options: defaultSubOptions(),
  };
}

export function defaultL05SubQuestions(): HskSubQuestionPayload[] {
  return [createL05SubQuestion(1), createL05SubQuestion(2)];
}

export function normalizeL05SubQuestion(sub: HskSubQuestionPayload, index: number): HskSubQuestionPayload {
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
    answer: sub.answer || options[0]?.key || 'A',
    score: sub.score > 0 ? sub.score : 2,
    options,
  };
}

export function resolveL05SubQuestions(subQuestions?: HskSubQuestionPayload[]): HskSubQuestionPayload[] {
  if (subQuestions?.length) {
    return subQuestions.map((sub, idx) => normalizeL05SubQuestion(sub, idx));
  }
  return defaultL05SubQuestions();
}

/** 预览/考试端子题 id，对齐 HSK-Exams 默认 l5q1、l5q2 */
export function formatL05SubDisplayId(sub: HskSubQuestionPayload, index: number): string {
  const raw = sub.id;
  if (typeof raw === 'string' && /^l5q\d+$/i.test(raw)) return raw;
  return `l5q${index + 1}`;
}

export function syncAggregatedSubQuestionScore(subQuestions: HskSubQuestionPayload[]): number {
  return sumSubQuestionScores(subQuestions);
}
