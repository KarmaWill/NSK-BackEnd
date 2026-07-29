import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { HSK_QUESTION_TYPE_DEFS } from '../config/hskQuestionTypes';
import type { HskPaperTemplate } from '../types/hskExams';
import {
  buildSlotsFromTemplate,
  normalizeTemplateQuestionCountInput,
  recalcTemplateTotals,
  redistributeSectionQuestionCount,
} from './hskPaperUtils';

function templateFixture(): HskPaperTemplate {
  return {
    id: 'AUTO-E2E-TEMPLATE',
    name: 'AUTO-E2E 模板',
    category: 'custom',
    templateKind: 'custom',
    scoringMode: 'per_item',
    passScoreAuto: false,
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

test('automatic custom passing score tracks sixty percent of the derived total', () => {
  const fixture = templateFixture();
  fixture.passScoreAuto = true;
  const recalculated = recalcTemplateTotals(fixture, HSK_QUESTION_TYPE_DEFS);

  assert.equal(recalculated.totalScore, 13);
  assert.equal(recalculated.passScore, 8);
});

test('official template keeps configured total and clears per-item scores', () => {
  const fixture = templateFixture();
  fixture.templateKind = 'official';
  fixture.category = 'official';
  fixture.scoringMode = 'equal_ratio';
  fixture.totalScore = 200;
  const recalculated = recalcTemplateTotals(fixture, HSK_QUESTION_TYPE_DEFS);

  assert.equal(recalculated.totalQuestions, 5);
  assert.equal(recalculated.totalScore, 200);
  assert.ok(recalculated.modules
    .flatMap((module) => module.sections)
    .every((section) => section.scorePerQuestion === 0));
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

test('section quantity excludes examples and redistributes scoring questions across groups', () => {
  const groups = [
    { questionCount: 5, hasExample: true, exampleCount: 1 },
    { questionCount: 5, hasExample: false, exampleCount: 0 },
  ];

  assert.deepEqual(redistributeSectionQuestionCount(groups, 0), [
    { questionCount: 0, hasExample: true, exampleCount: 1 },
    { questionCount: 0, hasExample: false, exampleCount: 0 },
  ]);
  assert.deepEqual(redistributeSectionQuestionCount(groups, 3).map((group) => group.questionCount), [3, 0]);
  assert.deepEqual(redistributeSectionQuestionCount(groups, 7).map((group) => group.questionCount), [5, 2]);
  assert.deepEqual(redistributeSectionQuestionCount(groups, 12).map((group) => group.questionCount), [5, 7]);
  assert.equal(redistributeSectionQuestionCount(groups, 3)[0].exampleCount, 1);

  const reduced = redistributeSectionQuestionCount(groups, 3, groups);
  assert.deepEqual(redistributeSectionQuestionCount(reduced, 7, groups).map((group) => group.questionCount), [5, 2]);
  const cleared = redistributeSectionQuestionCount(groups, 0, groups);
  assert.deepEqual(redistributeSectionQuestionCount(cleared, 7, groups).map((group) => group.questionCount), [5, 2]);
});

test('paper slots freeze each section score and keep examples unnumbered', () => {
  const template = recalcTemplateTotals(templateFixture(), HSK_QUESTION_TYPE_DEFS);
  const slots = buildSlotsFromTemplate(template, HSK_QUESTION_TYPE_DEFS);
  assert.deepEqual(slots.map((slot) => slot.scorePerQuestion), [2, 2, 3, 3, 3, 3]);
  assert.equal(slots[2]?.isExample, true);
  assert.equal(slots[2]?.questionNumber, null);
  assert.deepEqual(slots.filter((slot) => !slot.isExample).map((slot) => slot.questionNumber), [1, 2, 3, 4, 5]);
});
