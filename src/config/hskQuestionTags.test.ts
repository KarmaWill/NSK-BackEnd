import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { ensureQuestionTags } from './hskQuestionTags';

test('ensureQuestionTags preserves an explicit empty backend result', () => {
  assert.deepEqual(ensureQuestionTags([]), []);
});

test('ensureQuestionTags keeps only backend tags and removes duplicate ids', () => {
  assert.deepEqual(
    ensureQuestionTags([
      { id: 'custom-1', label: '客户标签' },
      { id: 'custom-1', label: '重复标签' },
    ]),
    [{ id: 'custom-1', label: '客户标签' }],
  );
});
