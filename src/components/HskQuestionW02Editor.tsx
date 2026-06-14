import type { HskW02PinyinHint } from '../utils/hskW02PinyinFill';
import { createEmptyW02Hint } from '../utils/hskW02PinyinFill';

type Props = {
  hints: HskW02PinyinHint[];
  onChange: (next: HskW02PinyinHint[]) => void;
};

export function HskQuestionW02Editor({ hints, onChange }: Props) {
  const updateHint = (index: number, patch: Partial<HskW02PinyinHint>) => {
    const next = [...hints];
    next[index] = { ...next[index], ...patch };
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

            <div className="hsk-question-w02-grid">
              <div className="form-group">
                <label>
                  前文 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={hint.textBefore}
                  onChange={(e) => updateHint(idx, { textBefore: e.target.value })}
                  placeholder="如：我喜欢吃"
                />
              </div>
              <div className="form-group">
                <label>
                  拼音提示 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={hint.pinyin}
                  onChange={(e) => updateHint(idx, { pinyin: e.target.value })}
                  placeholder="如：shuǐguǒ 或 (shuǐguǒ)"
                />
              </div>
              <div className="form-group">
                <label>后文</label>
                <input
                  type="text"
                  value={hint.textAfter}
                  onChange={(e) => updateHint(idx, { textAfter: e.target.value })}
                  placeholder="如：。"
                />
              </div>
              <div className="form-group">
                <label>
                  正确答案 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={hint.answer}
                  onChange={(e) => updateHint(idx, { answer: e.target.value })}
                  placeholder="如：水果"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
