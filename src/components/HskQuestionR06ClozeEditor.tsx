import {
  defaultR06Blank,
  rekeyR06BlankOptions,
  type HskR06Blank,
  type HskR06BlankOption,
} from '../utils/hskR06Cloze';

type Props = {
  article: string;
  articlePinyin: string;
  blanks: HskR06Blank[];
  levelNumber: number;
  showPinyinFields?: boolean;
  onArticleChange: (next: string) => void;
  onArticlePinyinChange: (next: string) => void;
  onBlanksChange: (next: HskR06Blank[]) => void;
};

export function HskQuestionR06ClozeEditor({
  article,
  articlePinyin,
  blanks,
  levelNumber,
  showPinyinFields = false,
  onArticleChange,
  onArticlePinyinChange,
  onBlanksChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;

  const updateBlanks = (next: HskR06Blank[]) => {
    onBlanksChange(next);
  };

  const updateBlank = (blankIndex: number, patch: Partial<HskR06Blank>) => {
    const next = [...blanks];
    next[blankIndex] = { ...next[blankIndex], ...patch };
    updateBlanks(next);
  };

  const removeBlank = (blankIndex: number) => {
    if (blanks.length <= 1) return;
    updateBlanks(blanks.filter((_, idx) => idx !== blankIndex));
  };

  const addBlank = () => {
    const nextIndex = blanks.length > 0 ? Math.max(...blanks.map((blank) => blank.index)) + 1 : 1;
    updateBlanks([...blanks, defaultR06Blank(nextIndex)]);
  };

  const updateBlankOption = (
    blankIndex: number,
    optionIndex: number,
    patch: Partial<HskR06BlankOption>,
  ) => {
    const blank = blanks[blankIndex];
    const nextOptions = [...blank.options];
    nextOptions[optionIndex] = { ...nextOptions[optionIndex], ...patch };
    updateBlank(blankIndex, { options: rekeyR06BlankOptions(nextOptions) });
  };

  const removeBlankOption = (blankIndex: number, optionIndex: number) => {
    const blank = blanks[blankIndex];
    if (blank.options.length <= 2) return;
    const removed = blank.options[optionIndex];
    const nextOptions = rekeyR06BlankOptions(blank.options.filter((_, idx) => idx !== optionIndex));
    updateBlank(blankIndex, {
      options: nextOptions,
      answer: blank.answer === removed.key ? '' : blank.answer,
    });
  };

  const addBlankOption = (blankIndex: number) => {
    const blank = blanks[blankIndex];
    updateBlank(blankIndex, {
      options: [
        ...blank.options,
        { key: String.fromCharCode(65 + blank.options.length), text: '', pinyin: '' },
      ],
    });
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
            文章 <span className="required">*</span>
          </label>
          <span className="hsk-question-r02-block-hint">用（1）（2）或 () 标记填空位置</span>
          <textarea
            value={article}
            onChange={(e) => onArticleChange(e.target.value)}
            rows={5}
            placeholder="输入包含填空的完整文章，用 (1) 或 () 标记填空位置..."
            className="hsk-question-r05-textarea"
          />
        </div>

        <div className="hsk-question-r05-field">
          <label>文章拼音（可选）</label>
          <input
            type="text"
            value={articlePinyin}
            onChange={(e) => onArticlePinyinChange(e.target.value)}
            placeholder="文章拼音（可选）"
            className="hsk-question-r02-item-text"
          />
        </div>

        <div className="hsk-question-r05-subsection">
          <div className="hsk-question-r02-block-head">
            <label>
              填空选项 <span className="required">*</span>
            </label>
          </div>

          <div className="hsk-question-r06-blank-list">
            {blanks.map((blank, blankIdx) => (
              <div key={`blank-${blank.index}-${blankIdx}`} className="hsk-question-r06-blank-card">
                <div className="hsk-question-r06-blank-head">
                  <span className="hsk-question-r06-blank-title">第 {blank.index} 空</span>
                  <button
                    type="button"
                    className="hsk-question-r06-blank-remove"
                    onClick={() => removeBlank(blankIdx)}
                    disabled={blanks.length <= 1}
                  >
                    删除
                  </button>
                </div>

                <div className="hsk-question-r06-blank-meta">
                  <label className="hsk-question-r06-blank-meta-label">正确答案</label>
                  <select
                    className="hsk-question-r02-pairing-select"
                    value={blank.answer}
                    onChange={(e) => updateBlank(blankIdx, { answer: e.target.value })}
                  >
                    <option value="">— 选择 —</option>
                    {blank.options.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.key}
                        {option.text?.trim() ? `. ${option.text}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hsk-question-r06-option-list">
                  {blank.options.map((option, optionIdx) => (
                    <div key={`${option.key}-${optionIdx}`} className="hsk-question-r06-option-row">
                      <span className="hsk-question-r02-item-index">{option.key}</span>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateBlankOption(blankIdx, optionIdx, { text: e.target.value })}
                        placeholder="选项"
                        className="hsk-question-r02-item-text"
                      />
                      {showPinyin && (
                        <input
                          type="text"
                          value={option.pinyin ?? ''}
                          onChange={(e) =>
                            updateBlankOption(blankIdx, optionIdx, { pinyin: e.target.value })
                          }
                          placeholder="拼音"
                          className="hsk-question-r02-item-pinyin"
                        />
                      )}
                      <button
                        type="button"
                        className="hsk-question-edit-text-option-remove"
                        onClick={() => removeBlankOption(blankIdx, optionIdx)}
                        disabled={blank.options.length <= 2}
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
                  onClick={() => addBlankOption(blankIdx)}
                >
                  + 添加选项
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="hsk-question-r02-add-btn" onClick={addBlank}>
            + 添加填空位
          </button>
        </div>
      </div>
    </>
  );
}
