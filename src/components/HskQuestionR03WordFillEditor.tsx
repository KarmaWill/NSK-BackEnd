import { useState } from 'react';
import { PinyinCountInput, PinyinInlineField } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import {
  wordDisplayLabel,
  wordPairingOptionLabel,
  type HskR03SentenceBlank,
  type HskR03WordItem,
} from '../utils/hskR03WordFill';

type DeleteTarget =
  | { kind: 'blank'; index: number }
  | { kind: 'word'; index: number };

type Props = {
  sentenceBlanks: HskR03SentenceBlank[];
  wordItems: HskR03WordItem[];
  pairings: Record<string, string>;
  levelNumber: number;
  showPinyinFields?: boolean;
  onSentenceBlanksChange: (next: HskR03SentenceBlank[]) => void;
  onWordItemsChange: (next: HskR03WordItem[]) => void;
  onPairingsChange: (next: Record<string, string>) => void;
  onBatchSync: (
    sentenceBlanks: HskR03SentenceBlank[],
    wordItems: HskR03WordItem[],
    pairings: Record<string, string>,
  ) => void;
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
  onBatchSync,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const canRemoveBlank = sentenceBlanks.length > 1;
  const canRemoveWord = wordItems.length > sentenceBlanks.length;

  const toggleExample = (index: number) => {
    const nextIsExample = !sentenceBlanks[index].isExample;
    onSentenceBlanksChange(
      sentenceBlanks.map((blank, idx) => {
        if (idx === index) {
          return { ...blank, isExample: nextIsExample };
        }
        if (nextIsExample && blank.isExample) {
          return { ...blank, isExample: false };
        }
        return blank;
      }),
    );
  };

  const updateBlank = (index: number, patch: Partial<HskR03SentenceBlank>) => {
    const next = [...sentenceBlanks];
    next[index] = { ...next[index], ...patch };
    onSentenceBlanksChange(next);
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

  const addWord = () => {
    onWordItemsChange([
      ...wordItems,
      {
        id: `w${wordItems.length + 1}`,
        text: '',
        pinyin: '',
        isDistractor: wordItems.length >= sentenceBlanks.length,
      },
    ]);
  };

  const toggleDistractor = (index: number) => {
    const item = wordItems[index];
    const nextDistractor = !item.isDistractor;
    const nextWords = [...wordItems];
    nextWords[index] = { ...nextWords[index], isDistractor: nextDistractor };
    if (nextDistractor) {
      const nextPairings: Record<string, string> = {};
      for (const [blankId, wordId] of Object.entries(pairings)) {
        if (wordId !== item.id) nextPairings[blankId] = wordId;
      }
      onBatchSync(sentenceBlanks, nextWords, nextPairings);
      return;
    }
    onWordItemsChange(nextWords);
  };

  const updatePairing = (blankId: string, wordId: string) => {
    onPairingsChange({ ...pairings, [blankId]: wordId });
  };

  const requestRemoveBlank = (index: number) => {
    if (!canRemoveBlank) return;
    setDeleteTarget({ kind: 'blank', index });
  };

  const requestRemoveWord = (index: number) => {
    if (!canRemoveWord) return;
    setDeleteTarget({ kind: 'word', index });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.kind === 'blank') {
      const removed = sentenceBlanks[deleteTarget.index];
      const nextBlanks = sentenceBlanks.filter((_, i) => i !== deleteTarget.index);
      const nextPairings = { ...pairings };
      delete nextPairings[removed.id];
      onBatchSync(nextBlanks, wordItems, nextPairings);
    } else {
      const removed = wordItems[deleteTarget.index];
      const nextWords = wordItems.filter((_, i) => i !== deleteTarget.index);
      const nextPairings: Record<string, string> = {};
      for (const [blankId, wordId] of Object.entries(pairings)) {
        if (wordId !== removed.id) nextPairings[blankId] = wordId;
      }
      onBatchSync(sentenceBlanks, nextWords, nextPairings);
    }

    setDeleteTarget(null);
  };

  const deleteMessage =
    deleteTarget?.kind === 'blank'
      ? `确认删除第 ${deleteTarget.index + 1} 句？对应的配对设置也会一并移除。`
      : deleteTarget?.kind === 'word'
        ? `确认删除词语 ${wordDisplayLabel(wordItems[deleteTarget.index], deleteTarget.index)}？若已设为正确答案，配对也会被清除。`
        : '';

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
            <span className="hsk-question-r02-block-hint">用（）或（pinyin）标记填空处，括号内拼音会显示在空格上方；拼音按词连写，如 xiaoyu jintian qu chi</span>
          </div>
          <div className="hsk-question-r02-item-list hsk-question-r03-blank-list">
            {sentenceBlanks.map((blank, idx) => (
              <div
                key={`${blank.id}-${idx}`}
                className={`hsk-question-r03-blank-card${blank.isExample ? ' is-example' : ''}`}
              >
                <div className="hsk-question-r02-item-row">
                  <span className="hsk-question-r02-item-index">
                    {blank.isExample ? '例题' : idx + 1}
                  </span>
                  <input
                    type="text"
                    value={blank.sentence}
                    onChange={(e) => updateBlank(idx, { sentence: e.target.value })}
                    placeholder={`句子 ${idx + 1}（用（）或（pinyin）标记填空处）`}
                    className="hsk-question-r02-item-text"
                  />
                  <label className="hsk-question-l02-sub-example-toggle">
                    <span className="hsk-question-l02-sub-example-label">例题</span>
                    <span className="toggle-wrap">
                      <input
                        type="checkbox"
                        checked={!!blank.isExample}
                        onChange={() => toggleExample(idx)}
                      />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </span>
                  </label>
                  <button
                    type="button"
                    className="hsk-question-edit-text-option-remove"
                    onClick={() => requestRemoveBlank(idx)}
                    disabled={!canRemoveBlank}
                    aria-label={`删除句子 ${idx + 1}`}
                  >
                    ×
                  </button>
                </div>
                {showPinyin && (
                  <PinyinCountInput
                    value={blank.pinyin ?? ''}
                    onChange={(v) => updateBlank(idx, { pinyin: v })}
                    targetHanCount={countHanInText(blank.sentence)}
                    targetText={blank.sentence}
                    placeholder="词级：xiaoyu jintian qu chi；字级：xiao yu jin tian qu chi"
                    className="hsk-question-r03-sentence-pinyin-input"
                  />
                )}
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
                  <PinyinInlineField
                    value={item.pinyin ?? ''}
                    onChange={(v) => updateWord(idx, { pinyin: v })}
                    placeholder="拼音"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => requestRemoveWord(idx)}
                  disabled={!canRemoveWord}
                  aria-label={`删除词语 ${wordDisplayLabel(item, idx)}`}
                  title={
                    canRemoveWord
                      ? undefined
                      : `至少保留 ${sentenceBlanks.length} 个词语（每空 1 个），请先删除多余句子或减少填空数`
                  }
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
          <p className="hsk-question-r03-pairing-hint">
            每空选择其正确答案；下拉选项与上方词库 A/B/C… 一一对应，添加词语后会同步出现
          </p>
          <div className="hsk-question-r02-pairing-list">
            {sentenceBlanks.map((blank, idx) => (
              <div key={blank.id} className="hsk-question-r02-pairing-row">
                <span className="hsk-question-r02-pairing-num">
                  {blank.isExample ? '例题' : idx + 1}
                </span>
                <label className="hsk-question-r02-pairing-label">
                  {blank.isExample ? '例题' : `第${idx + 1}空`} 正确答案：
                </label>
                <select
                  className="hsk-question-r02-pairing-select"
                  value={pairings[blank.id] ?? ''}
                  onChange={(e) => updatePairing(blank.id, e.target.value)}
                >
                  <option value="">— 选择正确答案 —</option>
                  {wordItems.map((word, wordIdx) => (
                    <option key={word.id} value={word.id}>
                      {wordPairingOptionLabel(word, wordIdx)}
                      {word.isDistractor ? '（干扰项）' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`modal-overlay ${deleteTarget ? 'open' : ''}`}
        onClick={() => setDeleteTarget(null)}
        role="dialog"
        aria-modal="true"
        aria-label="确认删除"
      >
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <div className="modal-title">确认删除</div>
            <button
              type="button"
              className="modal-close"
              onClick={() => setDeleteTarget(null)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>{deleteMessage}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={confirmDelete}>
              确认删除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
