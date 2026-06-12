import { getQuestionStatusClass, getQuestionStatusLabel } from '../config/hskQuestionWorkflow';
import type { HskQuestionStatus } from '../types/hskExams';

const WORKFLOW_STEPS: { key: HskQuestionStatus; label: string }[] = [
  { key: 'draft', label: '草稿' },
  { key: 'pending_review', label: '待审核' },
  { key: 'pending_publish', label: '待发布' },
  { key: 'published', label: '已发布' },
];

const WORKFLOW_ORDER: HskQuestionStatus[] = [
  'draft',
  'pending_review',
  'pending_publish',
  'published',
];

export function HskQuestionWorkflowProgress({ status }: { status: HskQuestionStatus }) {
  const currentIdx = WORKFLOW_ORDER.indexOf(status);

  return (
    <div className="hsk-question-edit-workflow-topbar">
      <span className={`hsk-question-list-status ${getQuestionStatusClass(status)}`}>
        {getQuestionStatusLabel(status)}
      </span>
      <div className="hsk-question-edit-workflow-steps" aria-label="题目发布流程">
        {WORKFLOW_STEPS.map((step, idx) => (
          <span key={step.key} className="hsk-question-edit-workflow-step-wrap">
            {idx > 0 && <span className="hsk-question-edit-workflow-arrow" aria-hidden>→</span>}
            <span
              className={`hsk-question-edit-workflow-step${idx <= currentIdx ? ' is-reached' : ''}${
                idx === currentIdx ? ' is-current' : ''
              }`}
            >
              {step.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
