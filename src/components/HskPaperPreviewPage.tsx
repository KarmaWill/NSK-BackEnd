import { useMemo, useState } from 'react';
import { HskQuestionEditPreview } from './HskQuestionEditPreview';
import { HskTabletPreviewFrame } from './HskTabletPreviewFrame';
import type {
  HskComposedPaper,
  HskPaperSlot,
  HskPaperTemplate,
  HskQuestionRow,
  HskQuestionTypeDef,
} from '../types/hskExams';
import { countFilledSlots, countScoringSlots } from '../utils/hskPaperUtils';

type SectionSummary = {
  id: string;
  name: string;
  filled: number;
  total: number;
};

type FlatQuestion = {
  slot: HskPaperSlot;
  question: HskQuestionRow;
  sectionId: string;
  sectionName: string;
};

type Props = {
  paper: HskComposedPaper;
  template?: HskPaperTemplate;
  questions: HskQuestionRow[];
  typeDefs: HskQuestionTypeDef[];
  compileWarning?: string | null;
  onBack: () => void;
};

function buildSections(slots: HskPaperSlot[]): SectionSummary[] {
  const sections: SectionSummary[] = [];
  const seen = new Set<string>();
  for (const slot of slots.filter((s) => !s.isExample)) {
    if (seen.has(slot.sectionId)) continue;
    seen.add(slot.sectionId);
    const secSlots = slots.filter((s) => !s.isExample && s.sectionId === slot.sectionId);
    sections.push({
      id: slot.sectionId,
      name: slot.sectionName,
      total: secSlots.length,
      filled: secSlots.filter((s) => s.questionId).length,
    });
  }
  return sections;
}

function categoryClass(section?: string): string {
  if (section === 'listening') return 'is-listening';
  if (section === 'reading') return 'is-reading';
  if (section === 'writing') return 'is-writing';
  return '';
}

export function HskPaperPreviewPage({
  paper,
  template,
  questions,
  typeDefs,
  compileWarning,
  onBack,
}: Props) {
  const [currentQIdx, setCurrentQIdx] = useState(0);

  const sections = useMemo(() => buildSections(paper.slots), [paper.slots]);

  const flatQuestions = useMemo(() => {
    const items: FlatQuestion[] = [];
    for (const slot of paper.slots) {
      if (slot.isExample || !slot.questionId) continue;
      const question = questions.find((q) => q.question_uid === slot.questionId);
      if (!question) continue;
      items.push({
        slot,
        question,
        sectionId: slot.sectionId,
        sectionName: slot.sectionName,
      });
    }
    return items;
  }, [paper.slots, questions]);

  const scoringTotal = countScoringSlots(paper.slots);
  const filledTotal = countFilledSlots(paper.slots);
  const safeIdx = flatQuestions.length > 0 ? Math.min(currentQIdx, flatQuestions.length - 1) : 0;
  const currentItem = flatQuestions[safeIdx];
  const currentTypeDef = currentItem
    ? typeDefs.find((t) => t.id === currentItem.question.type_id)
    : undefined;

  const goNext = () => {
    if (safeIdx < flatQuestions.length - 1) setCurrentQIdx(safeIdx + 1);
  };

  const goPrev = () => {
    if (safeIdx > 0) setCurrentQIdx(safeIdx - 1);
  };

  return (
    <div className="hsk-paper-preview-page">
      <div className="hsk-paper-preview-header">
        <div className="hsk-paper-preview-header-left">
          <button type="button" className="hsk-paper-preview-back" onClick={onBack}>
            ← 返回列表
          </button>
          <div>
            <h1 className="hsk-paper-preview-heading">试卷预览</h1>
            <p className="hsk-paper-preview-subheading">
              {paper.name}
              <span className="hsk-paper-preview-level">{paper.level}</span>
            </p>
          </div>
        </div>
        <div className="hsk-paper-preview-meta">
          <span>⏱ {paper.duration ?? template?.totalDuration ?? 0} 分钟</span>
          <span>📊 {paper.totalScore} 分</span>
          <span>📝 {flatQuestions.length} 题</span>
          <span
            className={`hsk-paper-preview-status${paper.status === 'published' ? ' is-published' : ''}`}
          >
            {paper.status === 'published' ? '已发布' : '草稿'}
          </span>
        </div>
      </div>

      {compileWarning && (
        <div className="hsk-paper-preview-warning">{compileWarning}</div>
      )}

      {filledTotal < scoringTotal && !compileWarning && (
        <div className="hsk-paper-preview-warning is-muted">
          已选题 {filledTotal}/{scoringTotal}，预览仅展示已填题目
        </div>
      )}

      <HskTabletPreviewFrame>
        <div className="hsk-paper-preview-tablet-inner">
          <div className="hsk-paper-preview-sections">
            {sections.map((sec) => {
              const isCurrent = currentItem?.sectionId === sec.id;
              return (
                <div
                  key={sec.id}
                  className={`hsk-paper-preview-section-pill${isCurrent ? ' is-active' : ''}`}
                >
                  {sec.name} ({sec.filled}题)
                </div>
              );
            })}
          </div>

          {currentItem ? (
            <div className="hsk-paper-preview-question">
              <div className="hsk-paper-preview-question-head">
                <div className="hsk-paper-preview-question-head-left">
                  <span className="hsk-paper-preview-qnum">{safeIdx + 1}</span>
                  <span className="hsk-paper-preview-qmeta">
                    {currentItem.sectionName} · {currentItem.slot.scorePerQuestion} 分
                  </span>
                </div>
                {currentTypeDef && (
                  <span
                    className={`hsk-paper-preview-type-badge ${categoryClass(currentTypeDef.section)}`}
                  >
                    {currentTypeDef.id} {currentTypeDef.name}
                  </span>
                )}
              </div>
              <div className="hsk-paper-preview-question-body">
                <HskQuestionEditPreview
                  question={currentItem.question}
                  typeDef={currentTypeDef}
                  embedded
                />
              </div>
            </div>
          ) : (
            <div className="hsk-paper-preview-empty">
              <div className="hsk-paper-preview-empty-icon">📋</div>
              <p>暂无已填题目</p>
              <p className="muted">请先在组卷编辑中从题库选题</p>
            </div>
          )}
        </div>
      </HskTabletPreviewFrame>

      {flatQuestions.length > 0 && (
        <>
          <div className="hsk-paper-preview-nav">
            <button
              type="button"
              className="hsk-paper-preview-nav-btn"
              disabled={safeIdx === 0}
              onClick={goPrev}
            >
              ← 上一题
            </button>
            <span className="hsk-paper-preview-nav-count">
              {safeIdx + 1} / {flatQuestions.length}
            </span>
            <button
              type="button"
              className="hsk-paper-preview-nav-btn"
              disabled={safeIdx >= flatQuestions.length - 1}
              onClick={goNext}
            >
              下一题 →
            </button>
          </div>

          <div className="hsk-paper-preview-jump-card">
            <h3>快速跳转</h3>
            <div className="hsk-paper-preview-jump-grid">
              {flatQuestions.map((item, i) => (
                <button
                  key={item.slot.globalIndex}
                  type="button"
                  className={`hsk-paper-preview-jump-btn${i === safeIdx ? ' is-active' : ''}`}
                  title={`${item.sectionName} — ${item.question.question_uid}`}
                  onClick={() => setCurrentQIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
