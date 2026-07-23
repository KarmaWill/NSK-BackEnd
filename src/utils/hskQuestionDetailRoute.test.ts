import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { HskQuestionRow } from '../types/hskExams';
import { createQuestionDetailRoute } from './hskQuestionDetailRoute';

const question = {
  question_uid: 'Q-PREVIEW',
  type_id: 'L01',
  stem: '预览题干',
} as HskQuestionRow;

test('preview and edit actions create distinct question detail modes', () => {
  const preview = createQuestionDetailRoute('preview', question);
  const edit = createQuestionDetailRoute('edit', question);

  assert.equal(preview.mode, 'preview');
  assert.equal(edit.mode, 'edit');
  assert.equal(preview.question, question);
  assert.equal(edit.question, question);
});
