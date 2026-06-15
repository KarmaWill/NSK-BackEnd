import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { PinyinCountInput, PinyinInlineField } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import {
  createR07SubQuestion,
  optionDisplayLabel,
  rekeySubQuestionOptions,
} from '../utils/hskR07Reading';

type Props = {
  article: string;
  articlePinyin: string;
  subQuestions: HskSubQuestionPayload[];
  levelNumber: number;
  showPinyinFields?: boolean;
  onArticleChange: (next: string) => void;
  onArticlePinyinChange: (next: string) => void;
  onSubQuestionsChange: (next: HskSubQuestionPayload[]) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((option) => option.key));
  for (let i = 0; i < 26; i += 1) {
    const key = String.fromCharCode(65 + i);
    if (!used.has(key)) return key;
  }
  return 'Z';
}

export function HskQuestionR07ReadingEditor({
  article,
  articlePinyin,
  subQuestions,
  levelNumber,
  showPinyinFields = false,
  onArticleChange,
  onArticlePinyinChange,
  onSubQuestionsChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;

  const updateSub = (index: number, patch: Partial<HskSubQuestionPayload>) => {
    const next = [...subQuestions];
    next[index] = { ...next[index], ...patch };
    onSubQuestionsChange(next);
  };

  const removeSub = (index: number) => {
    if (subQuestions.length <= 1) return;
    onSubQuestionsChange(subQuestions.filter((_, idx) => idx !== index));
  };

  const addSub = () => {
    onSubQuestionsChange([...subQuestions, createR07SubQuestion(subQuestions.length + 1)]);
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
    const options = rekeySubQuestionOptions((sub.options ?? []).filter((_, idx) => idx !== optIndex));
    updateSub(subIndex, {
      options,
      answer: removed && sub.answer === removed.key ? '' : sub.answer,
    });
  };

  const addOption = (subIndex: number) => {
    const sub = subQuestions[subIndex];
    const options = [...(sub.options ?? [])];
    options.push({ key: nextOptionKey(options), text: '', pinyin: '' });
    updateSub(subIndex, { options });
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📝</span>
          <h3>句子 / 文本配置</h3>
        </div>
      </div>

      <div className="hsk-question-r02-section-body">
        <div className="hsk-question-r05-field">
          <label>
            阅读文章 <span className="required">*</span>
          </label>
          <textarea
            value={article}
            onChange={(e) => onArticleChange(e.target.value)}
            rows={6}
            placeholder="输入阅读理解的文章全文..."
            className="hsk-question-r05-textarea"
          />
        </div>

        <div className="hsk-question-r05-field">
          <label>文章拼音（可选 · 整句逐字 ruby）</label>
          <span className="hsk-question-r02-block-hint">
            词级连写或字级分写均可，如：péngyou hǎo 或 péng you hǎo
          </span>
          <PinyinCountInput
            value={articlePinyin}
            onChange={onArticlePinyinChange}
            targetHanCount={countHanInText(article)}
            targetText={article}
            placeholder="如：péngyou hǎo 或 péng you hǎo"
          />
        </div>

        <div className="hsk-question-r05-subsection">
          <div className="hsk-question-r02-block-head">
            <label>
              阅读理解题目 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">每题独立设置选项与答案</span>
          </div>

          <div className="hsk-question-r07-sub-list">
            {subQuestions.map((sub, subIdx) => (
              <div key={`r7-sub-${subIdx}`} className="hsk-question-r07-sub-card">
                <div className="hsk-question-r07-sub-head">
                  <span className="hsk-question-r07-sub-title">问题 {subIdx + 1}</span>
                  <div className="hsk-question-r07-sub-head-actions">
                    <label className="hsk-question-edit-sub-score-field">
                      <span>分</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={sub.score}
                        onChange={(e) =>
                          updateSub(subIdx, { score: Number(e.target.value) || 1 })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="hsk-question-r06-blank-remove"
                      onClick={() => removeSub(subIdx)}
                      disabled={subQuestions.length <= 1}
                    >
                      删除
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={sub.question ?? ''}
                  onChange={(e) => updateSub(subIdx, { question: e.target.value })}
                  placeholder="问题文字"
                  className="hsk-question-r02-item-text hsk-question-r07-sub-question"
                />

                <div className="hsk-question-r06-option-list">
                  {(sub.options ?? []).map((option, optIdx) => (
                    <div key={`${option.key}-${optIdx}`} className="hsk-question-r06-option-row">
                      <span className="hsk-question-r02-item-index">{option.key}</span>
                      <input
                        type="text"
                        value={option.text ?? ''}
                        onChange={(e) => updateOption(subIdx, optIdx, { text: e.target.value })}
                        placeholder="选项文字"
                        className="hsk-question-r02-item-text"
                      />
                      {showPinyin && (
                        <PinyinInlineField
                          value={option.pinyin ?? ''}
                          onChange={(v) => updateOption(subIdx, optIdx, { pinyin: v })}
                          placeholder="拼音"
                        />
                      )}
                      <button
                        type="button"
                        className="hsk-question-edit-text-option-remove"
                        onClick={() => removeOption(subIdx, optIdx)}
                        disabled={(sub.options ?? []).length <= 2}
                        aria-label={`删除选项 ${option.key}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="hsk-question-r02-add-btn"
                  onClick={() => addOption(subIdx)}
                >
                  + 添加选项
                </button>

                <div className="hsk-question-r07-sub-answer">
                  <label className="hsk-question-r06-blank-meta-label">正确答案：</label>
                  <select
                    className="hsk-question-r02-pairing-select"
                    value={sub.answer ?? ''}
                    onChange={(e) => updateSub(subIdx, { answer: e.target.value })}
                  >
                    <option value="">— 选择正确答案 —</option>
                    {(sub.options ?? []).map((option) => (
                      <option key={option.key} value={option.key}>
                        {optionDisplayLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="hsk-question-r02-add-btn" onClick={addSub}>
            + 添加问题
          </button>
        </div>
      </div>
    </>
  );
}
