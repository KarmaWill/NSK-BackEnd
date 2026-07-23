import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  canDeleteQuestion,
  canEditQuestion,
  canWithdrawQuestion,
  nextQuestionStatus,
} from './hskQuestionWorkflow';

test('only draft questions are editable and deletable', () => {
  assert.equal(canEditQuestion('draft'), true);
  assert.equal(canDeleteQuestion('draft'), true);
  for (const status of ['pending_review', 'pending_publish', 'published'] as const) {
    assert.equal(canEditQuestion(status), false);
    assert.equal(canDeleteQuestion(status), false);
    assert.equal(canWithdrawQuestion(status), true);
  }
});

test('question workflow advances one stage at a time', () => {
  assert.equal(nextQuestionStatus('draft'), 'pending_review');
  assert.equal(nextQuestionStatus('pending_review'), 'pending_publish');
  assert.equal(nextQuestionStatus('pending_publish'), 'published');
  assert.equal(nextQuestionStatus('published'), null);
});
