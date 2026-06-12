import {
  answerDisplayLabel,
  answerPairingOptionLabel,
  type HskR02AnswerItem,
  type HskR02QuestionItem,
} from '../utils/hskR02Match';

type Props = {
  questionItems: HskR02QuestionItem[];
  answerItems: HskR02AnswerItem[];
  pairings: Record<string, string>;
  levelNumber: number;
  showPinyinFields?: boolean;
  onQuestionItemsChange: (next: HskR02QuestionItem[]) => void;
  onAnswerItemsChange: (next: HskR02AnswerItem[]) => void;
  onPairingsChange: (next: Record<string, string>) => void;
};

export function HskQuestionR02MatchEditor({
  questionItems,
  answerItems,
  pairings,
  levelNumber,
  showPinyinFields = false,
  onQuestionItemsChange,
  onAnswerItemsChange,
  onPairingsChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const pairingAnswerOptions = answerItems.filter((item) => !item.isDistractor);

  const updateQuestion = (index: number, patch: Partial<HskR02QuestionItem>) => {
    const next = [...questionItems];
    next[index] = { ...next[index], ...patch };
    onQuestionItemsChange(next);
  };

  const removeQuestion = (index: number) => {
    if (questionItems.length <= 2) return;
    const removed = questionItems[index];
    const next = questionItems.filter((_, i) => i !== index);
    onQuestionItemsChange(next);
    const nextPairings = { ...pairings };
    delete nextPairings[removed.id];
    onPairingsChange(nextPairings);
  };

  const addQuestion = () => {
    onQuestionItemsChange([
      ...questionItems,
      { id: `q${questionItems.length + 1}`, text: '', pinyin: '' },
    ]);
  };

  const updateAnswer = (index: number, patch: Partial<HskR02AnswerItem>) => {
    const next = [...answerItems];
    next[index] = { ...next[index], ...patch };
    onAnswerItemsChange(next);
  };

  const removeAnswer = (index: number) => {
    if (answerItems.length <= questionItems.length + 1) return;
    const removed = answerItems[index];
    const next = answerItems.filter((_, i) => i !== index);
    onAnswerItemsChange(next);
    const nextPairings: Record<string, string> = {};
    for (const [qId, aId] of Object.entries(pairings)) {
      if (aId !== removed.id) nextPairings[qId] = aId;
    }
    onPairingsChange(nextPairings);
  };

  const addAnswer = () => {
    onAnswerItemsChange([
      ...answerItems,
      { id: `a${answerItems.length + 1}`, text: '', pinyin: '', isDistractor: false },
    ]);
  };

  const toggleDistractor = (index: number) => {
    const item = answerItems[index];
    const nextDistractor = !item.isDistractor;
    updateAnswer(index, { isDistractor: nextDistractor });
    if (nextDistractor) {
      const nextPairings: Record<string, string> = {};
      for (const [qId, aId] of Object.entries(pairings)) {
        if (aId !== item.id) nextPairings[qId] = aId;
      }
      onPairingsChange(nextPairings);
    }
  };

  const updatePairing = (questionId: string, answerId: string) => {
    onPairingsChange({ ...pairings, [questionId]: answerId });
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
              问题列表 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">最少 2 个</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {questionItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-question-r02-item-row">
                <span className="hsk-question-r02-item-index">{idx + 1}</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                  placeholder="问题文字"
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <input
                    type="text"
                    value={item.pinyin ?? ''}
                    onChange={(e) => updateQuestion(idx, { pinyin: e.target.value })}
                    placeholder="拼音"
                    className="hsk-question-r02-item-pinyin"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeQuestion(idx)}
                  disabled={questionItems.length <= 2}
                  aria-label={`删除问题 ${idx + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="hsk-question-r02-add-btn" onClick={addQuestion}>
            + 添加问题
          </button>
        </div>

        <div className="hsk-question-r02-block">
          <div className="hsk-question-r02-block-head">
            <label>
              回答列表 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">含干扰项</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {answerItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-question-r02-item-row">
                <span className="hsk-question-r02-item-index">{answerDisplayLabel(item, idx)}</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateAnswer(idx, { text: e.target.value })}
                  placeholder="回答文字"
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <input
                    type="text"
                    value={item.pinyin ?? ''}
                    onChange={(e) => updateAnswer(idx, { pinyin: e.target.value })}
                    placeholder="拼音"
                    className="hsk-question-r02-item-pinyin"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeAnswer(idx)}
                  disabled={answerItems.length <= questionItems.length + 1}
                  aria-label={`删除回答 ${answerDisplayLabel(item, idx)}`}
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
          <button type="button" className="hsk-question-r02-add-btn" onClick={addAnswer}>
            + 添加回答
          </button>
        </div>

        <div className="hsk-question-r02-pairing-section">
          <label className="hsk-question-r02-pairing-title">配对设置</label>
          <div className="hsk-question-r02-pairing-list">
            {questionItems.map((question, idx) => (
              <div key={question.id} className="hsk-question-r02-pairing-row">
                <span className="hsk-question-r02-pairing-num">{idx + 1}</span>
                <label className="hsk-question-r02-pairing-label">正确回答：</label>
                <select
                  className="hsk-question-r02-pairing-select"
                  value={pairings[question.id] ?? ''}
                  onChange={(e) => updatePairing(question.id, e.target.value)}
                >
                  <option value="">— 选择正确回答 —</option>
                  {pairingAnswerOptions.map((answer) => {
                    const answerIdx = answerItems.indexOf(answer);
                    return (
                      <option key={answer.id} value={answer.id}>
                        {answerPairingOptionLabel(answer, answerIdx)}
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
