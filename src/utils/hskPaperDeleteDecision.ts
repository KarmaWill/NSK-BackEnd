import type { HskPublishStatus } from '../types/hskExams';

export type PaperDeleteDecisionInput = {
  paperStatus: HskPublishStatus;
  localLinkedExamCount: number;
};

export type PaperDeleteDecision = {
  shouldCallApi: boolean;
  blockReason: string | null;
};

export function decidePaperDelete(input: PaperDeleteDecisionInput): PaperDeleteDecision {
  if (input.paperStatus === 'published') {
    return {
      shouldCallApi: false,
      blockReason: '已发布试卷不可删除，请先取消发布',
    };
  }
  return {
    shouldCallApi: true,
    blockReason: null,
  };
}
