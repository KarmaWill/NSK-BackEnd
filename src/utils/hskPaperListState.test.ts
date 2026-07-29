import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { HskComposedPaper } from '../types/hskExams';
import { removePaperFromList, upsertPaperInList } from './hskPaperListState';

function paper(id: string, status: HskComposedPaper['status']): HskComposedPaper {
  return {
    id,
    templateId: 'official-hsk1',
    scoringMode: 'equal_ratio',
    name: id,
    level: 'HSK1',
    slots: [],
    totalScore: 200,
    totalQuestions: 40,
    duration: 40,
    status,
    linkedCourses: 0,
    updatedAt: '2026-07-22T00:00:00Z',
  };
}

test('upsert replaces a paper without reordering or duplicating the list', () => {
  const first = paper('PAP-001', 'draft');
  const second = paper('PAP-002', 'draft');
  const published = paper('PAP-002', 'published');

  const result = upsertPaperInList([first, second], published);

  assert.deepEqual(result.map((item) => item.id), ['PAP-001', 'PAP-002']);
  assert.equal(result[1].status, 'published');
});

test('upsert prepends a newly created paper', () => {
  const result = upsertPaperInList([paper('PAP-001', 'draft')], paper('PAP-002', 'draft'));

  assert.deepEqual(result.map((item) => item.id), ['PAP-002', 'PAP-001']);
});

test('remove deletes only the requested paper', () => {
  const result = removePaperFromList(
    [paper('PAP-001', 'draft'), paper('PAP-002', 'draft')],
    'PAP-001',
  );

  assert.deepEqual(result.map((item) => item.id), ['PAP-002']);
});
