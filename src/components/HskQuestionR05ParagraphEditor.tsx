import {
  rekeyR05WordBank,
  wordOptionLabel,
  type HskR05WordOption,
} from '../utils/hskR05ParagraphFill';

type Props = {
  paragraph: string;
  paragraphPinyin: string;
  wordBank: HskR05WordOption[];
  blankIndices: number[];
  blankAnswers: Record<number, string>;
  levelNumber: number;
  showPinyinFields?: boolean;
  onParagraphChange: (next: string) => void;
  onParagraphPinyinChange: (next: string) => void;
  onWordBankChange: (next: HskR05WordOption[]) => void;
  onBlankAnswersChange: (next: Record<number, string>) => void;
};

export function HskQuestionR05ParagraphEditor({
  paragraph,
  paragraphPinyin,
  wordBank,
  blankIndices,
  blankAnswers,
  levelNumber,
  showPinyinFields = false,
  onParagraphChange,
  onParagraphPinyinChange,
  onWordBankChange,
  onBlankAnswersChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;

  const updateWord = (index: number, patch: Partial<HskR05WordOption>) => {
    const next = [...wordBank];
    next[index] = { ...next[index], ...patch };
    onWordBankChange(rekeyR05WordBank(next));
  };

  const removeWord = (index: number) => {
    if (wordBank.length <= 2) return;
    const removed = wordBank[index];
    const next = rekeyR05WordBank(wordBank.filter((_, i) => i !== index));
    const nextAnswers: Record<number, string> = {};
    for (const [blankIndex, key] of Object.entries(blankAnswers)) {
      if (key !== removed.key) nextAnswers[Number(blankIndex)] = key;
    }
    onWordBankChange(next);
    onBlankAnswersChange(nextAnswers);
  };

  const addWord = () => {
    onWordBankChange([
      ...wordBank,
      { key: String.fromCharCode(65 + wordBank.length), text: '', pinyin: '' },
    ]);
  };

  const updateBlankAnswer = (blankIndex: number, answerKey: string) => {
    const next = { ...blankAnswers };
    if (answerKey) next[blankIndex] = answerKey;
    else delete next[blankIndex];
    onBlankAnswersChange(next);
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
            段落文本 <span className="required">*</span>
          </label>
          <span className="hsk-question-r02-block-hint">用（1）（2）或 () 标记填空位置</span>
          <textarea
            value={paragraph}
            onChange={(e) => onParagraphChange(e.target.value)}
            rows={5}
            placeholder="输入包含填空的段落，用 (1) 或 () 标记填空位置..."
            className="hsk-question-r05-textarea"
          />
        </div>

        <div className="hsk-question-r05-field">
          <label>段落拼音（可选）</label>
          <input
            type="text"
            value={paragraphPinyin}
            onChange={(e) => onParagraphPinyinChange(e.target.value)}
            placeholder="段落拼音（可选）"
            className="hsk-question-r02-item-text"
          />
        </div>

        <div className="hsk-question-r05-subsection">
          <div className="hsk-question-r02-block-head">
            <label>
              全局选项配置 (Word Bank) <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">选项对段落中所有填空生效</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {wordBank.map((option, idx) => (
              <div key={`${option.key}-${idx}`} className="hsk-question-r02-item-row">
                <span className="hsk-question-r02-item-index">{option.key}</span>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateWord(idx, { text: e.target.value })}
                  placeholder="选项文字"
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <input
                    type="text"
                    value={option.pinyin ?? ''}
                    onChange={(e) => updateWord(idx, { pinyin: e.target.value })}
                    placeholder="拼音"
                    className="hsk-question-r02-item-pinyin"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeWord(idx)}
                  disabled={wordBank.length <= 2}
                  aria-label={`删除选项 ${option.key}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="hsk-question-r02-add-btn" onClick={addWord}>
            + 添加选项
          </button>
        </div>

        <div className="hsk-question-r05-subsection">
          <label className="hsk-question-r02-pairing-title">正确答案映射</label>
          <p className="hsk-question-r05-mapping-hint">
            为每个填空选择其在全局选项池中对应的正确选项
          </p>
          {blankIndices.length === 0 ? (
            <p className="hsk-question-r05-mapping-empty">请先在段落文本中标记填空位置</p>
          ) : (
            <div className="hsk-question-r02-pairing-list">
              {blankIndices.map((blankIndex) => (
                <div key={blankIndex} className="hsk-question-r02-pairing-row">
                  <span className="hsk-question-r02-pairing-num">{blankIndex}</span>
                  <label className="hsk-question-r02-pairing-label">第{blankIndex}空：</label>
                  <select
                    className="hsk-question-r02-pairing-select"
                    value={blankAnswers[blankIndex] ?? ''}
                    onChange={(e) => updateBlankAnswer(blankIndex, e.target.value)}
                  >
                    <option value="">— 选择正确选项 —</option>
                    {wordBank.map((option) => (
                      <option key={option.key} value={option.key}>
                        {wordOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
