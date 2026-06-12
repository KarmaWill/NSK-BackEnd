import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { createL05SubQuestion } from '../utils/hskChoiceSubQuestions';

type Props = {
  subQuestions: HskSubQuestionPayload[];
  levelNumber: number;
  showPinyinFields?: boolean;
  onChange: (next: HskSubQuestionPayload[]) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((o) => o.key));
  for (let i = 0; i < 26; i += 1) {
    const key = String.fromCharCode(65 + i);
    if (!used.has(key)) return key;
  }
  return 'Z';
}

export function HskQuestionChoiceSubQuestionsEditor({
  subQuestions,
  levelNumber,
  showPinyinFields = false,
  onChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;

  const updateSub = (index: number, patch: Partial<HskSubQuestionPayload>) => {
    const next = [...subQuestions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeSub = (index: number) => {
    onChange(subQuestions.filter((_, i) => i !== index));
  };

  const addSub = () => {
    onChange([...subQuestions, createL05SubQuestion(subQuestions.length + 1)]);
  };

  const updateOption = (subIndex: number, optIndex: number, patch: Partial<HskRuntimeOption>) => {
    const sub = subQuestions[subIndex];
    const options = [...(sub.options ?? [])];
    options[optIndex] = { ...options[optIndex], ...patch };
    updateSub(subIndex, { options });
  };

  const removeOption = (subIndex: number, optIndex: number) => {
    const sub = subQuestions[subIndex];
    const removed = sub.options?.[optIndex];
    const options = (sub.options ?? []).filter((_, i) => i !== optIndex);
    const answer = removed && sub.answer === removed.key ? '' : sub.answer;
    updateSub(subIndex, { options, answer });
  };

  const addOption = (subIndex: number) => {
    const sub = subQuestions[subIndex];
    const options = [...(sub.options ?? [])];
    options.push({ key: nextOptionKey(options), text: '', pinyin: '' });
    updateSub(subIndex, { options });
  };

  const toggleAnswer = (subIndex: number, key: string) => {
    const sub = subQuestions[subIndex];
    updateSub(subIndex, { answer: sub.answer === key ? '' : key });
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <SectionHeader icon="📋" title="子题目列表" />

      {subQuestions.map((sub, subIdx) => (
        <div key={`${sub.id ?? subIdx}-${subIdx}`} className="hsk-question-edit-sub-card is-choice">
          <div className="hsk-question-edit-sub-card-head">
            <div className="hsk-question-edit-sub-card-head-left">
              <span className="hsk-question-edit-sub-index">{subIdx + 1}</span>
              <span className="hsk-question-edit-sub-card-title">子题目{subIdx + 1}</span>
            </div>
            <div className="hsk-question-edit-sub-card-head-right">
              <label className="hsk-question-edit-sub-score-field">
                <span>分值</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sub.score}
                  onChange={(e) => updateSub(subIdx, { score: Number(e.target.value) || 1 })}
                />
              </label>
              <button
                type="button"
                className="hsk-question-edit-sub-remove"
                onClick={() => removeSub(subIdx)}
              >
                删除
              </button>
            </div>
          </div>

          <div className="hsk-question-edit-sub-card-body">
            <div className="hsk-question-edit-sub-field">
              <label>
                问题 <span className="is-optional">(选填)</span>
              </label>
              <input
                type="text"
                value={sub.question ?? ''}
                onChange={(e) => updateSub(subIdx, { question: e.target.value })}
                placeholder="问题内容（选填）"
              />
            </div>

            <div className="hsk-question-edit-sub-options-block">
              <label>选项</label>
              <div className="hsk-question-edit-sub-options">
                {(sub.options ?? []).map((opt, optIdx) => {
                  const isCorrect = sub.answer === opt.key;
                  return (
                    <div key={`${opt.key}-${optIdx}`} className="hsk-question-edit-sub-option-row">
                      <button
                        type="button"
                        className={`hsk-question-edit-sub-option-key-btn${isCorrect ? ' is-active' : ''}`}
                        title={isCorrect ? '当前正确答案' : '设为正确答案'}
                        onClick={() => toggleAnswer(subIdx, opt.key)}
                      >
                        {isCorrect ? '✓' : opt.key}
                      </button>
                      <input
                        type="text"
                        value={opt.text ?? ''}
                        onChange={(e) => updateOption(subIdx, optIdx, { text: e.target.value })}
                        placeholder="选项文字"
                        className="hsk-question-edit-sub-option-text"
                      />
                      {showPinyin && (
                        <input
                          type="text"
                          value={opt.pinyin ?? ''}
                          onChange={(e) => updateOption(subIdx, optIdx, { pinyin: e.target.value })}
                          placeholder={levelNumber <= 2 ? '拼音 *' : '拼音'}
                          className="hsk-question-edit-sub-option-pinyin"
                        />
                      )}
                      <button
                        type="button"
                        className="hsk-question-edit-text-option-remove"
                        onClick={() => removeOption(subIdx, optIdx)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                className="hsk-question-edit-sub-add-option-btn"
                onClick={() => addOption(subIdx)}
              >
                + 添加选项
              </button>
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addSub}>
        + 添加子题目
      </button>
    </>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="hsk-question-edit-section-head">
      <div className="hsk-question-edit-section-head-main">
        <span aria-hidden>{icon}</span>
        <h3>{title}</h3>
      </div>
    </div>
  );
}
