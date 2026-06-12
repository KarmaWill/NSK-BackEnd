import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';

/** 从 legacy correctAnswer（sq1:img1,sq2:img2）解析子题 */
export function parseLegacyL02CorrectAnswer(
  correctAnswer: string,
  imageOptionKeys: string[],
): HskSubQuestionPayload[] {
  if (!correctAnswer.includes(':')) return [];

  return correctAnswer
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair, idx) => {
      const [sqPart, imgPart] = pair.split(':');
      const imgNum = Number.parseInt(imgPart?.replace(/^img/i, '') ?? '', 10);
      const answer =
        (Number.isFinite(imgNum) && imgNum > 0 ? imageOptionKeys[imgNum - 1] : undefined) ??
        imageOptionKeys[idx] ??
        'A';
      const sqNum = Number.parseInt(sqPart?.replace(/^sq/i, '') ?? '', 10);
      return {
        id: Number.isFinite(sqNum) && sqNum > 0 ? sqNum : idx + 1,
        answer,
        score: 1,
        question: '',
      };
    });
}

export function buildLegacyL02CorrectAnswer(
  subQuestions: HskSubQuestionPayload[],
  imageOptionKeys: string[],
): string {
  return subQuestions
    .map((sub, idx) => {
      const imgIdx = Math.max(1, imageOptionKeys.indexOf(sub.answer) + 1) || idx + 1;
      const sqId = sub.id ?? idx + 1;
      return `sq${sqId}:img${imgIdx}`;
    })
    .join(',');
}

export function defaultL02SubQuestions(imageOptionKeys: string[]): HskSubQuestionPayload[] {
  const keys = imageOptionKeys.length >= 2 ? imageOptionKeys.slice(0, 2) : ['A', 'B'];
  return keys.map((key, idx) => ({
    id: idx + 1,
    answer: key,
    score: 2,
    question: '',
  }));
}

export function resolveL02SubQuestions(
  subQuestions: HskSubQuestionPayload[] | undefined,
  correctAnswer: string,
  imageOptions: HskRuntimeOption[],
): HskSubQuestionPayload[] {
  const keys = imageOptions.map((o) => o.key);
  if (subQuestions?.length) return subQuestions;
  const parsed = parseLegacyL02CorrectAnswer(correctAnswer, keys);
  if (parsed.length) return parsed;
  return defaultL02SubQuestions(keys);
}

export function sumSubQuestionScores(subQuestions: HskSubQuestionPayload[]): number {
  return subQuestions.reduce((sum, sub) => sum + (sub.score > 0 ? sub.score : 0), 0);
}

function l02SubDisplayId(sub: HskSubQuestionPayload, index: number): string {
  return `sq${sub.id ?? index + 1}`;
}

export function pairingsFromL02SubQuestions(
  subQuestions: HskSubQuestionPayload[],
  imageOptionKeys: string[],
): Record<string, string | 'distractor' | ''> {
  const result: Record<string, string | 'distractor' | ''> = {};
  for (const key of imageOptionKeys) {
    result[key] = '';
  }

  subQuestions.forEach((sub, idx) => {
    if (sub.answer && imageOptionKeys.includes(sub.answer)) {
      result[sub.answer] = l02SubDisplayId(sub, idx);
    }
  });

  return result;
}

export function applyL02ImagePairings(
  subQuestions: HskSubQuestionPayload[],
  _imageOptionKeys: string[],
  pairings: Record<string, string | 'distractor' | ''>,
): HskSubQuestionPayload[] {
  const next = subQuestions.map((sub) => ({ ...sub }));

  for (const [imageKey, subId] of Object.entries(pairings)) {
    if (!subId || subId === 'distractor') continue;
    const subIndex = next.findIndex((sub, idx) => l02SubDisplayId(sub, idx) === subId);
    if (subIndex >= 0) {
      next[subIndex] = { ...next[subIndex], answer: imageKey };
    }
  }

  return next;
}
