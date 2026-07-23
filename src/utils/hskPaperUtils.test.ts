import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { HSK_QUESTION_TYPE_DEFS } from '../config/hskQuestionTypes';
import type { HskPaperTemplate } from '../types/hskExams';
import {
  buildSlotsFromTemplate,
  normalizeTemplateQuestionCountInput,
  recalcTemplateTotals,
} from './hskPaperUtils';

function templateFixture(): HskPaperTemplate {
  return {
    id: 'AUTO-E2E-TEMPLATE',
    name: 'AUTO-E2E 模板',
    category: 'custom',
    templateKind: 'custom',
    sourceTemplateId: 'HSK1_OFFICIAL',
    level: 'HSK1',
    parentCategory: 'HSK',
    categoryId: null,
    totalQuestions: 0,
    totalDuration: 20,
    totalScore: 0,
    passScore: 4,
    timeBlocks: { prep: 1, listening: 9, buffer: 0, reading: 10, writing: 0 },
    modules: [
      {
        id: 'listening',
        name: '听力',
        totalQuestions: 0,
        sections: [
          {
            id: 'L01-A',
            name: '第一部分',
            questionType: 'L01',
            isCompound: false,
            groups: [{ questionCount: 2, hasExample: false, exampleCount: 0 }],
            totalCount: 0,
            scoringCount: 0,
            scorePerQuestion: 2,
          },
        ],
      },
      {
        id: 'reading',
        name: '阅读',
        totalQuestions: 0,
        sections: [
          {
            id: 'R01-A',
            name: '第一部分',
            questionType: 'R01',
            isCompound: false,
            groups: [{ questionCount: 3, hasExample: true, exampleCount: 1 }],
            totalCount: 0,
            scoringCount: 0,
            scorePerQuestion: 3,
          },
        ],
      },
      { id: 'writing', name: '书写', totalQuestions: 0, sections: [] },
    ],
    status: 'draft',
    audioRules: { autoPlayOnEnter: true, allowPause: false, maxPlayCount: 1 },
    updatedAt: '2026-07-15',
  };
}

test('template total score is derived from section quantities and scores', () => {
  const recalculated = recalcTemplateTotals(templateFixture(), HSK_QUESTION_TYPE_DEFS);
  assert.equal(recalculated.totalQuestions, 5);
  assert.equal(recalculated.totalScore, 13);
  assert.equal(recalculated.audioRules?.maxPlayCount, 2);
});

test('custom template sections can be reduced to zero questions', () => {
  assert.equal(normalizeTemplateQuestionCountInput('0'), 0);
  assert.equal(normalizeTemplateQuestionCountInput(''), 0);
  assert.equal(normalizeTemplateQuestionCountInput('-2'), 0);

  const fixture = templateFixture();
  fixture.modules[0].sections[0].groups[0].questionCount = 0;

  const recalculated = recalcTemplateTotals(fixture, HSK_QUESTION_TYPE_DEFS);

  assert.equal(recalculated.modules[0].sections[0].totalCount, 0);
  assert.equal(recalculated.modules[0].sections[0].scoringCount, 0);
  assert.equal(recalculated.totalQuestions, 3);
  assert.equal(recalculated.totalScore, 9);
});

test('paper slots freeze each section score and keep examples unnumbered', () => {
  const template = recalcTemplateTotals(templateFixture(), HSK_QUESTION_TYPE_DEFS);
  const slots = buildSlotsFromTemplate(template, HSK_QUESTION_TYPE_DEFS);
  assert.deepEqual(slots.map((slot) => slot.scorePerQuestion), [2, 2, 3, 3, 3, 3]);
  assert.equal(slots[2]?.isExample, true);
  assert.equal(slots[2]?.questionNumber, null);
  assert.deepEqual(slots.filter((slot) => !slot.isExample).map((slot) => slot.questionNumber), [1, 2, 3, 4, 5]);
});
