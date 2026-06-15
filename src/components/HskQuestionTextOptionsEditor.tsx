import type { HskQuestionTypeCode, HskRuntimeOption } from '../types/hskExams';
import { PinyinInlineField } from './PinyinCountInput';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

type Props = {
  options: HskRuntimeOption[];
  correctAnswer: string;
  typeId: HskQuestionTypeCode;
  levelNumber: number;
  showPinyinFields?: boolean;
  onChange: (next: HskRuntimeOption[]) => void;
  onCorrectAnswerChange: (answer: string) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((o) => o.key));
  return OPTION_KEYS.find((k) => !used.has(k)) ?? 'K';
}

function relabelOptions(options: HskRuntimeOption[]): HskRuntimeOption[] {
  return options.map((opt, idx) => ({
    ...opt,
    key: String.fromCharCode(65 + idx),
  }));
}

export function defaultTextOptionsForType(typeId: HskQuestionTypeCode): HskRuntimeOption[] {
  const count = typeId === 'L04' ? 4 : typeId === 'L03' ? 3 : 2;
  return Array.from({ length: count }, (_, idx) => ({
    key: String.fromCharCode(65 + idx),
    text: '',
    pinyin: '',
  }));
}

export function HskQuestionTextOptionsEditor({
  options,
  correctAnswer,
  typeId,
  levelNumber,
  showPinyinFields = false,
  onChange,
  onCorrectAnswerChange,
}: Props) {
  const isListeningChoice = typeId === 'L03' || typeId === 'L04';
  const maxOptions = isListeningChoice ? 10 : 4;
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const canAdd = options.length < maxOptions;
  const canRemove = options.length > 2;

  const addOption = () => {
    if (!canAdd) return;
    onChange([...options, { key: nextOptionKey(options), text: '', pinyin: '' }]);
  };

  const updateOption = (index: number, patch: Partial<HskRuntimeOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeOption = (index: number) => {
    if (!canRemove) return;
    const removed = options[index];
    const next = relabelOptions(options.filter((_, i) => i !== index));
    onChange(next);
    if (correctAnswer === removed.key) {
      onCorrectAnswerChange('');
    }
  };

  const toggleCorrect = (key: string) => {
    onCorrectAnswerChange(correctAnswer === key ? '' : key);
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>☑</span>
          <h3>文字选项（{options.length}个）</h3>
        </div>
        {isListeningChoice && (
          <button
            type="button"
            className="hsk-question-edit-sub-add-btn"
            onClick={addOption}
            disabled={!canAdd}
          >
            + 添加选项
          </button>
        )}
      </div>

      <div className="hsk-question-edit-text-options">
        {options.map((opt, idx) => {
          const isCorrect = correctAnswer === opt.key;
          return (
            <div key={`${opt.key}-${idx}`} className="hsk-question-edit-text-option-row">
              <span className="hsk-question-edit-text-option-key">{opt.key}</span>
              <input
                type="text"
                value={opt.text ?? ''}
                onChange={(e) => updateOption(idx, { text: e.target.value })}
                placeholder="中文文本"
                className="hsk-question-edit-text-option-text"
              />
              {showPinyin && (
                <PinyinInlineField
                  value={opt.pinyin ?? ''}
                  onChange={(v) => updateOption(idx, { pinyin: v })}
                  placeholder={levelNumber <= 2 ? '拼音 *' : '拼音'}
                  className="hsk-question-edit-text-option-pinyin"
                  required={levelNumber <= 2}
                />
              )}
              {isListeningChoice && (
                <>
                  <span className="hsk-question-edit-text-option-count is-text">
                    {(opt.text ?? '').length}/200
                  </span>
                  {showPinyin && (
                    <span className="hsk-question-edit-text-option-count is-pinyin">
                      {(opt.pinyin ?? '').length}/1000
                    </span>
                  )}
                  <button
                    type="button"
                    className={`hsk-question-edit-text-option-correct${isCorrect ? ' is-active' : ''}`}
                    title={isCorrect ? '当前正确答案' : '设为正确答案'}
                    onClick={() => toggleCorrect(opt.key)}
                  >
                    ✓
                  </button>
                </>
              )}
              {canRemove && (
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  aria-label={`移除选项 ${opt.key}`}
                  onClick={() => removeOption(idx)}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}

        {!isListeningChoice && canAdd && (
          <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addOption}>
            + 添加选项
          </button>
        )}
      </div>
    </>
  );
}
