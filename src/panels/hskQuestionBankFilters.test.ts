import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { filterHskQuestionRows } from '../utils/hskQuestionBankFilters';
import type { HskQuestionRow, HskQuestionTypeDef } from '../types/hskExams';

const baseQuestion = {
  question_uid: 'Q-001',
  type_id: 'L01',
  level: 'HSK1',
  tags: [],
  stem: '题干',
  options: [],
  correctAnswer: 'A',
  explanation: '',
  score: 2,
  audioStatus: 'none',
  imageStatus: 'none',
  linked_courses: [],
  linked_papers: [],
  linked_videos: [],
  status: 'draft',
  createdAt: '2026-07-12',
  updatedAt: '2026-07-12',
} as HskQuestionRow;

const typeWithoutDifficulty = {
  id: 'L01',
  hskTypeCode: 'L01',
  name: '图片选择',
  section: 'listening',
  description: '后端返回的最小题型',
  defaultScore: 2,
  hskLevels: [1],
  isPublished: true,
  lastModified: '2026-07-12',
} as HskQuestionTypeDef;

test('difficulty filtering does not crash when a backend question type has no difficulty', () => {
  assert.doesNotThrow(() => {
    const rows = filterHskQuestionRows({
      questions: [baseQuestion],
      types: [typeWithoutDifficulty],
      tags: [],
      typeFilter: 'all',
      levelFilter: 'all',
      statusFilter: 'all',
      tagFilter: 'all',
      difficultyFilter: '1',
      searchQuery: '',
    });

    assert.deepEqual(rows, []);
  });
});
