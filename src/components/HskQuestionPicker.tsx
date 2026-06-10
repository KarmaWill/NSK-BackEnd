import { useMemo, useState } from 'react';
import { getSectionName } from '../config/hskQuestionTypes';
import type { HskPaperSlot, HskQuestionRow, HskQuestionTypeCode } from '../types/hskExams';

type Props = {
  open: boolean;
  slot: HskPaperSlot | null;
  questions: HskQuestionRow[];
  onClose: () => void;
  onSelect: (question: HskQuestionRow) => void;
};

export function HskQuestionPicker({ open, slot, questions, onClose, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const filtered = useMemo(() => {
    if (!slot) return [];
    return questions.filter((q) => {
      if (q.type_id !== slot.questionType) return false;
      if (levelFilter && q.level !== levelFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return q.question_uid.toLowerCase().includes(s) || q.stem.toLowerCase().includes(s);
    });
  }, [questions, slot, search, levelFilter]);

  if (!open || !slot) return null;

  const needCount = 1;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="题库选择">
      <div
        className="modal hsk-question-picker"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, marginLeft: 'auto', marginRight: 0, height: '100vh', maxHeight: '100vh', borderRadius: 0 }}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title">题库选择</div>
            <div className="form-hint" style={{ marginTop: 4 }}>
              {slot.sectionName} · {slot.questionType} · 需 {needCount} 题
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body" style={{ flex: 1, overflow: 'auto' }}>
          <div className="paper-filter-bar" style={{ marginBottom: 12 }}>
            <div className="filter-group">
              <input
                type="text"
                className="search-input"
                placeholder="搜索题目 ID 或题干…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option value="">全部级别</option>
                {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 ? (
              <div className="form-hint" style={{ textAlign: 'center', padding: 24 }}>暂无匹配题目</div>
            ) : (
              filtered.map((q) => (
                <button
                  key={q.question_uid}
                  type="button"
                  className="card"
                  style={{ textAlign: 'left', cursor: 'pointer', padding: 12 }}
                  onClick={() => onSelect(q)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span className="paper-id">{q.question_uid}</span>
                    <span className={`section-badge section-badge-${q.type_id.startsWith('L') ? 'listening' : q.type_id.startsWith('R') ? 'reading' : 'writing'}`}>
                      {getSectionName(q.type_id.startsWith('L') ? 'listening' : q.type_id.startsWith('R') ? 'reading' : 'writing')}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{q.stem}</div>
                  <div className="form-hint" style={{ marginTop: 6 }}>
                    {q.level} · {q.status === 'published' ? '已发布' : '草稿'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function questionMatchesSlot(question: HskQuestionRow, slot: HskPaperSlot) {
  return question.type_id === (slot.questionType as HskQuestionTypeCode);
}
