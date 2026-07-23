import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { HskComposedPaper, HskPaperSlot, HskQuestionRow } from '../types/hskExams';
import { compilePaperQuestions } from './hskCompileDelivery';

function slot(patch: Partial<HskPaperSlot>): HskPaperSlot {
  return {
    moduleId: 'reading',
    moduleName: '阅读',
    sectionId: 'R01-1',
    sectionName: '第一部分',
    questionType: 'R01',
    isCompound: false,
    groupIndex: 0,
    slotIndex: 0,
    isExample: false,
    globalIndex: 0,
    questionNumber: 1,
    questionId: 'Q-1',
    scorePerQuestion: 5,
    ...patch,
  };
}

function question(patch: Partial<HskQuestionRow>): HskQuestionRow {
  return {
    question_uid: 'Q-1',
    type_id: 'R01',
    level: 'HSK1',
    tags: [],
    stem: '题干',
    options: [],
    correctAnswer: 'A',
    explanation: '解析',
    score: 5,
    audioStatus: 'none',
    imageStatus: 'none',
    linked_courses: [],
    linked_papers: [],
    linked_videos: [],
    status: 'published',
    createdAt: '2026-07-15T00:00:00Z',
    updatedAt: '2026-07-15T00:00:00Z',
    ...patch,
  };
}

test('公开编译包保留示例但移除答案', () => {
  const slots = [
    slot({ questionId: 'Q-E', isExample: true, globalIndex: 0, questionNumber: null }),
    slot({ questionId: 'Q-1', globalIndex: 1, slotIndex: 1 }),
  ];
  const paper = { slots } as HskComposedPaper;
  const runtime = compilePaperQuestions(paper, [
    question({ question_uid: 'Q-E', isExample: true, correctAnswer: 'B' }),
    question({ question_uid: 'Q-1' }),
  ]);

  assert.equal(runtime.length, 2);
  assert.equal(runtime[0].isExample, true);
  assert.equal(runtime[0].questionNumber, null);
  assert.equal(runtime[0].score, 0);
  assert.equal('answer' in runtime[0], false);
  assert.equal('answer' in runtime[1], false);
});

test('一个复合题记录编译整个分组并移除子题答案', () => {
  const slots = [
    slot({ questionType: 'R03', questionId: 'Q-C', isCompound: true, globalIndex: 0 }),
    slot({ questionType: 'R03', questionId: 'Q-C', isCompound: true, globalIndex: 1, slotIndex: 1, questionNumber: 2 }),
  ];
  const paper = { slots } as HskComposedPaper;
  const runtime = compilePaperQuestions(paper, [question({
    question_uid: 'Q-C',
    type_id: 'R03',
    payload: {
      subQuestions: [
        { id: 1, answer: 'A', score: 5 },
        { id: 2, answer: 'B', score: 5 },
      ],
    },
  })]);

  assert.equal(runtime.length, 1);
  assert.equal(runtime[0].questions?.length, 2);
  assert.equal(runtime[0].score, 10);
  assert.equal('answer' in (runtime[0].questions?.[0] ?? {}), false);
});
