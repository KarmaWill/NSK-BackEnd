import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { getTypeCardMeta } from './hskTypeCardMeta';
import type { HskQuestionTypeCode } from '../types/hskExams';

test('getTypeCardMeta returns stable fallback metadata for a custom question type', () => {
  const meta = getTypeCardMeta('R10' as HskQuestionTypeCode);

  assert.deepEqual(meta, {
    icon: '◇',
    modeLabel: '自定义题型',
    modeTone: 'default',
    interaction: 'custom',
    optionSummary: '—',
    fields: [],
  });
});
