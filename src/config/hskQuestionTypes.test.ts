import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import {
  HSK_QUESTION_TYPE_DEFS,
  buildDefaultQuestionOptions,
  ensureQuestionTypes,
} from './hskQuestionTypes';
import type { HskQuestionTypeDef } from '../types/hskExams';

function typeDef(id: string, name: string): HskQuestionTypeDef {
  return {
    id,
    hskTypeCode: id,
    name,
    section: 'reading',
    description: `${name}描述`,
    defaultScore: 2,
    hskLevels: [1, 2],
    difficulty: '',
    isPublished: true,
    lastModified: '2026-07-12',
    answerMode: 'single_choice',
    defaultOptionCount: 4,
  } as HskQuestionTypeDef;
}

test('the phase-one catalog contains exactly the nine confirmed question types', () => {
  assert.deepEqual(
    HSK_QUESTION_TYPE_DEFS.map((type) => type.id),
    ['L01', 'L02', 'L03', 'R01', 'R02', 'R03', 'R07', 'W01', 'W02'],
  );
});

test('buildDefaultQuestionOptions follows the fixed type option count', () => {
  assert.deepEqual(buildDefaultQuestionOptions(3), [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
  ]);
  assert.equal(buildDefaultQuestionOptions(4).length, 4);
  assert.equal(buildDefaultQuestionOptions(undefined).length, 2);
});

test('ensureQuestionTypes keeps backend values but rejects out-of-scope types', () => {
  const normalized = ensureQuestionTypes([
    typeDef('L01', '后端图片选择'),
    typeDef('R10', 'AUTO-Q02-题型'),
  ]);

  assert.deepEqual(normalized.map((type) => type.id), ['L01']);
  assert.equal(normalized[0]?.name, '后端图片选择');
});
