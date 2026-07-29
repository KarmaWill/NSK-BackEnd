import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveSnapshotArray } from './hskStoreSnapshot';

test('resolveSnapshotArray preserves an explicit empty server result', () => {
  assert.deepEqual(resolveSnapshotArray([], ['demo']), []);
});

test('resolveSnapshotArray only uses fallback when the field is absent', () => {
  assert.deepEqual(resolveSnapshotArray(undefined, ['demo']), ['demo']);
});
