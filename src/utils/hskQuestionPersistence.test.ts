import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { HskQuestionRow } from '../types/hskExams';
import {
  persistHskQuestion,
  persistHskQuestionWithLocalSync,
} from './hskQuestionPersistence';

function questionWithId(question_uid: string): HskQuestionRow {
  return { question_uid } as HskQuestionRow;
}

test('an unsaved question is created on its first save', async () => {
  const question = questionWithId('');
  let createCalls = 0;
  let updateCalls = 0;

  const saved = await persistHskQuestion(question, {
    create: async () => {
      createCalls += 1;
      return questionWithId('Q-100');
    },
    update: async () => {
      updateCalls += 1;
      return question;
    },
  });

  assert.equal(saved.question_uid, 'Q-100');
  assert.equal(createCalls, 1);
  assert.equal(updateCalls, 0);
});

test('an existing question is updated instead of being created again', async () => {
  const question = questionWithId('Q-001');
  let createCalls = 0;
  let updatedId = '';

  await persistHskQuestion(question, {
    create: async () => {
      createCalls += 1;
      return question;
    },
    update: async (id) => {
      updatedId = id;
      return question;
    },
  });

  assert.equal(createCalls, 0);
  assert.equal(updatedId, 'Q-001');
});

test('a local cache failure does not turn a successful create into a failed save', async () => {
  let createCalls = 0;
  const cacheError = new Error('localStorage quota exceeded');

  const result = await persistHskQuestionWithLocalSync(
    questionWithId(''),
    {
      create: async () => {
        createCalls += 1;
        return questionWithId('Q-101');
      },
      update: async () => {
        throw new Error('update should not be called');
      },
    },
    () => {
      throw cacheError;
    },
  );

  assert.equal(createCalls, 1);
  assert.equal(result.saved.question_uid, 'Q-101');
  assert.equal(result.localSyncError, cacheError);
});
