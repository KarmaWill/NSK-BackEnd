import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { HskRichArticleEditor } from './HskRichArticleEditor';
import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import { countHanInRichArticle, stripRichArticleHtml } from '../utils/hskRichArticleHtml';
import {
  createR07SubQuestion,
  optionDisplayLabel,
  rekeySubQuestionOptions,
} from '../utils/hskR07Reading';

type Props = {
  article: string;
  articlePinyin: string;
  paragraphIndent?: boolean;
  subQuestions: HskSubQuestionPayload[];
  levelNumber: number;
  showPinyinFields?: boolean;
  questionUid?: string;
  presetImageUrl?: string;
  onArticleChange: (next: string) => void;
  onArticlePinyinChange: (next: string) => void;
  onParagraphIndentChange: (enabled: boolean) => void;
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
  paragraphIndent = true,
  subQuestions,
  levelNumber,
  showPinyinFields = false,
  questionUid,
  presetImageUrl = '',
  onArticleChange,
  onArticlePinyinChange,
  onParagraphIndentChange,
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
          <HskRichArticleEditor
            value={article}
            onChange={onArticleChange}
            remountKey={questionUid}
            presetImageUrl={presetImageUrl}
            placeholder="输入阅读理解的文章全文…"
            paragraphIndent={paragraphIndent}
            onParagraphIndentChange={onParagraphIndentChange}
          />
        </div>

        <div className="hsk-question-r05-field">
          <label>文章拼音（可选 · 整句逐字 ruby）</label>
          <span className="hsk-question-r02-block-hint">
            词级连写或字级分写均可；富文本文章按纯文字计字，可换行输入长段拼音
            {paragraphIndent ? ' · 已同步段首空两格' : ''}
          </span>
          <PinyinCountInput
            multiline
            rows={8}
            value={articlePinyin}
            onChange={onArticlePinyinChange}
            targetHanCount={countHanInRichArticle(article)}
            targetText={stripRichArticleHtml(article)}
            paragraphIndent={paragraphIndent}
            placeholder="词级：péngyou hǎo shìjiè；字级：péng you hǎo shì jiè"
            className="hsk-pinyin-count-textarea"
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

                <div className="hsk-question-r07-sub-question-block">
                  <input
                    type="text"
                    value={sub.question ?? ''}
                    onChange={(e) => updateSub(subIdx, { question: e.target.value })}
                    placeholder="问题文字（词间空格分词，如：小雨 今天 去 吃）"
                    className="hsk-question-r01-sentence-text"
                  />
                  {showPinyin && (
                    <PinyinCountInput
                      value={sub.questionPinyin ?? ''}
                      onChange={(v) => updateSub(subIdx, { questionPinyin: v })}
                      targetHanCount={countHanInText(sub.question ?? '')}
                      targetText={sub.question ?? ''}
                      placeholder="词级：xiaoyu jintian qu chi；字级：xiao yu jin tian"
                      className="hsk-question-r03-sentence-pinyin-input"
                    />
                  )}
                </div>

                <div className="hsk-question-r07-option-list">
                  {(sub.options ?? []).map((option, optIdx) => (
                    <div
                      key={`${option.key}-${optIdx}`}
                      className="hsk-question-r01-sentence-card hsk-question-r07-option-card"
                    >
                      <button
                        type="button"
                        className="hsk-question-edit-text-option-remove hsk-question-r01-sentence-remove"
                        onClick={() => removeOption(subIdx, optIdx)}
                        disabled={(sub.options ?? []).length <= 2}
                        aria-label={`删除选项 ${option.key}`}
                      >
                        ×
                      </button>
                      <div className="hsk-question-r01-sentence-card-body">
                        <span className="hsk-question-r01-sentence-key">{option.key}</span>
                        <input
                          type="text"
                          value={option.text ?? ''}
                          onChange={(e) => updateOption(subIdx, optIdx, { text: e.target.value })}
                          placeholder="选项文字（词间空格分词）"
                          className="hsk-question-r01-sentence-text"
                        />
                        {showPinyin && (
                          <PinyinCountInput
                            value={option.pinyin ?? ''}
                            onChange={(v) => updateOption(subIdx, optIdx, { pinyin: v })}
                            targetHanCount={countHanInText(option.text ?? '')}
                            targetText={option.text ?? ''}
                            placeholder="词级：xiaoyu jintian；字级：xiao yu jin tian"
                            className="hsk-question-r03-sentence-pinyin-input"
                          />
                        )}
                      </div>
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
