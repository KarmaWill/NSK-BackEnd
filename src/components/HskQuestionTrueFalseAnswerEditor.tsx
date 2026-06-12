type Props = {
  correctAnswer: string;
  onChange: (answer: string) => void;
};

export function HskQuestionTrueFalseAnswerEditor({ correctAnswer, onChange }: Props) {
  return (
    <div className="hsk-question-tf-answer-section">
      <label className="hsk-question-tf-answer-label">
        正确答案 <span className="required">*</span>
      </label>
      <div className="hsk-question-tf-answer-options">
        <button
          type="button"
          className={`hsk-question-tf-answer-btn is-true${correctAnswer === 'A' ? ' is-active' : ''}`}
          onClick={() => onChange('A')}
        >
          ✓ 对
        </button>
        <button
          type="button"
          className={`hsk-question-tf-answer-btn is-false${correctAnswer === 'B' ? ' is-active' : ''}`}
          onClick={() => onChange('B')}
        >
          ✗ 错
        </button>
      </div>
    </div>
  );
}
