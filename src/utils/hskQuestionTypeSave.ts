import type { HskQuestionTypeDef } from '../types/hskExams';

export type QuestionTypeSaveResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitQuestionTypeSave(
  onSave: (next: HskQuestionTypeDef) => Promise<void>,
  next: HskQuestionTypeDef,
): Promise<QuestionTypeSaveResult> {
  try {
    await onSave(next);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error && error.message ? error.message : '题型保存失败',
    };
  }
}
