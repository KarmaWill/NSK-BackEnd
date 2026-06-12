import type { HskRuntimeOption } from '../types/hskExams';

export type HskMatchSentence = {
  key: string;
  text: string;
  pinyin?: string;
};

export function defaultR01Sentences(count = 3): HskMatchSentence[] {
  return Array.from({ length: count }, (_, idx) => ({
    key: `s${idx + 1}`,
    text: '',
    pinyin: '',
  }));
}

export function parseR01CorrectAnswer(correctAnswer: string): Array<{ sentenceKey: string; imageIndex: number }> {
  if (!correctAnswer.includes(':')) return [];

  return correctAnswer
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [sentenceKey, imgPart] = pair.split(':');
      const imageIndex = Number.parseInt(imgPart?.replace(/^img/i, '') ?? '', 10);
      return {
        sentenceKey: sentenceKey?.trim() ?? '',
        imageIndex: Number.isFinite(imageIndex) && imageIndex > 0 ? imageIndex : 1,
      };
    });
}

export function buildR01CorrectAnswer(
  pairings: Record<string, string | 'distractor' | ''>,
  imageKeys: string[],
): string {
  const pairs: string[] = [];

  for (const [imageKey, sentenceKey] of Object.entries(pairings)) {
    if (!sentenceKey || sentenceKey === 'distractor') continue;
    const imageIndex = imageKeys.indexOf(imageKey) + 1;
    if (imageIndex > 0) {
      pairs.push(`${sentenceKey}:img${imageIndex}`);
    }
  }

  return pairs.join(',');
}

export function pairingsFromR01CorrectAnswer(
  correctAnswer: string,
  imageKeys: string[],
): Record<string, string | 'distractor' | ''> {
  const result: Record<string, string | 'distractor' | ''> = {};
  for (const key of imageKeys) {
    result[key] = '';
  }

  for (const pair of parseR01CorrectAnswer(correctAnswer)) {
    const imageKey = imageKeys[pair.imageIndex - 1];
    if (imageKey && pair.sentenceKey) {
      result[imageKey] = pair.sentenceKey;
    }
  }

  return result;
}

export function resolveR01Sentences(
  sentences: HskMatchSentence[] | undefined,
  correctAnswer: string,
  imageOptions: HskRuntimeOption[],
): HskMatchSentence[] {
  if (sentences?.length) return sentences;

  const parsed = parseR01CorrectAnswer(correctAnswer);
  const count = Math.max(parsed.length, imageOptions.length >= 2 ? imageOptions.length : 3);
  return defaultR01Sentences(count);
}
