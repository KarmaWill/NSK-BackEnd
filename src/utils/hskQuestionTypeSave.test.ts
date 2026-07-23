import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { HskQuestionTypeDef } from '../types/hskExams';
import { submitQuestionTypeSave } from './hskQuestionTypeSave';

const typeDef = {
  id: 'R10',
  hskTypeCode: 'R10',
  name: '回归题型',
  section: 'reading',
  description: '',
  defaultScore: 2,
  hskLevels: [1],
  difficulty: '',
  isPublished: false,
  lastModified: '2026-07-13',
  answerMode: 'single_choice',
  defaultOptionCount: 4,
} as unknown as HskQuestionTypeDef;

test('submitQuestionTypeSave only reports success after the save callback resolves', async () => {
  const result = await submitQuestionTypeSave(async () => undefined, typeDef);

  assert.deepEqual(result, { ok: true });
});

test('submitQuestionTypeSave preserves a backend failure as a field-level message', async () => {
  const result = await submitQuestionTypeSave(async () => {
    throw new Error('题型 ID 已存在');
  }, typeDef);

  assert.deepEqual(result, { ok: false, message: '题型 ID 已存在' });
});
