import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import {
  createEmptyW02Hint,
  normalizeW02Hint,
  type HskW02PinyinHint,
} from '../utils/hskW02PinyinFill';

type Props = {
  hints: HskW02PinyinHint[];
  levelNumber: number;
  showPinyinFields?: boolean;
  showFillFeedback: boolean;
  onChange: (next: HskW02PinyinHint[]) => void;
  onShowFillFeedbackChange: (next: boolean) => void;
};

export function HskQuestionW02Editor({
  hints,
  levelNumber,
  showPinyinFields = false,
  showFillFeedback,
  onChange,
  onShowFillFeedbackChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;

  const updateHint = (index: number, patch: Partial<HskW02PinyinHint>) => {
    const next = [...hints];
    next[index] = normalizeW02Hint({ ...next[index], ...patch });
    onChange(next);
  };

  const removeHint = (index: number) => {
    if (hints.length <= 1) return;
    onChange(hints.filter((_, i) => i !== index));
  };

  const addHint = () => {
    onChange([...hints, createEmptyW02Hint()]);
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📝</span>
          <h3>拼音挖空句子</h3>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addHint}>
          + 添加句子
        </button>
      </div>

      <div className="hsk-question-w02-options">
        <label className="hsk-question-w02-feedback-toggle">
          <span className="hsk-question-w02-feedback-toggle-label">前端显示对错</span>
          <span className="toggle-wrap" aria-hidden>
            <input
              type="checkbox"
              checked={showFillFeedback}
              onChange={(e) => onShowFillFeedbackChange(e.target.checked)}
            />
            <div className="toggle-track" />
            <div className="toggle-thumb" />
          </span>
        </label>
        <span className="hsk-question-w02-feedback-toggle-hint">
          {showFillFeedback ? '学员作答时显示 ✓/✗ 反馈' : '学员作答时不显示对错标记'}
        </span>
      </div>

      <div className="hsk-question-w02-body">
        {hints.map((hint, idx) => (
          <div key={`w02-hint-${idx}`} className="hsk-question-w02-card">
            <div className="hsk-question-w02-card-head">
              <span className="hsk-question-w02-card-index">句子 {idx + 1}</span>
              {hints.length > 1 && (
                <button
                  type="button"
                  className="hsk-question-w02-card-remove"
                  onClick={() => removeHint(idx)}
                >
                  删除
                </button>
              )}
            </div>

            <div className="hsk-question-w02-fields">
              <div className="hsk-question-r05-field">
                <label>
                  句子文本 <span className="required">*</span>
                </label>
                <span className="hsk-question-r02-block-hint">
                  用（）或（pinyin）标记挖空处，括号内拼音会显示在空格上方；如：我每天早（shàng）去学校。
                </span>
                <textarea
                  value={hint.sentence}
                  onChange={(e) => updateHint(idx, { sentence: e.target.value })}
                  rows={3}
                  placeholder="输入含挖空的句子，括号内拼音会显示在空格处…"
                  className="hsk-question-r05-textarea"
                />
              </div>

              {showPinyin && (
                <div className="hsk-question-r05-field">
                  <label>句子拼音（可选 · 整句逐字 ruby）</label>
                  <span className="hsk-question-r02-block-hint">
                    词级连写或字级分写均可，如：měi tiān zǎo qù xuéxiào；挖空处不算字、自动跳过
                  </span>
                  <PinyinCountInput
                    value={hint.sentencePinyin ?? ''}
                    onChange={(v) => updateHint(idx, { sentencePinyin: v })}
                    targetHanCount={countHanInText(hint.sentence)}
                    targetText={hint.sentence}
                    placeholder="如：měi tiān zǎo qù xuéxiào"
                  />
                </div>
              )}

              <div className="hsk-question-r05-field">
                <label>
                  正确答案 <span className="required">*</span>
                </label>
                <span className="hsk-question-r02-block-hint">挖空处应填写的汉字</span>
                <input
                  type="text"
                  value={hint.answer}
                  onChange={(e) => updateHint(idx, { answer: e.target.value })}
                  placeholder="如：上"
                  className="hsk-question-r02-item-text"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
