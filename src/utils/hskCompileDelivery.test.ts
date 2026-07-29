import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type {
  HskComposedPaper,
  HskExamInstance,
  HskPaperSlot,
  HskPaperTemplate,
  HskQuestionRow,
} from '../types/hskExams';
import { compileExamDelivery, compilePaperQuestions } from './hskCompileDelivery';

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
  const paper = { slots, scoringMode: 'per_item' } as HskComposedPaper;
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
  const paper = { slots, scoringMode: 'per_item' } as HskComposedPaper;
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

test('官方比例计分不会从题目回退旧单题分值', () => {
  const slots = [slot({ scorePerQuestion: 0 })];
  const paper = { slots, scoringMode: 'equal_ratio' } as HskComposedPaper;
  const runtime = compilePaperQuestions(paper, [question({ score: 5 })]);

  assert.equal(runtime[0].score, 0);
});

test('官方比例计分不会保留复合子题的旧分值', () => {
  const slots = [
    slot({
      questionType: 'R03',
      questionId: 'Q-C',
      isCompound: true,
      globalIndex: 0,
      scorePerQuestion: 0,
    }),
    slot({
      questionType: 'R03',
      questionId: 'Q-C',
      isCompound: true,
      globalIndex: 1,
      slotIndex: 1,
      questionNumber: 2,
      scorePerQuestion: 0,
    }),
  ];
  const paper = { slots, scoringMode: 'equal_ratio' } as HskComposedPaper;
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

  assert.equal(runtime[0].score, 0);
  assert.deepEqual(runtime[0].questions?.map((item) => item.score), [0, 0]);
});

test('考试合格分为 0 时不会回退模板默认值', () => {
  const paper = {
    id: 'paper-1',
    templateId: 'template-1',
    name: '零合格分试卷',
    level: 'HSK1',
    slots: [slot({ scorePerQuestion: 0 })],
    totalScore: 200,
    scoringMode: 'equal_ratio',
    totalQuestions: 1,
    passScore: 0,
    duration: 40,
    status: 'published',
    linkedCourses: 0,
    updatedAt: '2026-07-24T00:00:00Z',
  } satisfies HskComposedPaper;
  const template = {
    id: 'template-1',
    name: '模板',
    category: 'official',
    level: 'HSK1',
    parentCategory: 'HSK',
    categoryId: null,
    totalQuestions: 1,
    totalDuration: 40,
    totalScore: 200,
    passScore: 120,
    scoringMode: 'equal_ratio',
    timeBlocks: {
      prep: 0,
      listening: 0,
      buffer: 0,
      reading: 40,
      writing: 0,
    },
    modules: [],
    status: 'published',
    updatedAt: '2026-07-24T00:00:00Z',
  } satisfies HskPaperTemplate;
  const exam = {
    id: 'exam-1',
    name: '零合格分考试',
    paperId: paper.id,
    templateId: template.id,
    level: 'HSK1',
    examType: 'mock',
    duration: 40,
    totalScore: 200,
    passScore: 0,
    status: 'published',
    scheduledAt: null,
    updatedAt: '2026-07-24T00:00:00Z',
  } satisfies HskExamInstance;

  const delivery = compileExamDelivery(exam, paper, template, [question({ score: 5 })]);

  assert.equal(delivery.passScore, 0);
});
