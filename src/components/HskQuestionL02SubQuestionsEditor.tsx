import type { HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';

type Props = {
  subQuestions: HskSubQuestionPayload[];
  imageOptions: HskRuntimeOption[];
  onChange: (next: HskSubQuestionPayload[]) => void;
  onPairingsChange: (pairings: Record<string, string | 'distractor' | ''>) => void;
  pairings: Record<string, string | 'distractor' | ''>;
};

function subDisplayId(sub: HskSubQuestionPayload, index: number): string {
  return `sq${sub.id ?? index + 1}`;
}

export function HskQuestionL02SubQuestionsEditor({
  subQuestions,
  imageOptions,
  onChange,
  onPairingsChange,
  pairings,
}: Props) {
  const imageKeys = imageOptions.map((o) => o.key);

  const addSubQuestion = () => {
    onChange([
      ...subQuestions,
      {
        id: subQuestions.length + 1,
        question: '',
        answer: imageKeys[0] ?? 'A',
        score: 1,
      },
    ]);
  };

  const updateSub = (index: number, patch: Partial<HskSubQuestionPayload>) => {
    const next = [...subQuestions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeSub = (index: number) => {
    const removedId = subDisplayId(subQuestions[index], index);
    const next = subQuestions.filter((_, i) => i !== index);
    onChange(next);
    const nextPairings = { ...pairings };
    for (const [imageKey, subId] of Object.entries(nextPairings)) {
      if (subId === removedId) {
        nextPairings[imageKey] = '';
      }
    }
    onPairingsChange(nextPairings);
  };

  const updatePairing = (imageKey: string, value: string) => {
    onPairingsChange({
      ...pairings,
      [imageKey]: value as string | 'distractor' | '',
    });
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📝</span>
          <h3>子题目 / 文本配置</h3>
        </div>
        <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addSubQuestion}>
          + 添加子题目
        </button>
      </div>

      <div className="hsk-question-r01-split">
        <div className="hsk-question-r01-split-col">
          <label className="hsk-question-r01-col-label">图片</label>
          <div className="hsk-question-r01-image-list">
            {imageOptions.map((opt) => (
              <div key={opt.key} className="hsk-question-r01-compact-image">
                <span className="hsk-question-r01-compact-image-key">{opt.key}</span>
                {opt.image ? (
                  <img src={opt.image} alt={opt.text || opt.key} />
                ) : (
                  <div className="hsk-question-r01-compact-image-placeholder">
                    <span aria-hidden>🖼</span>
                    <span>点击选择图片</span>
                    <span className="is-pending">⏳ 待配图</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hsk-question-r01-split-col">
          <label className="hsk-question-r01-col-label">
            子题目 <span className="required">*</span>
          </label>
          <div className="hsk-question-r01-sentence-list">
            {subQuestions.map((sub, idx) => (
              <div key={`${sub.id ?? idx}-${idx}`} className="hsk-question-l02-sub-row">
                <span className="hsk-question-r01-sentence-key">{subDisplayId(sub, idx)}</span>
                <input
                  type="text"
                  value={sub.question ?? ''}
                  onChange={(e) => updateSub(idx, { question: e.target.value })}
                  placeholder="问题内容（选填）"
                  className="hsk-question-r01-sentence-text"
                />
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={sub.score}
                  onChange={(e) => updateSub(idx, { score: Number(e.target.value) || 1 })}
                  className="hsk-question-l02-sub-score"
                  title="本题分值"
                />
                <button
                  type="button"
                  className="hsk-question-edit-text-option-remove"
                  onClick={() => removeSub(idx)}
                  aria-label={`删除子题 ${idx + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hsk-question-r01-pairing-section">
        <label className="hsk-question-r01-pairing-title">配对设置</label>
        <p className="hsk-question-r01-pairing-hint">
          每张图片选择其匹配的子题目；多余图片为干扰项
        </p>
        <div className="hsk-question-r01-pairing-list">
          {imageKeys.map((imageKey) => (
            <div key={imageKey} className="hsk-question-r01-pairing-row">
              <span className="hsk-question-r01-pairing-image">{imageKey}</span>
              <label>匹配子题：</label>
              <select
                value={pairings[imageKey] ?? ''}
                onChange={(e) => updatePairing(imageKey, e.target.value)}
              >
                <option value="">— 不匹配 —</option>
                {subQuestions.map((sub, idx) => {
                  const id = subDisplayId(sub, idx);
                  return (
                    <option key={id} value={id}>
                      {id}
                      {sub.question ? ` · ${sub.question}` : ''}
                    </option>
                  );
                })}
                <option value="distractor">— 干扰项（不参与配对）—</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
