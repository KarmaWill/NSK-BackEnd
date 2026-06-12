import type { HskRuntimeOption } from '../types/hskExams';
import { relabelR09Options } from '../utils/hskR09ImageWord';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

type Props = {
  sentence: string;
  sentencePinyin: string;
  options: HskRuntimeOption[];
  correctAnswer: string;
  levelNumber: number;
  showPinyinFields?: boolean;
  onSentenceChange: (value: string) => void;
  onSentencePinyinChange: (value: string) => void;
  onOptionsChange: (next: HskRuntimeOption[]) => void;
  onCorrectAnswerChange: (value: string) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((o) => o.key));
  return OPTION_KEYS.find((k) => !used.has(k)) ?? 'I';
}

export function HskQuestionR09Editor({
  sentence,
  sentencePinyin,
  options,
  correctAnswer,
  levelNumber,
  showPinyinFields = false,
  onSentenceChange,
  onSentencePinyinChange,
  onOptionsChange,
  onCorrectAnswerChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const pinyinRequired = levelNumber <= 2;
  const canAdd = options.length < 8;
  const canRemove = options.length > 2;

  const updateOption = (index: number, patch: Partial<HskRuntimeOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...patch };
    onOptionsChange(next);
  };

  const removeOption = (index: number) => {
    if (!canRemove) return;
    const removed = options[index];
    const next = relabelR09Options(options.filter((_, i) => i !== index));
    onOptionsChange(next);
    if (correctAnswer === removed.key) {
      onCorrectAnswerChange('');
    }
  };

  const addOption = () => {
    if (!canAdd) return;
    onOptionsChange([...options, { key: nextOptionKey(options), text: '', pinyin: '' }]);
  };

  const toggleCorrect = (key: string) => {
    onCorrectAnswerChange(correctAnswer === key ? '' : key);
  };

  const renderOptionRow = (
    opt: HskRuntimeOption,
    idx: number,
    variant: 'text' | 'word',
  ) => {
    const isCorrect = correctAnswer === opt.key;
    return (
      <div key={`${variant}-${opt.key}-${idx}`} className="hsk-question-r09-option-row">
        <span className="hsk-question-r09-option-key">{opt.key}</span>
        <input
          type="text"
          value={opt.text ?? ''}
          onChange={(e) => updateOption(idx, { text: e.target.value })}
          placeholder={variant === 'word' ? '词语' : '中文文本'}
          className="hsk-question-r09-option-text"
        />
        {variant === 'text' && showPinyin && (
          <input
            type="text"
            value={opt.pinyin ?? ''}
            onChange={(e) => updateOption(idx, { pinyin: e.target.value })}
            placeholder={pinyinRequired ? '拼音 *' : '拼音'}
            className="hsk-question-r09-option-pinyin"
          />
        )}
        {variant === 'word' && (
          <button
            type="button"
            className={`hsk-question-r09-option-correct${isCorrect ? ' is-active' : ''}`}
            title={isCorrect ? '当前正确答案' : '设为正确答案'}
            onClick={() => toggleCorrect(opt.key)}
          >
            ✓
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            className="hsk-question-r09-option-remove"
            aria-label={`移除选项 ${opt.key}`}
            onClick={() => removeOption(idx)}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>☑</span>
          <h3>文字选项（{options.length}个）</h3>
        </div>
      </div>
      <div className="hsk-question-r09-option-list">
        {options.map((opt, idx) => renderOptionRow(opt, idx, 'text'))}
        {canAdd && (
          <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addOption}>
            + 添加选项
          </button>
        )}
      </div>

      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📝</span>
          <h3>句子 / 文本配置</h3>
        </div>
      </div>

      <div className="hsk-question-r09-body">
        <div className="form-group">
          <label>
            填空句 <span className="required">*</span>
          </label>
          <span className="hsk-question-r09-field-hint">用（）标记填空处</span>
          <input
            type="text"
            value={sentence}
            onChange={(e) => onSentenceChange(e.target.value)}
            placeholder="如：他们一家人正在（　　）晚饭。"
          />
        </div>

        {showPinyin && (
          <div className="form-group">
            <label>
              拼音
              {pinyinRequired ? <span className="required"> *</span> : <span className="is-optional"> （选填）</span>}
            </label>
            <input
              type="text"
              value={sentencePinyin}
              onChange={(e) => onSentencePinyinChange(e.target.value)}
              placeholder="如：tā men yī jiā rén zhèng zài （　　） wǎn fàn。"
            />
          </div>
        )}

        <div className="hsk-question-r09-word-section">
          <label className="hsk-question-r09-word-label">
            词语选项 <span className="required">*</span>
          </label>
          <div className="hsk-question-r09-option-list is-compact">
            {options.map((opt, idx) => renderOptionRow(opt, idx, 'word'))}
            {canAdd && (
              <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addOption}>
                + 添加词语
              </button>
            )}
          </div>
        </div>

        <div className="hsk-question-r09-answer-section">
          <label className="hsk-question-r09-answer-label">正确答案</label>
          <select
            value={correctAnswer}
            onChange={(e) => onCorrectAnswerChange(e.target.value)}
            className="hsk-question-r09-answer-select"
          >
            <option value="">— 选择正确答案 —</option>
            {options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.key}
                {opt.text ? ` · ${opt.text}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📚</span>
          <h3>词语选项（{options.length}个）</h3>
        </div>
        {canAdd && (
          <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addOption}>
            + 添加词语
          </button>
        )}
      </div>
      <div className="hsk-question-r09-option-list is-compact">
        {options.map((opt, idx) => renderOptionRow(opt, idx, 'word'))}
      </div>
    </>
  );
}
