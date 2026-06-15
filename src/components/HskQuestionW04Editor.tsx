type Props = {
  topic: string;
  keyword: string;
  minWords: number;
  onTopicChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onMinWordsChange: (value: number) => void;
};

export function HskQuestionW04Editor({
  topic,
  keyword,
  minWords,
  onTopicChange,
  onKeywordChange,
  onMinWordsChange,
}: Props) {
  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>📝</span>
          <h3>短文写作设定</h3>
        </div>
      </div>

      <div className="hsk-question-w04-body">
        <div className="form-group">
          <label>
            主题 / 题目 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="如：我的周末"
          />
        </div>

        <div className="form-group">
          <label>关键词</label>
          <span className="hsk-question-r02-block-hint">多个关键词用逗号分隔，如：周末,朋友,旅游</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="周末,朋友,旅游"
          />
        </div>

        <div className="form-group">
          <label>
            最低字数 <span className="required">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={minWords}
            onChange={(e) => onMinWordsChange(Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </>
  );
}
