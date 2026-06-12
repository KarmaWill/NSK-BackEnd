type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function HskQuestionDifficultySelect({ value, onChange }: Props) {
  return (
    <div className="hsk-question-difficulty">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`hsk-question-difficulty-star${star <= value ? ' is-active' : ''}`}
          onClick={() => onChange(star)}
          aria-label={`难度 ${star} 星`}
        >
          ★
        </button>
      ))}
      <span className="hsk-question-difficulty-label">{value > 0 ? `${value}/5` : '未设置'}</span>
    </div>
  );
}
