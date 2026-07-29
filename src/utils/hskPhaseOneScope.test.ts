import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { HskPaperTemplate, HskQuestionRow } from '../types/hskExams';
import {
  isPhaseOneHskLevel,
  isPhaseOneQuestionType,
  isPhaseOneTemplate,
  isQuestionCandidate,
  isTemplateAvailableForPaper,
} from './hskPhaseOneScope';

const template = {
  parentCategory: 'HSK',
  level: 'HSK1',
  category: 'official',
  status: 'published',
} as HskPaperTemplate;

const question = {
  level: 'HSK1',
  type_id: 'L01',
  status: 'published',
  isExample: false,
  payload: {},
} as HskQuestionRow;

test('一期范围只接受 HSK1/2 与固定九种题型', () => {
  assert.equal(isPhaseOneHskLevel('HSK1'), true);
  assert.equal(isPhaseOneHskLevel('HSK3'), false);
  assert.equal(isPhaseOneQuestionType('W02'), true);
  assert.equal(isPhaseOneQuestionType('R10'), false);
});

test('组卷只展示一期内已发布模板', () => {
  assert.equal(isPhaseOneTemplate(template), true);
  assert.equal(isTemplateAvailableForPaper(template), true);
  assert.equal(isTemplateAvailableForPaper({ ...template, status: 'draft' }), false);
  assert.equal(isPhaseOneTemplate({ ...template, parentCategory: 'KLZW' }), false);
});

test('选题同时匹配发布状态、级别、题型、示例和复合属性', () => {
  const input = { question, level: 'HSK1', questionType: 'L01', isExample: false, isCompound: false };
  assert.equal(isQuestionCandidate(input), true);
  assert.equal(isQuestionCandidate({ ...input, level: 'HSK2' }), false);
  assert.equal(isQuestionCandidate({ ...input, question: { ...question, status: 'pending_publish' } }), false);
  assert.equal(isQuestionCandidate({ ...input, isExample: true }), false);
  assert.equal(isQuestionCandidate({ ...input, isCompound: true }), false);
  assert.equal(isQuestionCandidate({
    ...input,
    isCompound: true,
    question: { ...question, payload: { subQuestions: [{ answer: 'A', score: 1 }] } },
  }), true);
  assert.equal(isQuestionCandidate({
    ...input,
    isCompound: true,
    expectedScoringCount: 2,
    question: { ...question, payload: { subQuestions: [{ answer: 'A', score: 1 }] } },
  }), false);
  assert.equal(isQuestionCandidate({
    ...input,
    isCompound: true,
    expectedScoringCount: 1,
    expectedExampleCount: 1,
    question: {
      ...question,
      payload: {
        subQuestions: [
          { answer: 'example', score: 0, isExample: true },
          { answer: 'A', score: 1 },
        ],
      },
    },
  }), true);
});
