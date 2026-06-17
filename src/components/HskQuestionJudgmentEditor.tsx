import type { HskQuestionTypeCode } from '../types/hskExams';
import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import { JUDGMENT_TF_OPTIONS } from '../utils/hskJudgmentQuestions';

type Props = {
  typeId: HskQuestionTypeCode;
  correctAnswer: string;
  sentence?: string;
  sentencePinyin?: string;
  levelNumber: number;
  showPinyinFields?: boolean;
  onCorrectAnswerChange: (value: string) => void;
  onSentenceChange?: (value: string) => void;
  onSentencePinyinChange?: (value: string) => void;
};

export function HskQuestionJudgmentEditor({
  typeId,
  correctAnswer,
  sentence = '',
  sentencePinyin = '',
  levelNumber,
  showPinyinFields = false,
  onCorrectAnswerChange,
  onSentenceChange,
  onSentencePinyinChange,
}: Props) {
  const isR08 = typeId === 'R08';
  const showPinyin = isR08 && (levelNumber <= 2 || showPinyinFields);

  return (
    <>
      {isR08 && (
        <>
          <div className="hsk-question-edit-section-divider" />
          <div className="hsk-question-edit-section-head">
            <div className="hsk-question-edit-section-head-main">
              <span aria-hidden>📝</span>
              <h3>句子 / 文本配置</h3>
            </div>
          </div>

          <div className="hsk-question-judgment-sentence-section">
            <div className="form-group">
              <label>
                判断句 <span className="required">*</span>
              </label>
              <input
                type="text"
                value={sentence}
                onChange={(e) => onSentenceChange?.(e.target.value)}
                placeholder="句子文字（词间空格分词，如：小雨 今天 去 吃）"
              />
            </div>
            {showPinyin && (
              <div className="form-group">
                <label>
                  拼音 <span className="required">*</span>
                </label>
                <PinyinCountInput
                  value={sentencePinyin}
                  onChange={(v) => onSentencePinyinChange?.(v)}
                  targetHanCount={countHanInText(sentence)}
                  targetText={sentence}
                  placeholder="词级：xiaoyu jintian qu chi；字级：xiao yu jin tian"
                  className="hsk-question-r03-sentence-pinyin-input"
                />
              </div>
            )}
          </div>
        </>
      )}

      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>✓</span>
          <h3>判断选项</h3>
        </div>
      </div>

      <div className="hsk-question-judgment-body">
        <div className="hsk-question-judgment-answer-section">
          <label className="hsk-question-judgment-answer-label">
            正确答案 <span className="required">*</span>
          </label>
          <div className="hsk-question-judgment-answer-options">
            {JUDGMENT_TF_OPTIONS.map((opt) => {
              const isTrue = opt.key === 'A';
              const active = correctAnswer === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`hsk-question-judgment-answer-btn${isTrue ? ' is-true' : ' is-false'}${active ? ' is-active' : ''}`}
                  onClick={() => onCorrectAnswerChange(opt.key)}
                >
                  <span className="hsk-question-judgment-answer-main">
                    {isTrue ? '✓ 对' : '✗ 错'}
                  </span>
                  <span className="hsk-question-judgment-answer-key">({isTrue ? '✓' : '✗'})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
