export type HskR02QuestionItem = {
  id: string;
  text: string;
  pinyin?: string;
};

export type HskR02AnswerItem = {
  id: string;
  text: string;
  pinyin?: string;
  /** 干扰项：不参与任何问题的正确配对 */
  isDistractor?: boolean;
};

export function defaultR02Questions(count = 3): HskR02QuestionItem[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `q${idx + 1}`,
    text: '',
    pinyin: '',
  }));
}

/** 默认含 1 个干扰项（比问题多 1 个回答） */
export function defaultR02Answers(questionCount = 3): HskR02AnswerItem[] {
  const count = Math.max(questionCount + 1, 4);
  return Array.from({ length: count }, (_, idx) => ({
    id: `a${idx + 1}`,
    text: '',
    pinyin: '',
    isDistractor: idx === count - 1,
  }));
}

export function parseR02CorrectAnswer(
  correctAnswer: string,
): Array<{ questionId: string; answerId: string }> {
  if (!correctAnswer.includes(':')) return [];

  return correctAnswer
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [questionId, answerId] = pair.split(':');
      return {
        questionId: questionId?.trim() ?? '',
        answerId: answerId?.trim() ?? '',
      };
    });
}

export function buildR02CorrectAnswer(pairings: Record<string, string | ''>): string {
  return Object.entries(pairings)
    .filter(([, answerId]) => answerId)
    .map(([questionId, answerId]) => `${questionId}:${answerId}`)
    .join(',');
}

export function pairingsFromR02CorrectAnswer(correctAnswer: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const pair of parseR02CorrectAnswer(correctAnswer)) {
    if (pair.questionId && pair.answerId) {
      result[pair.questionId] = pair.answerId;
    }
  }
  return result;
}

export function resolveR02QuestionItems(
  questionItems: HskR02QuestionItem[] | undefined,
  correctAnswer: string,
): HskR02QuestionItem[] {
  if (questionItems?.length) return questionItems;
  const parsed = parseR02CorrectAnswer(correctAnswer);
  const count = Math.max(parsed.length, 3);
  return defaultR02Questions(count);
}

export function resolveR02AnswerItems(
  answerItems: HskR02AnswerItem[] | undefined,
  correctAnswer: string,
  questionCount: number,
): HskR02AnswerItem[] {
  if (answerItems?.length) {
    return normalizeR02AnswerItems(answerItems, correctAnswer);
  }
  const parsed = parseR02CorrectAnswer(correctAnswer);
  const answerIds = new Set(parsed.map((p) => p.answerId));
  const count = Math.max(answerIds.size + 1, questionCount + 1, 4);
  const defaults = defaultR02Answers(questionCount).slice(0, count);
  if (parsed.length === 0) return defaults;
  return normalizeR02AnswerItems(defaults, correctAnswer);
}

export function normalizeR02AnswerItems(
  items: HskR02AnswerItem[],
  correctAnswer: string,
): HskR02AnswerItem[] {
  const pairedIds = new Set(parseR02CorrectAnswer(correctAnswer).map((p) => p.answerId));
  return items.map((item, idx) => {
    if (item.isDistractor != null) return item;
    if (pairedIds.size > 0) {
      return { ...item, isDistractor: !pairedIds.has(item.id) };
    }
    return {
      ...item,
      isDistractor: idx === items.length - 1 && items.length > pairedIds.size,
    };
  });
}

export function answerDisplayLabel(answer: HskR02AnswerItem, index: number): string {
  if (/^a\d+$/i.test(answer.id)) {
    return String.fromCharCode(65 + index);
  }
  return answer.id;
}

export function answerPairingOptionLabel(answer: HskR02AnswerItem, index: number): string {
  const label = answerDisplayLabel(answer, index);
  const text = answer.text?.trim();
  return text ? `${label}. ${text}` : `${label}.`;
}
