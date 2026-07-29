import type { HskQuestionRow, HskQuestionTypeCode } from '../types/hskExams';

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

export function isQuestionDraftDirty(
  draft: HskQuestionRow,
  baseline: HskQuestionRow,
): boolean {
  const { updatedAt: _draftUpdatedAt, ...draftContent } = draft;
  const { updatedAt: _baselineUpdatedAt, ...baselineContent } = baseline;

  return stableSerialize(draftContent) !== stableSerialize(baselineContent);
}

export function shouldConfirmQuestionTypeChange(
  currentTypeId: HskQuestionTypeCode,
  nextTypeId: HskQuestionTypeCode,
  isDirty: boolean,
): boolean {
  return currentTypeId !== nextTypeId && isDirty;
}
