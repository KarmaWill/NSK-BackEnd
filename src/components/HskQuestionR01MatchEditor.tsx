import type { HskRuntimeOption } from '../types/hskExams';
import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import { type HskMatchSentence } from '../utils/hskR01Match';

type Props = {
  sentences: HskMatchSentence[];
  imageOptions: HskRuntimeOption[];
  pairings: Record<string, string | 'distractor' | ''>;
  levelNumber: number;
  showPinyinFields?: boolean;
  onSentencesChange: (next: HskMatchSentence[]) => void;
  onPairingsChange: (next: Record<string, string | 'distractor' | ''>) => void;
};

export function HskQuestionR01MatchEditor({
  sentences,
  imageOptions,
  pairings,
  levelNumber,
  showPinyinFields = false,
  onSentencesChange,
  onPairingsChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const imageKeys = imageOptions.map((o) => o.key);

  const updateSentence = (index: number, patch: Partial<HskMatchSentence>) => {
    const next = [...sentences];
    next[index] = { ...next[index], ...patch };
    onSentencesChange(next);
  };

  const removeSentence = (index: number) => {
    const removed = sentences[index];
    const next = sentences.filter((_, i) => i !== index);
    onSentencesChange(next);
    const nextPairings = { ...pairings };
    for (const [imageKey, sentenceKey] of Object.entries(nextPairings)) {
      if (sentenceKey === removed.key) {
        nextPairings[imageKey] = '';
      }
    }
    onPairingsChange(nextPairings);
  };

  const addSentence = () => {
    onSentencesChange([
      ...sentences,
      { key: `s${sentences.length + 1}`, text: '', pinyin: '' },
    ]);
  };

  const updatePairing = (imageKey: string, value: string) => {
    const next = { ...pairings, [imageKey]: value as string | 'distractor' | '' };
    onPairingsChange(next);
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

      <div className="hsk-question-r01-sentence-panel">
        <label className="hsk-question-r01-col-label">
          句子 <span className="required">*</span>
        </label>
        <div className="hsk-question-r01-sentence-list">
          {sentences.map((sentence, idx) => (
            <div key={`${sentence.key}-${idx}`} className="hsk-question-r01-sentence-row">
              <span className="hsk-question-r01-sentence-key">{sentence.key}</span>
              <input
                type="text"
                value={sentence.text}
                onChange={(e) => updateSentence(idx, { text: e.target.value })}
                placeholder="句子文字"
                className="hsk-question-r01-sentence-text"
              />
              {showPinyin && (
                <PinyinCountInput
                  value={sentence.pinyin ?? ''}
                  onChange={(v) => updateSentence(idx, { pinyin: v })}
                  targetHanCount={countHanInText(sentence.text)}
                  targetText={sentence.text}
                  placeholder="词级：xiaoyu jintian；字级：xiao yu jin tian"
                  className="hsk-question-r03-sentence-pinyin-input"
                />
              )}
              <button
                type="button"
                className="hsk-question-edit-text-option-remove"
                onClick={() => removeSentence(idx)}
                aria-label={`删除句子 ${sentence.key}`}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addSentence}>
            + 添加句子
          </button>
        </div>
      </div>

      <div className="hsk-question-r01-pairing-section">
        <label className="hsk-question-r01-pairing-title">配对设置</label>
        <p className="hsk-question-r01-pairing-hint">
          每张图片选择其匹配的句子；多余图片为干扰项
        </p>
        <div className="hsk-question-r01-pairing-list">
          {imageKeys.map((imageKey) => (
            <div key={imageKey} className="hsk-question-r01-pairing-row">
              <span className="hsk-question-r01-pairing-image">{imageKey}</span>
              <label>匹配句子：</label>
              <select
                value={pairings[imageKey] ?? ''}
                onChange={(e) => updatePairing(imageKey, e.target.value)}
              >
                <option value="">— 不匹配 —</option>
                {sentences.map((sentence) => (
                  <option key={sentence.key} value={sentence.key}>
                    {sentence.key}
                    {sentence.text ? ` · ${sentence.text}` : ''}
                  </option>
                ))}
                <option value="distractor">— 干扰项（不参与配对）—</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
