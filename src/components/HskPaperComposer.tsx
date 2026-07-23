import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HskQuestionEditPreview } from './HskQuestionEditPreview';
import type {
  HskComposedPaper,
  HskPaperSlot,
  HskPaperTemplate,
  HskQuestionRow,
  HskQuestionTypeDef,
  HskSectionModule,
} from '../types/hskExams';
import { assignQuestionNumbers, calcPaperScore } from '../utils/hskPaperUtils';
import { isQuestionCandidate } from '../utils/hskPhaseOneScope';

const MODULE_ICONS: Record<HskSectionModule, string> = {
  listening: '🎧',
  reading: '📖',
  writing: '✍️',
};

type OutlineSection = {
  id: string;
  name: string;
  questionType: string;
  secFilled: number;
  secTotal: number;
  slots: HskPaperSlot[];
};

type OutlineModule = {
  id: HskSectionModule;
  name: string;
  modFilled: number;
  modTotal: number;
  sections: OutlineSection[];
};

type ViewMode = 'outline' | 'select' | 'preview';

type Props = {
  paper: HskComposedPaper;
  template?: HskPaperTemplate;
  questions: HskQuestionRow[];
  typeDefs: HskQuestionTypeDef[];
  compileError?: string | null;
  busyAction?: 'save' | 'publish' | null;
  onBack: () => void;
  onChange: (paper: HskComposedPaper) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

function buildOutline(slots: HskPaperSlot[]): OutlineModule[] {
  const scoring = slots.filter((s) => !s.isExample);
  const modules = new Map<HskSectionModule, OutlineModule>();

  for (const slot of scoring) {
    let mod = modules.get(slot.moduleId);
    if (!mod) {
      mod = {
        id: slot.moduleId,
        name: slot.moduleName,
        modFilled: 0,
        modTotal: 0,
        sections: [],
      };
      modules.set(slot.moduleId, mod);
    }
    mod.modTotal += 1;
    if (slot.questionId) mod.modFilled += 1;

    let sec = mod.sections.find((s) => s.id === slot.sectionId);
    if (!sec) {
      sec = {
        id: slot.sectionId,
        name: slot.sectionName,
        questionType: slot.questionType,
        secFilled: 0,
        secTotal: 0,
        slots: [],
      };
      mod.sections.push(sec);
    }
    sec.secTotal += 1;
    if (slot.questionId) sec.secFilled += 1;
    sec.slots.push(slot);
  }

  const order: HskSectionModule[] = ['listening', 'reading', 'writing'];
  return order.filter((id) => modules.has(id)).map((id) => modules.get(id)!);
}

function slotStats(slots: HskPaperSlot[]) {
  const scoring = slots.filter((s) => !s.isExample);
  const filled = scoring.filter((s) => s.questionId).length;
  const total = scoring.length;
  const totalScore = scoring.reduce((sum, s) => sum + (s.questionId ? s.scorePerQuestion : 0), 0);
  const maxScore = scoring.reduce((sum, s) => sum + s.scorePerQuestion, 0);
  return { filled, total, totalScore, maxScore };
}

function StatusDot({ filled, total }: { filled: number; total: number }) {
  if (total === 0 || filled === 0) return <span className="hsk-composer-dot is-empty">○</span>;
  if (filled < total) return <span className="hsk-composer-dot is-partial">⚠</span>;
  return <span className="hsk-composer-dot is-done">✓</span>;
}

export function HskPaperComposer({
  paper,
  template,
  questions,
  typeDefs,
  compileError,
  busyAction = null,
  onBack,
  onChange,
  onSaveDraft,
  onPublish,
}: Props) {
  const isPublished = paper.status === 'published';
  const isBusy = busyAction !== null;
  const stats = useMemo(() => slotStats(paper.slots), [paper.slots]);
  const outline = useMemo(() => buildOutline(paper.slots), [paper.slots]);

  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('outline');
  const [slotSearch, setSlotSearch] = useState('');
  const composerBodyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const composerBody = composerBodyRef.current as (HTMLDivElement & { inert: boolean }) | null;
    if (composerBody) composerBody.inert = isBusy;
  }, [isBusy]);

  const activeSlot = activeSlotIndex != null ? paper.slots[activeSlotIndex] ?? null : null;
  const activeQuestion = activeSlot?.questionId
    ? questions.find((q) => q.question_uid === activeSlot.questionId)
    : undefined;
  const activeTypeDef = activeSlot
    ? typeDefs.find((t) => t.id === activeSlot.questionType)
    : undefined;

  const usedQuestionIds = useMemo(
    () => paper.slots.map((s) => s.questionId).filter(Boolean) as string[],
    [paper.slots],
  );

  const candidateQuestions = useMemo(() => {
    if (!activeSlot) return [];
    const groupSlots = paper.slots.filter((slot) =>
      slot.sectionId === activeSlot.sectionId && slot.groupIndex === activeSlot.groupIndex);
    const q = slotSearch.trim().toLowerCase();
    return questions.filter((row) => {
      if (!isQuestionCandidate({
        question: row,
        level: String(paper.level),
        questionType: activeSlot.questionType,
        isExample: activeSlot.isExample,
        isCompound: activeSlot.isCompound,
        expectedScoringCount: activeSlot.isCompound
          ? groupSlots.filter((slot) => !slot.isExample).length
          : undefined,
        expectedExampleCount: activeSlot.isCompound
          ? groupSlots.filter((slot) => slot.isExample).length
          : undefined,
      })) return false;
      if (usedQuestionIds.includes(row.question_uid) && row.question_uid !== activeSlot.questionId) {
        return false;
      }
      if (!q) return true;
      return (
        row.question_uid.toLowerCase().includes(q) ||
        row.stem.toLowerCase().includes(q)
      );
    });
  }, [activeSlot, paper.level, questions, slotSearch, usedQuestionIds]);

  const selectSlot = (slot: HskPaperSlot) => {
    setActiveSlotIndex(slot.globalIndex);
    if (slot.questionId) {
      setViewMode('preview');
      setSlotSearch('');
    } else {
      setViewMode('select');
      setSlotSearch('');
    }
  };

  const assignQuestion = (globalIndex: number, question: HskQuestionRow) => {
    const target = paper.slots.find((slot) => slot.globalIndex === globalIndex);
    const compoundSlots = target?.isCompound
      ? paper.slots
          .filter((slot) => slot.sectionId === target.sectionId && slot.groupIndex === target.groupIndex)
          .sort((a, b) => a.globalIndex - b.globalIndex)
      : [];
    const sourceSubIds = (question.payload?.subQuestions ?? []).map((subQuestion) =>
      subQuestion.id == null ? null : String(subQuestion.id));
    const slots = paper.slots.map((slot) => {
      const sameCompoundGroup = target?.isCompound
        && slot.sectionId === target.sectionId
        && slot.groupIndex === target.groupIndex;
      if (slot.globalIndex !== globalIndex && !sameCompoundGroup) return slot;
      const compoundIndex = compoundSlots.findIndex((candidate) => candidate.globalIndex === slot.globalIndex);
      return {
        ...slot,
        questionId: question.question_uid,
        sourceSubId: target?.isCompound ? (sourceSubIds[compoundIndex] ?? null) : null,
      };
    });
    onChange({
      ...paper,
      slots: assignQuestionNumbers(slots),
      totalScore: calcPaperScore(slots),
    });
    setViewMode('preview');
  };

  const clearSlot = (globalIndex: number) => {
    const target = paper.slots.find((slot) => slot.globalIndex === globalIndex);
    const slots = paper.slots.map((slot) => {
      const sameCompoundGroup = target?.isCompound
        && slot.sectionId === target.sectionId
        && slot.groupIndex === target.groupIndex;
      return slot.globalIndex === globalIndex || sameCompoundGroup
        ? { ...slot, questionId: null, sourceSubId: null }
        : slot;
    });
    onChange({
      ...paper,
      slots: assignQuestionNumbers(slots),
      totalScore: calcPaperScore(slots),
    });
    setViewMode('select');
  };

  const centerTitle =
    viewMode === 'select' ? '选题面板' : viewMode === 'preview' ? '题目预览' : '试卷实时预览';

  return (
    <div
      className={`hsk-paper-composer${isBusy ? ' is-busy' : ''}`}
      aria-busy={isBusy}
    >
      <header className="hsk-paper-composer-topbar">
        <div className="hsk-paper-composer-topbar-left">
          <button type="button" className="hsk-paper-composer-back" disabled={isBusy} onClick={onBack}>
            ← 返回
          </button>
          <code className="hsk-paper-composer-code">{paper.id}</code>
          <span className="hsk-paper-composer-level">{paper.level}</span>
          <span className="hsk-paper-composer-name">{paper.name}</span>
        </div>
        <div className="hsk-paper-composer-topbar-right">
          <span className="hsk-paper-composer-stat">
            已配 <strong>{stats.filled}</strong>/{stats.total} 题
          </span>
          <span className="hsk-paper-composer-stat">
            总分 <strong>{stats.totalScore}</strong>/{stats.maxScore} 分
          </span>
          {isPublished && <span className="hsk-paper-composer-readonly">已发布 · 只读</span>}
          <button
            type="button"
            className="hsk-paper-composer-btn-secondary"
            disabled={isPublished || isBusy}
            onClick={onSaveDraft}
          >
            {busyAction === 'save' ? '保存中...' : '保存草稿'}
          </button>
          <button
            type="button"
            className={`hsk-paper-composer-btn-primary${isPublished ? ' is-disabled' : ''}`}
            disabled={isPublished || isBusy}
            onClick={onPublish}
          >
            {isPublished ? '已发布' : busyAction === 'publish' ? '发布中...' : '发布'}
          </button>
        </div>
      </header>

      {compileError && !isPublished && (
        <div className="hsk-paper-composer-banner-error">{compileError}</div>
      )}

      <div ref={composerBodyRef} className="hsk-paper-composer-body">
        {/* 左：大纲 */}
        <aside className="hsk-paper-composer-outline">
          <h3 className="hsk-paper-composer-panel-title">试卷大纲</h3>
          <div className="hsk-paper-composer-outline-tree">
            {outline.map((mod) => {
              const modCollapsed = collapsedModules[mod.id];
              return (
                <div key={mod.id} className="hsk-composer-mod">
                  <button
                    type="button"
                    className="hsk-composer-mod-head"
                    onClick={() =>
                      setCollapsedModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                    }
                  >
                    <span className={`hsk-composer-chevron${modCollapsed ? '' : ' is-open'}`}>›</span>
                    <span className="hsk-composer-mod-icon">{MODULE_ICONS[mod.id]}</span>
                    <span className="hsk-composer-mod-name">{mod.name}</span>
                    <span className="hsk-composer-mod-count">
                      {mod.modFilled}/{mod.modTotal}题
                    </span>
                    <StatusDot filled={mod.modFilled} total={mod.modTotal} />
                  </button>
                  {!modCollapsed && (
                    <div className="hsk-composer-sec-list">
                      {mod.sections.map((sec) => {
                        const secCollapsed = collapsedSections[sec.id];
                        return (
                          <div key={sec.id} className="hsk-composer-sec">
                            <div
                              className={`hsk-composer-sec-head${
                                activeSlot?.sectionId === sec.id && viewMode !== 'outline'
                                  ? ' is-active'
                                  : ''
                              }`}
                            >
                              <button
                                type="button"
                                className="hsk-composer-sec-toggle"
                                onClick={() =>
                                  setCollapsedSections((prev) => ({
                                    ...prev,
                                    [sec.id]: !prev[sec.id],
                                  }))
                                }
                              >
                                <span className={`hsk-composer-chevron sm${secCollapsed ? '' : ' is-open'}`}>
                                  ›
                                </span>
                              </button>
                              <button
                                type="button"
                                className="hsk-composer-sec-label"
                                onClick={() => {
                                  const first = sec.slots.find((s) => !s.questionId) ?? sec.slots[0];
                                  if (first) selectSlot(first);
                                }}
                              >
                                <span>{sec.name}</span>
                                <span className="hsk-composer-sec-type">{sec.questionType}</span>
                                <span className="hsk-composer-sec-count">
                                  {sec.secFilled}/{sec.secTotal}
                                </span>
                                <StatusDot filled={sec.secFilled} total={sec.secTotal} />
                              </button>
                            </div>
                            {!secCollapsed && (
                              <div className="hsk-composer-slot-list">
                                {sec.slots.map((slot) => {
                                  const filled = !!slot.questionId;
                                  const isActive = activeSlotIndex === slot.globalIndex;
                                  const q = filled
                                    ? questions.find((row) => row.question_uid === slot.questionId)
                                    : null;
                                  return (
                                    <button
                                      key={slot.globalIndex}
                                      type="button"
                                      className={`hsk-composer-slot${isActive ? ' is-active' : ''}${
                                        filled ? ' is-filled' : ''
                                      }`}
                                      onClick={() => selectSlot(slot)}
                                    >
                                      <span className="hsk-composer-slot-dot">
                                        {filled ? '●' : '○'}
                                      </span>
                                      <span className="hsk-composer-slot-label">
                                        {slot.questionNumber != null
                                          ? `${slot.questionNumber}. `
                                          : ''}
                                        {filled
                                          ? (q?.stem?.slice(0, 18) || slot.questionId) +
                                            ((q?.stem?.length ?? 0) > 18 ? '…' : '')
                                          : `空槽位 · ${slot.questionType}`}
                                      </span>
                                      {!filled && !isPublished && (
                                        <span className="hsk-composer-slot-add">＋</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* 中：预览 / 选题 */}
        <section className="hsk-paper-composer-center">
          <div className="hsk-paper-composer-center-head">
            <span>{centerTitle}</span>
            <span>
              {stats.filled}/{stats.total} 题已填
            </span>
          </div>
          <div className="hsk-paper-composer-center-body">
            {viewMode === 'select' && activeSlot && !isPublished && (
              <div className="hsk-composer-select-panel">
                <div className="hsk-composer-select-header">
                  <div className="hsk-composer-select-title">为槽位选择题目</div>
                  <div className="hsk-composer-select-meta">
                    <span className="hsk-composer-select-type">{activeSlot.questionType}</span>
                    <span>{activeSlot.sectionName}</span>
                  </div>
                </div>
                <input
                  type="search"
                  className="hsk-composer-select-search"
                  placeholder={`搜索 ${activeSlot.questionType} 类型题目...`}
                  value={slotSearch}
                  onChange={(e) => setSlotSearch(e.target.value)}
                />
                <div className="hsk-composer-candidate-list">
                  {candidateQuestions.length === 0 ? (
                    <div className="hsk-composer-candidate-empty">
                      <p>题库中暂无符合条件的 {activeSlot.questionType} 题目</p>
                    </div>
                  ) : (
                    candidateQuestions.slice(0, 50).map((q) => (
                      <button
                        key={q.question_uid}
                        type="button"
                        className="hsk-composer-candidate"
                        onClick={() => assignQuestion(activeSlot.globalIndex, q)}
                      >
                        <code>{q.question_uid}</code>
                        <span className="hsk-composer-candidate-stem">
                          {(q.stem || '').slice(0, 48)}
                          {(q.stem || '').length > 48 ? '…' : ''}
                        </span>
                        <span className="hsk-composer-candidate-level">{q.level}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {viewMode === 'preview' && activeSlot && activeQuestion && (
              <div className="hsk-composer-filled-preview">
                {!isPublished && (
                  <div className="hsk-composer-filled-actions">
                    <button
                      type="button"
                      className="hsk-composer-btn-clear"
                      onClick={() => clearSlot(activeSlot.globalIndex)}
                    >
                      从本卷移除
                    </button>
                    <button
                      type="button"
                      className="hsk-composer-btn-repick"
                      onClick={() => setViewMode('select')}
                    >
                      重新选题
                    </button>
                  </div>
                )}
                <HskQuestionEditPreview question={activeQuestion} typeDef={activeTypeDef} />
              </div>
            )}

            {viewMode === 'outline' && (
              <div className="hsk-composer-center-empty">
                <div className="hsk-composer-center-empty-icon">📋</div>
                <p>点击左侧大纲树中的题目节点查看预览</p>
                <p className="muted">或点击空槽位进入选题面板</p>
              </div>
            )}

            {viewMode === 'preview' && activeSlot && !activeQuestion && (
              <div className="hsk-composer-center-empty">
                <p>题目数据未找到，请重新选题</p>
                {!isPublished && (
                  <button
                    type="button"
                    className="hsk-paper-composer-btn-secondary"
                    onClick={() => setViewMode('select')}
                  >
                    手动选题
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 右：属性 */}
        <aside className="hsk-paper-composer-props">
          <h3 className="hsk-paper-composer-panel-title">属性配置</h3>
          {!activeSlot ? (
            <div className="hsk-composer-props-empty">
              <div>📌</div>
              <p>
                选择左侧大纲节点
                <br />
                查看和编辑属性
              </p>
            </div>
          ) : (
            <div className="hsk-composer-props-card">
              <h4>题目槽位</h4>
              <dl className="hsk-composer-props-list">
                <div>
                  <dt>题号</dt>
                  <dd>{activeSlot.questionNumber ?? '—'}</dd>
                </div>
                <div>
                  <dt>题型</dt>
                  <dd>{activeSlot.questionType}</dd>
                </div>
                <div>
                  <dt>部分</dt>
                  <dd>{activeSlot.sectionName}</dd>
                </div>
                <div>
                  <dt>分值</dt>
                  <dd>{activeSlot.scorePerQuestion} 分</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{activeSlot.questionId ? '已选题' : '空槽位'}</dd>
                </div>
                {activeQuestion && (
                  <>
                    <div>
                      <dt>题目 ID</dt>
                      <dd>
                        <code>{activeQuestion.question_uid}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>等级</dt>
                      <dd>{activeQuestion.level}</dd>
                    </div>
                    <div>
                      <dt>题干</dt>
                      <dd className="hsk-composer-props-stem">{activeQuestion.stem}</dd>
                    </div>
                  </>
                )}
              </dl>
              {template && (
                <p className="hsk-composer-props-template">
                  模板：{template.name}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
