import { JUDGMENT_TF_OPTIONS } from '../utils/hskJudgmentQuestions';

type Props = {
  correctAnswer: string;
  onCorrectAnswerChange: (value: string) => void;
};

export function HskQuestionJudgmentEditor({
  correctAnswer,
  onCorrectAnswerChange,
}: Props) {
  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>✓</span>
          <h3>判断选项</h3>
        </div>
      </div>

      <div className="hsk-question-judgment-body">
        <div className="hsk-question-judgment-answer-section">
          <label className="hsk-question-judgment-answer-label">
            正确答案 <span className="required">*</span>
          </label>
          <div className="hsk-question-judgment-answer-options">
            {JUDGMENT_TF_OPTIONS.map((opt) => {
              const isTrue = opt.key === 'A';
              const active = correctAnswer === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`hsk-question-judgment-answer-btn${isTrue ? ' is-true' : ' is-false'}${active ? ' is-active' : ''}`}
                  onClick={() => onCorrectAnswerChange(opt.key)}
                >
                  <span className="hsk-question-judgment-answer-main">
                    {isTrue ? '✓ 对' : '✗ 错'}
                  </span>
                  <span className="hsk-question-judgment-answer-key">({isTrue ? '✓' : '✗'})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
