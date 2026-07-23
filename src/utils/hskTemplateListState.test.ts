import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { HskPaperTemplate } from '../types/hskExams';
import { reconcileTemplateList, removePendingTemplate } from './hskTemplateListState';

function template(id: string, name: string): HskPaperTemplate {
  return {
    id,
    name,
    category: 'custom',
    parentCategory: 'HSK',
    categoryId: null,
    level: 'HSK1',
    templateKind: 'custom',
    scoringMode: 'per_item',
    status: 'draft',
    totalQuestions: 40,
    totalScore: 40,
    passScore: 24,
    passScoreAuto: true,
    totalDuration: 40,
    timeBlocks: {
      prep: 5,
      listening: 12,
      buffer: 3,
      reading: 20,
      writing: 0,
    },
    modules: [],
    updatedAt: '2026-07-24T00:00:00Z',
  };
}

test('列表副本尚未同步新模板时保留本地创建结果', () => {
  const pending = template('custom-1', '刚创建的模板');
  const result = reconcileTemplateList(
    [template('official-hsk1', '官方模板')],
    [pending],
  );

  assert.deepEqual(result.templates.map((item) => item.id), ['official-hsk1', 'custom-1']);
  assert.deepEqual(result.pendingTemplates.map((item) => item.id), ['custom-1']);
});

test('列表已包含新模板时以服务端结果为准并清除待确认状态', () => {
  const pending = template('custom-1', '本地名称');
  const server = template('custom-1', '服务端名称');
  const result = reconcileTemplateList([server], [pending]);

  assert.equal(result.templates[0].name, '服务端名称');
  assert.deepEqual(result.pendingTemplates, []);
});

test('刚复制的模板被删除后不会被等待同步的本地副本恢复', () => {
  const copied = template('custom-1', '刚复制的模板');
  const pendingAfterDelete = removePendingTemplate([copied], copied.id);
  const result = reconcileTemplateList(
    [template('official-hsk1', '官方模板')],
    pendingAfterDelete,
  );

  assert.deepEqual(result.templates.map((item) => item.id), ['official-hsk1']);
  assert.deepEqual(result.pendingTemplates, []);
});
