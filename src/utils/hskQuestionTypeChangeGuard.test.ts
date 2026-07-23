import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { HskQuestionRow } from '../types/hskExams';
import {
  isQuestionDraftDirty,
  shouldConfirmQuestionTypeChange,
} from './hskQuestionTypeChangeGuard';

const cleanDraft = {
  question_uid: 'Q-TYPE-GUARD',
  type_id: 'L01',
  stem: '原始题干',
  updatedAt: '2026-07-13T00:00:00.000Z',
} as HskQuestionRow;

test('updatedAt alone does not make a question draft dirty', () => {
  const draft = { ...cleanDraft, updatedAt: '2026-07-13T01:00:00.000Z' };

  assert.equal(isQuestionDraftDirty(draft, cleanDraft), false);
});

test('a changed draft requires confirmation before switching to another type', () => {
  const draft = { ...cleanDraft, stem: '已修改但未保存的题干' };

  assert.equal(isQuestionDraftDirty(draft, cleanDraft), true);
  assert.equal(shouldConfirmQuestionTypeChange('L01', 'R01', true), true);
  assert.equal(shouldConfirmQuestionTypeChange('L01', 'L01', true), false);
  assert.equal(shouldConfirmQuestionTypeChange('L01', 'R01', false), false);
});
