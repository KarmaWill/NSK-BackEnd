import {
  wordDisplayLabel,
  wordPairingOptionLabel,
  type HskR03SentenceBlank,
  type HskR03WordItem,
} from '../utils/hskR03WordFill';

type Props = {
  sentenceBlanks: HskR03SentenceBlank[];
  wordItems: HskR03WordItem[];
  pairings: Record<string, string>;
  levelNumber: number;
  showPinyinFields?: boolean;
  onSentenceBlanksChange: (next: HskR03SentenceBlank[]) => void;
  onWordItemsChange: (next: HskR03WordItem[]) => void;
  onPairingsChange: (next: Record<string, string>) => void;
};

export function HskQuestionR03WordFillEditor({
  sentenceBlanks,
  wordItems,
  pairings,
  levelNumber,
  showPinyinFields = false,
  onSentenceBlanksChange,
  onWordItemsChange,
  onPairingsChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const pairingWordOptions = wordItems.filter((item) => !item.isDistractor);

  const updateBlank = (index: number, patch: Partial<HskR03SentenceBlank>) => {
    const next = [...sentenceBlanks];
    next[index] = { ...next[index], ...patch };
    onSentenceBlanksChange(next);
  };

  const removeBlank = (index: number) => {
    if (sentenceBlanks.length <= 1) return;
    const removed = sentenceBlanks[index];
    const next = sentenceBlanks.filter((_, i) => i !== index);
    onSentenceBlanksChange(next);
    const nextPairings = { ...pairings };
    delete nextPairings[removed.id];
    onPairingsChange(nextPairings);
  };

  const addBlank = () => {
    onSentenceBlanksChange([
      ...sentenceBlanks,
      { id: `blank${sentenceBlanks.length + 1}`, sentence: '', pinyin: '' },
    ]);
  };

  const updateWord = (index: number, patch: Partial<HskR03WordItem>) => {
    const next = [...wordItems];
    next[index] = { ...next[index], ...patch };
    onWordItemsChange(next);
  };

  const removeWord = (index: number) => {
    if (wordItems.length <= sentenceBlanks.length + 1) return;
    const removed = wordItems[index];
    const next = wordItems.filter((_, i) => i !== index);
    onWordItemsChange(next);
    const nextPairings: Record<string, string> = {};
    for (const [blankId, wordId] of Object.entries(pairings)) {
      if (wordId !== removed.id) nextPairings[blankId] = wordId;
    }
    onPairingsChange(nextPairings);
  };

  const addWord = () => {
    onWordItemsChange([
      ...wordItems,
      { id: `w${wordItems.length + 1}`, text: '', pinyin: '', isDistractor: false },
    ]);
  };

  const toggleDistractor = (index: number) => {
    const item = wordItems[index];
    const nextDistractor = !item.isDistractor;
    updateWord(index, { isDistractor: nextDistractor });
    if (nextDistractor) {
      const nextPairings: Record<string, string> = {};
      for (const [blankId, wordId] of Object.entries(pairings)) {
        if (wordId !== item.id) nextPairings[blankId] = wordId;
      }
      onPairingsChange(nextPairings);
    }
  };

  const updatePairing = (blankId: string, wordId: string) => {
    onPairingsChange({ ...pairings, [blankId]: wordId });
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
        <div className="hsk-question-r02-block">
          <div className="hsk-question-r02-block-head">
            <label>
              填空句子 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">用（）标记填空处</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {sentenceBlanks.map((blank, idx) => (
              <div key={`${blank.id}-${idx}`} className="hsk-question-r02-item-row hsk-question-r03-blank-row">
                <span className="hsk-question-r02-item-index">{idx + 1}</span>
                <input
                  type="text"
                  value={blank.sentence}
                  onChange={(e) => updateBlank(idx, { sentence: e.target.value })}
                  placeholder={`句子 ${idx + 1}（用（）标记填空处）`}
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <input
                    type="text"
                    value={blank.pinyin ?? ''}
                    onChange={(e) => updateBlank(idx, { pinyin: e.target.value })}
                    placeholder="拼音"
                    className="hsk-question-r02-item-pinyin"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeBlank(idx)}
                  disabled={sentenceBlanks.length <= 1}
                  aria-label={`删除句子 ${idx + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="hsk-question-r02-add-btn" onClick={addBlank}>
            + 添加句子
          </button>
        </div>

        <div className="hsk-question-r02-block">
          <div className="hsk-question-r02-block-head">
            <label>
              词库 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">含干扰项</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {wordItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-question-r02-item-row">
                <span className="hsk-question-r02-item-index">{wordDisplayLabel(item, idx)}</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateWord(idx, { text: e.target.value })}
                  placeholder="词语"
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <input
                    type="text"
                    value={item.pinyin ?? ''}
                    onChange={(e) => updateWord(idx, { pinyin: e.target.value })}
                    placeholder="拼音"
                    className="hsk-question-r02-item-pinyin"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeWord(idx)}
                  disabled={wordItems.length <= sentenceBlanks.length + 1}
                  aria-label={`删除词语 ${wordDisplayLabel(item, idx)}`}
                >
                  ×
                </button>
                <button
                  type="button"
                  className={`hsk-question-r02-distractor-btn${item.isDistractor ? ' is-active' : ''}`}
                  onClick={() => toggleDistractor(idx)}
                >
                  干扰项
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="hsk-question-r02-add-btn" onClick={addWord}>
            + 添加词语
          </button>
        </div>

        <div className="hsk-question-r02-pairing-section">
          <label className="hsk-question-r02-pairing-title">配对设置</label>
          <p className="hsk-question-r03-pairing-hint">每空选择其正确答案对应的词语</p>
          <div className="hsk-question-r02-pairing-list">
            {sentenceBlanks.map((blank, idx) => (
              <div key={blank.id} className="hsk-question-r02-pairing-row">
                <span className="hsk-question-r02-pairing-num">{idx + 1}</span>
                <label className="hsk-question-r02-pairing-label">第{idx + 1}空 正确答案：</label>
                <select
                  className="hsk-question-r02-pairing-select"
                  value={pairings[blank.id] ?? ''}
                  onChange={(e) => updatePairing(blank.id, e.target.value)}
                >
                  <option value="">— 选择正确答案 —</option>
                  {pairingWordOptions.map((word) => {
                    const wordIdx = wordItems.indexOf(word);
                    return (
                      <option key={word.id} value={word.id}>
                        {wordPairingOptionLabel(word, wordIdx)}
                      </option>
                    );
                  })}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
