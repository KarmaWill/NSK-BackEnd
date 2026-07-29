import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { decidePaperDelete } from './hskPaperDeleteDecision';

test('draft paper deletion is attempted against backend even when local demo exams share the same id', () => {
  const decision = decidePaperDelete({
    paperStatus: 'draft',
    localLinkedExamCount: 1,
  });

  assert.equal(decision.shouldCallApi, true);
  assert.equal(decision.blockReason, null);
});
