import { useState } from 'react';

type Props = {
  keywords: string[];
  sampleAnswer: string;
  onKeywordsChange: (next: string[]) => void;
  onSampleAnswerChange: (value: string) => void;
};

export function HskQuestionW03Editor({
  keywords,
  sampleAnswer,
  onKeywordsChange,
  onSampleAnswerChange,
}: Props) {
  const [keywordDraft, setKeywordDraft] = useState('');

  const addKeyword = () => {
    const next = keywordDraft.trim();
    if (!next || keywords.includes(next)) return;
    onKeywordsChange([...keywords, next]);
    setKeywordDraft('');
  };

  const removeKeyword = (index: number) => {
    onKeywordsChange(keywords.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>✏️</span>
          <h3>看图造句设定</h3>
        </div>
      </div>

      <div className="hsk-question-w03-body">
        <div className="form-group">
          <label>关键词</label>
          {keywords.length > 0 && (
            <div className="hsk-question-w03-keyword-tags">
              {keywords.map((keyword, idx) => (
                <span key={`${keyword}-${idx}`} className="hsk-question-w03-keyword-tag">
                  {keyword}
                  <button
                    type="button"
                    className="hsk-question-w03-keyword-remove"
                    aria-label={`移除关键词 ${keyword}`}
                    onClick={() => removeKeyword(idx)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="hsk-question-w03-keyword-add-row">
            <input
              type="text"
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder="输入关键词后回车"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addKeyword}>
              添加
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>参考答案（示例）</label>
          <textarea
            rows={2}
            value={sampleAnswer}
            onChange={(e) => onSampleAnswerChange(e.target.value)}
            placeholder="提供一个参考例句…"
          />
        </div>
      </div>
    </>
  );
}
