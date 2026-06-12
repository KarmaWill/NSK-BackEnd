import type { HskLevelCode, HskQuestionStatus } from '../types/hskExams';
import { HSK_QUESTION_LEVELS } from '../types/hskExams';

export { HSK_QUESTION_LEVELS };

export const HSK_QUESTION_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'pending_publish', label: '待发布' },
  { value: 'pending_review', label: '待审核' },
  { value: 'draft', label: '草稿' },
] as const;

export function getQuestionStatusLabel(status: HskQuestionStatus): string {
  switch (status) {
    case 'published':
      return '已发布';
    case 'pending_publish':
      return '待发布';
    case 'pending_review':
      return '待审核';
    default:
      return '草稿';
  }
}

export function getQuestionStatusClass(status: HskQuestionStatus): string {
  switch (status) {
    case 'published':
      return 'is-published';
    case 'pending_publish':
      return 'is-pending-publish';
    case 'pending_review':
      return 'is-pending-review';
    default:
      return 'is-draft';
  }
}

export function normalizeQuestionStatus(status: string | undefined): HskQuestionStatus {
  if (
    status === 'published' ||
    status === 'pending_publish' ||
    status === 'pending_review' ||
    status === 'draft'
  ) {
    return status;
  }
  return 'draft';
}

export function normalizeQuestionLevel(level: string | undefined): HskLevelCode {
  if (level === 'HSK7' || level === 'HSK8' || level === 'HSK9') return 'HSK7-9';
  if (
    level === 'HSK1' ||
    level === 'HSK2' ||
    level === 'HSK3' ||
    level === 'HSK4' ||
    level === 'HSK5' ||
    level === 'HSK6' ||
    level === 'HSK7-9' ||
    level === 'custom'
  ) {
    return level;
  }
  return 'HSK1';
}
