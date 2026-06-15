import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import {
  buildCorrectAnswerFromKeys,
  orderKeysFromCorrectAnswer,
  rekeyR04Segments,
  type HskR04Segment,
} from '../utils/hskR04SentenceSort';

type Props = {
  segments: HskR04Segment[];
  correctAnswer: string;
  levelNumber: number;
  showPinyinFields?: boolean;
  onSegmentsChange: (next: HskR04Segment[]) => void;
  onCorrectAnswerChange: (next: string) => void;
};

export function HskQuestionR04SortEditor({
  segments,
  correctAnswer,
  levelNumber,
  showPinyinFields = false,
  onSegmentsChange,
  onCorrectAnswerChange,
}: Props) {
  const showPinyin = levelNumber <= 2 || showPinyinFields;
  const orderKeys = orderKeysFromCorrectAnswer(segments, correctAnswer);

  const updateSegment = (index: number, patch: Partial<HskR04Segment>) => {
    const next = [...segments];
    next[index] = { ...next[index], ...patch };
    onSegmentsChange(rekeyR04Segments(next));
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 2) return;
    onSegmentsChange(segments.filter((_, i) => i !== index));
  };

  const addSegment = () => {
    onSegmentsChange([
      ...segments,
      {
        id: `seg${segments.length + 1}`,
        key: String.fromCharCode(65 + segments.length),
        text: '',
        pinyin: '',
      },
    ]);
  };

  const appendKeyToOrder = (key: string) => {
    if (orderKeys.includes(key)) return;
    onCorrectAnswerChange(buildCorrectAnswerFromKeys(segments, [...orderKeys, key]));
  };

  const clearOrder = () => {
    onCorrectAnswerChange('');
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
              句子片段 <span className="required">*</span>
            </label>
            <span className="hsk-question-r02-block-hint">A~D 自动标号，展示时乱序</span>
          </div>
          <div className="hsk-question-r02-item-list">
            {segments.map((segment, idx) => (
              <div key={`${segment.id}-${idx}`} className="hsk-question-r02-item-row">
                <span className="hsk-question-r02-item-index">{segment.key}</span>
                <input
                  type="text"
                  value={segment.text}
                  onChange={(e) => updateSegment(idx, { text: e.target.value })}
                  placeholder="句子内容"
                  className="hsk-question-r02-item-text"
                />
                {showPinyin && (
                  <PinyinCountInput
                    value={segment.pinyin ?? ''}
                    onChange={(v) => updateSegment(idx, { pinyin: v })}
                    targetHanCount={countHanInText(segment.text)}
                    targetText={segment.text}
                    placeholder="词级：xiaoyu jintian；字级：xiao yu jin tian"
                    className="hsk-question-r03-sentence-pinyin-input"
                  />
                )}
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeSegment(idx)}
                  disabled={segments.length <= 2}
                  aria-label={`删除片段 ${segment.key}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="hsk-question-r02-add-btn" onClick={addSegment}>
            + 添加句子片段
          </button>
        </div>

        <div className="hsk-question-r04-order-section">
          <div className="hsk-question-r02-block-head">
            <label>正确排序</label>
            <button type="button" className="hsk-question-r04-order-clear" onClick={clearOrder}>
              清除
            </button>
          </div>
          <p className="hsk-question-r04-order-hint">点击字母按钮构建正确顺序</p>
          <div className="hsk-question-r04-order-keys">
            {segments.map((segment) => {
              const selected = orderKeys.includes(segment.key);
              return (
                <button
                  key={segment.id}
                  type="button"
                  className={`hsk-question-r04-order-key${selected ? ' is-selected' : ''}`}
                  onClick={() => appendKeyToOrder(segment.key)}
                  disabled={selected}
                >
                  {segment.key}
                </button>
              );
            })}
          </div>
          <div className="hsk-question-r04-order-result">
            {orderKeys.length > 0 ? (
              orderKeys.map((key, idx) => (
                <span key={`${key}-${idx}`} className="hsk-question-r04-order-chip">
                  {key}
                  {idx < orderKeys.length - 1 && (
                    <span className="hsk-question-r04-order-arrow" aria-hidden>
                      →
                    </span>
                  )}
                </span>
              ))
            ) : (
              <span className="hsk-question-r04-order-empty">尚未设置正确顺序</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
