import type { HskQuestionRow } from '../types/hskExams';

export type HskW04Content = {
  topic?: string;
  keyword?: string;
  minWords?: number;
  /** 学员端展示：写作主题 */
  prompt?: string;
  /** 学员端展示：如「关键词：周末、朋友」 */
  instruction?: string;
};

export function buildW04Instruction(keyword: string): string {
  const trimmed = keyword.trim();
  return trimmed ? `关键词：${trimmed}` : '';
}

export function resolveW04Content(question: HskQuestionRow): Required<
  Pick<HskW04Content, 'topic' | 'keyword' | 'prompt' | 'instruction'>
> & {
  minWords: number;
} {
  const content = (question.payload?.content ?? {}) as HskW04Content;
  const topic = content.topic?.trim() ?? content.prompt?.trim() ?? '';
  const keyword = content.keyword?.trim() ?? '';
  const minWords = content.minWords && content.minWords > 0 ? content.minWords : 50;

  return {
    topic,
    keyword,
    minWords,
    prompt: topic,
    instruction: buildW04Instruction(keyword),
  };
}

export function normalizeW04Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'W04') return question;

  const resolved = resolveW04Content(question);
  const content = (question.payload?.content ?? {}) as HskW04Content;

  return {
    ...question,
    payload: {
      ...question.payload,
      content: {
        ...content,
        topic: resolved.topic,
        keyword: resolved.keyword,
        minWords: resolved.minWords,
        prompt: resolved.prompt,
        instruction: resolved.instruction,
      },
    },
  };
}

export function buildW04PayloadPatch(
  question: HskQuestionRow,
  patch: Partial<Pick<HskW04Content, 'topic' | 'keyword' | 'minWords'>>,
): HskQuestionRow['payload'] {
  const current = resolveW04Content(question);
  const topic = patch.topic !== undefined ? patch.topic.trim() : current.topic;
  const keyword = patch.keyword !== undefined ? patch.keyword.trim() : current.keyword;
  const minWords =
    patch.minWords !== undefined && patch.minWords > 0 ? patch.minWords : current.minWords;

  return {
    ...question.payload,
    content: {
      ...(question.payload?.content ?? {}),
      topic,
      keyword,
      minWords,
      prompt: topic,
      instruction: buildW04Instruction(keyword),
    },
  };
}

export function formatW04MinWordsHint(minWords: number): string {
  return `请输入作文（不少于${minWords}字）`;
}
