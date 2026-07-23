import type { HskQuestionRow } from '../types/hskExams';

type QuestionPersistenceApi = {
  create: (question: HskQuestionRow) => Promise<HskQuestionRow>;
  update: (id: string, question: HskQuestionRow) => Promise<HskQuestionRow>;
};

export type QuestionPersistenceResult = {
  saved: HskQuestionRow;
  localSyncError?: unknown;
};

export function persistHskQuestion(
  question: HskQuestionRow,
  api: QuestionPersistenceApi,
): Promise<HskQuestionRow> {
  const id = question.question_uid.trim();
  return id ? api.update(id, question) : api.create(question);
}

export async function persistHskQuestionWithLocalSync(
  question: HskQuestionRow,
  api: QuestionPersistenceApi,
  syncLocal: (saved: HskQuestionRow) => void,
): Promise<QuestionPersistenceResult> {
  const saved = await persistHskQuestion(question, api);
  try {
    syncLocal(saved);
    return { saved };
  } catch (localSyncError) {
    return { saved, localSyncError };
  }
}
