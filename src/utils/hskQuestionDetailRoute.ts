import type { HskQuestionRow } from '../types/hskExams';

export type HskQuestionDetailMode = 'edit' | 'preview';

export type HskQuestionDetailRoute = {
  mode: HskQuestionDetailMode;
  question: HskQuestionRow;
};

export function createQuestionDetailRoute(
  mode: HskQuestionDetailMode,
  question: HskQuestionRow,
): HskQuestionDetailRoute {
  return { mode, question };
}
