import { getTypeCardFieldLabel, getTypeCardMeta } from '../config/hskTypeCardMeta';
import type { HskQuestionTypeDef } from '../types/hskExams';

export type QuestionTypeWithCounts = HskQuestionTypeDef & {
  questionCount: number;
  totalQuestions: number;
};

type Props = {
  qtype: QuestionTypeWithCounts;
};

export function HskQuestionTypeCard({ qtype }: Props) {
  const meta = getTypeCardMeta(qtype.id);

  return (
    <article className="hsk-type-mgmt-card">
      <div className="hsk-type-mgmt-card-head">
        <div className="hsk-type-mgmt-card-title-wrap">
          <span className="hsk-type-mgmt-icon" aria-hidden>{meta.icon}</span>
          <div>
            <h3 className="hsk-type-mgmt-title">{qtype.name}</h3>
            <span className={`hsk-type-mgmt-mode-badge hsk-type-mgmt-mode-badge-${meta.modeTone}`}>
              {meta.modeLabel}
            </span>
          </div>
        </div>
        {!qtype.isPublished && (
          <span className="hsk-type-mgmt-system-badge">未发布</span>
        )}
      </div>

      <p className="hsk-type-mgmt-desc">{qtype.description}</p>

      <div className="hsk-type-mgmt-stats">
        <span>默认分值：{qtype.defaultScore} 分</span>
        <span>选项：{meta.optionSummary}</span>
      </div>

      <div className="hsk-type-mgmt-components">
        {meta.fields.map((field) => {
          const chip = getTypeCardFieldLabel(field);
          return (
            <span key={field} className="hsk-type-mgmt-component">
              <span aria-hidden>{chip.icon}</span>
              {chip.label}
            </span>
          );
        })}
        <span className="hsk-type-mgmt-component hsk-type-mgmt-component-code">{meta.interaction}</span>
      </div>

      <div className="hsk-type-mgmt-actions">
        <span className="hsk-type-mgmt-system-badge">一期固定题型</span>
      </div>
    </article>
  );
}
