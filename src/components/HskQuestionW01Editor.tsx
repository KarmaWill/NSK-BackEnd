import type { HskW01ComponentPart, HskW01WordMatch } from '../utils/hskW01ComponentMatch';

type Props = {
  componentParts: HskW01ComponentPart[];
  wordMatches: HskW01WordMatch[];
  onComponentPartsChange: (next: HskW01ComponentPart[]) => void;
  onWordMatchesChange: (next: HskW01WordMatch[]) => void;
};

export function HskQuestionW01Editor({
  componentParts,
  wordMatches,
  onComponentPartsChange,
  onWordMatchesChange,
}: Props) {
  const canAddPart = componentParts.length < 8;
  const canRemovePart = componentParts.length > 2;

  const updatePart = (index: number, text: string) => {
    const next = [...componentParts];
    next[index] = { ...next[index], text };
    onComponentPartsChange(next);
  };

  const removePart = (index: number) => {
    if (!canRemovePart) return;
    onComponentPartsChange(componentParts.filter((_, i) => i !== index));
  };

  const addPart = () => {
    if (!canAddPart) return;
    onComponentPartsChange([
      ...componentParts,
      { key: String.fromCharCode(65 + componentParts.length), text: '' },
    ]);
  };

  const updateMatch = (index: number, patch: Partial<HskW01WordMatch>) => {
    const next = [...wordMatches];
    next[index] = { ...next[index], ...patch };
    onWordMatchesChange(next);
  };

  const removeMatch = (index: number) => {
    if (wordMatches.length <= 1) return;
    onWordMatchesChange(wordMatches.filter((_, i) => i !== index));
  };

  const addMatch = () => {
    onWordMatchesChange([
      ...wordMatches,
      {
        id: `m${wordMatches.length + 1}`,
        incomplete: '',
        incompletePinyin: '',
        word: '',
        pinyin: '',
        componentKey: componentParts[0]?.key ?? 'A',
      },
    ]);
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>⿂</span>
          <h3>部件选项</h3>
        </div>
      </div>

      <div className="hsk-question-w01-parts-wrap">
        {componentParts.map((part, idx) => (
          <div key={`${part.key}-${idx}`} className="hsk-question-w01-part-chip-row">
            <span className="hsk-question-w01-part-chip-key">{part.key}.</span>
            <input
              type="text"
              value={part.text}
              onChange={(e) => updatePart(idx, e.target.value)}
              placeholder="偏旁/部件"
              className="hsk-question-w01-part-chip-input"
            />
            {canRemovePart && (
              <button
                type="button"
                className="hsk-question-w01-part-chip-remove"
                aria-label={`移除部件 ${part.key}`}
                onClick={() => removePart(idx)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {canAddPart && (
          <button type="button" className="hsk-question-w01-add-part-btn" onClick={addPart}>
            + 添加部件
          </button>
        )}
      </div>

      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>🔗</span>
          <h3>词语匹配</h3>
        </div>
      </div>

      <div className="hsk-question-w01-match-list">
        {wordMatches.map((match, idx) => (
          <div key={`${match.id}-${idx}`} className="hsk-question-w01-match-row">
            <span className="hsk-question-w01-match-arrow" aria-hidden>
              →
            </span>
            <input
              type="text"
              value={match.incomplete}
              onChange={(e) => updateMatch(idx, { incomplete: e.target.value })}
              placeholder="不完整词语，如：丁车"
              className="hsk-question-w01-match-incomplete"
            />
            <input
              type="text"
              value={match.word}
              onChange={(e) => updateMatch(idx, { word: e.target.value })}
              placeholder="完整词语"
              className="hsk-question-w01-match-word"
            />
            <input
              type="text"
              value={match.pinyin}
              onChange={(e) => updateMatch(idx, { pinyin: e.target.value })}
              placeholder="拼音"
              className="hsk-question-w01-match-pinyin"
            />
            <select
              value={match.componentKey}
              onChange={(e) => updateMatch(idx, { componentKey: e.target.value })}
              className="hsk-question-w01-match-select"
              aria-label="选择部件"
            >
                <option value="">选择部件</option>
                {componentParts.map((part) => (
                  <option key={part.key} value={part.key}>
                    {part.key}. {part.text || '—'}
                  </option>
                ))}
            </select>
            {wordMatches.length > 1 && (
              <button
                type="button"
                className="hsk-question-w01-match-remove"
                aria-label="删除词语匹配"
                onClick={() => removeMatch(idx)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addMatch}>
          + 添加词语
        </button>
      </div>
    </>
  );
}
