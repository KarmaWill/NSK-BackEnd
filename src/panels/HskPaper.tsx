import { useEffect, useMemo, useRef, useState } from 'react';
import { HskPaperComposer } from '../components/HskPaperComposer';
import { HskPaperPreviewPage } from '../components/HskPaperPreviewPage';
import { useHskStore } from '../hooks/useHskStore';
import {
  syncQuestionBankLocalCache,
  syncTemplatesPapersLocalCache,
} from '../stores/hskExams';
import {
  createPaperFromTemplateApi,
  deletePaper as deletePaperApi,
  getPaperExamImpactCount,
  listPapers,
  listQuestions,
  listTemplates,
  listQuestionTypes,
  patchPaper,
  publishPaperApi,
  unpublishPaperApi,
} from '../services/assessmentExamBankApi';
import { decidePaperDelete } from '../utils/hskPaperDeleteDecision';
import { removePaperFromList, upsertPaperInList } from '../utils/hskPaperListState';
import type {
  HskComposedPaper,
  HskPaperTemplate,
  HskPublishStatus,
  HskQuestionRow,
  HskQuestionTypeDef,
} from '../types/hskExams';
import { validateDeliveryCompile } from '../utils/hskCompileDelivery';
import { countFilledSlots, countScoringSlots } from '../utils/hskPaperUtils';
import { isTemplateAvailableForPaper } from '../utils/hskPhaseOneScope';

type ListStep = 'list' | 'selectTemplate';

type DeleteModal = {
  paper: HskComposedPaper;
};

type PublishModal =
  | { type: 'incomplete'; paper: HskComposedPaper; emptySlots: number }
  | { type: 'unpublish'; paper: HskComposedPaper; linkedExams: number };

type PaperMutationAction = 'save' | 'publish' | 'unpublish' | 'delete';

type PendingPaperMutation = {
  paperId: string;
  action: PaperMutationAction;
};

let paperMutationInFlight = false;
let templateCreationInFlight = false;
let paperOperationCompletion: Promise<void> | null = null;
let resolvePaperOperation: (() => void) | null = null;

function startPaperOperation() {
  paperOperationCompletion = new Promise<void>((resolve) => {
    resolvePaperOperation = resolve;
  });
}

function finishPaperOperation() {
  resolvePaperOperation?.();
  resolvePaperOperation = null;
  paperOperationCompletion = null;
}

function formatPaperDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('zh-CN');
}

/** 展示用编号：兼容旧版 paper_xxx / paper-001 */
function formatPaperDisplayId(id: string, index: number): string {
  if (/^PAP-\d+/i.test(id)) return id.toUpperCase();
  const legacyNum = id.match(/^paper-0*(\d+)$/i);
  if (legacyNum) return `PAP-${legacyNum[1].padStart(3, '0')}`;
  if (/^paper_\d+$/i.test(id)) return `PAP-${String(index + 1).padStart(3, '0')}`;
  return id.length > 12 ? `${id.slice(0, 10)}…` : id;
}

function paperDescription(paper: HskComposedPaper, template?: HskPaperTemplate): string {
  if (paper.description?.trim()) return paper.description.trim();
  if (template) return `基于 ${template.name} 模板生成的正式考试试卷`;
  return '';
}

function countEmptySlots(paper: HskComposedPaper): number {
  const scoring = countScoringSlots(paper.slots);
  const filled = countFilledSlots(paper.slots);
  return Math.max(0, scoring - filled);
}

function templateStatusFromList(templates: HskPaperTemplate[]): Record<string, HskPublishStatus> {
  return templates.reduce<Record<string, HskPublishStatus>>((acc, template) => {
    acc[template.id] = template.status;
    return acc;
  }, {});
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function HskPaper() {
  const { store } = useHskStore({ initialServerRefresh: false });
  const [listStep, setListStep] = useState<ListStep>('list');
  const [toast, setToast] = useState<string | null>(null);
  const [editingPaper, setEditingPaper] = useState<HskComposedPaper | null>(null);
  const [previewPaper, setPreviewPaper] = useState<HskComposedPaper | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null);
  const [publishModal, setPublishModal] = useState<PublishModal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [paperList, setPaperList] = useState<HskComposedPaper[]>(() => store.papers);
  const [templateList, setTemplateList] = useState<HskPaperTemplate[]>(() => store.templates);
  const [questionList, setQuestionList] = useState<HskQuestionRow[]>(() => store.questions);
  const [questionTypeList, setQuestionTypeList] = useState<HskQuestionTypeDef[]>(() => store.questionTypes);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [pendingPaperMutation, setPendingPaperMutation] = useState<PendingPaperMutation | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [paperLoadError, setPaperLoadError] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const creatingTemplateRef = useRef(false);
  const paperMutationRef = useRef(false);
  const paperListRef = useRef<HskComposedPaper[]>(store.papers);
  const paperDataEpochRef = useRef(0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const applyPaperList = (papers: HskComposedPaper[]) => {
    paperListRef.current = papers;
    setPaperList(papers);
    try {
      syncTemplatesPapersLocalCache({ papers });
    } catch {
      // The API response remains visible in memory even when browser persistence is unavailable.
    }
  };

  const cachePaper = (paper: HskComposedPaper) => {
    paperDataEpochRef.current += 1;
    applyPaperList(upsertPaperInList(paperListRef.current, paper));
  };

  const beginPaperMutation = (paperId: string, action: PaperMutationAction): boolean => {
    if (
      hydrating
      ||
      paperMutationInFlight
      || templateCreationInFlight
      || paperMutationRef.current
      || creatingTemplateRef.current
    ) return false;
    paperMutationInFlight = true;
    startPaperOperation();
    paperMutationRef.current = true;
    setPendingPaperMutation({ paperId, action });
    return true;
  };

  const endPaperMutation = () => {
    paperMutationInFlight = false;
    finishPaperOperation();
    paperMutationRef.current = false;
    setPendingPaperMutation(null);
  };

  useEffect(() => {
    let active = true;
    const loadEpoch = paperDataEpochRef.current;
    setHydrating(true);
    setPaperLoadError(false);
    const pendingOperation = paperOperationCompletion;
    void (pendingOperation ?? Promise.resolve())
      .then(() => Promise.allSettled([listTemplates(), listPapers(), listQuestions(), listQuestionTypes()]))
      .then(([templatesResult, papersResult, questionsResult, questionTypesResult]) => {
        if (!active) return;
        if (papersResult.status === 'rejected') throw papersResult.reason;
        const papers = papersResult.value;
        const templates = templatesResult.status === 'fulfilled' ? templatesResult.value : undefined;
        const questions = questionsResult.status === 'fulfilled' ? questionsResult.value : undefined;
        const questionTypes = questionTypesResult.status === 'fulfilled' ? questionTypesResult.value : undefined;
        if (templates) setTemplateList(templates);
        if (questions) setQuestionList(questions);
        if (questionTypes) setQuestionTypeList(questionTypes);
        const paperSnapshotIsCurrent = loadEpoch === paperDataEpochRef.current;
        if (paperSnapshotIsCurrent) {
          paperListRef.current = papers;
          setPaperList(papers);
        }
        try {
          syncQuestionBankLocalCache({ questions, questionTypes });
          syncTemplatesPapersLocalCache({
            templates,
            ...(templates ? { templateStatus: templateStatusFromList(templates) } : {}),
            ...(paperSnapshotIsCurrent ? { papers } : {}),
          });
        } catch {
          // The complete server snapshot is already available in component memory.
        }
        if (
          templatesResult.status === 'rejected'
          || questionsResult.status === 'rejected'
          || questionTypesResult.status === 'rejected'
        ) {
          showToast('部分辅助数据加载失败，试卷列表已更新');
        }
        setHydrating(false);
      })
      .catch((err) => {
        if (active) {
          setPaperLoadError(true);
          showToast(errorMessage(err, '试卷列表加载失败'));
        }
      });
    return () => {
      active = false;
    };
  }, [reloadNonce]);

  const sortedPapers = useMemo(
    () =>
      [...paperList].sort((a, b) => {
        const at = new Date(a.createdAt ?? a.updatedAt).getTime();
        const bt = new Date(b.createdAt ?? b.updatedAt).getTime();
        return bt - at;
      }),
    [paperList],
  );

  const filteredPapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedPapers;
    return sortedPapers.filter((paper) => {
      const tpl = templateList.find((t) => t.id === paper.templateId);
      return (
        paper.id.toLowerCase().includes(q) ||
        paper.name.toLowerCase().includes(q) ||
        paper.description?.toLowerCase().includes(q) ||
        tpl?.name.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, sortedPapers, templateList]);

  const publishedCount = sortedPapers.filter((p) => p.status === 'published').length;

  const availableTemplates = useMemo(
    () => templateList.filter(isTemplateAvailableForPaper),
    [templateList],
  );

  const getTemplate = (paper: HskComposedPaper) =>
    templateList.find((t) => t.id === paper.templateId);

  const handleTogglePublish = async (paper: HskComposedPaper) => {
    if (paper.status === 'published') {
      if (!beginPaperMutation(paper.id, 'unpublish')) return;
      try {
        const linkedExams = await getPaperExamImpactCount(paper.id);
        if (linkedExams > 0) {
          setPublishModal({ type: 'unpublish', paper, linkedExams });
          return;
        }
        const unpublished = await unpublishPaperApi(paper.id);
        cachePaper(unpublished);
        showToast('已取消发布');
      } catch (err) {
        showToast(errorMessage(err, '试卷取消发布失败'));
      } finally {
        endPaperMutation();
      }
      return;
    }
    const emptySlots = countEmptySlots(paper);
    if (emptySlots > 0) {
      setPublishModal({ type: 'incomplete', paper, emptySlots });
      return;
    }
    if (!beginPaperMutation(paper.id, 'publish')) return;
    try {
      const published = await publishPaperApi(paper.id);
      cachePaper(published);
      showToast('试卷已发布');
    } catch (err) {
      showToast(errorMessage(err, '试卷发布失败'));
    } finally {
      endPaperMutation();
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    if (!beginPaperMutation(deleteModal.paper.id, 'delete')) return;
    const paper = deleteModal.paper;
    try {
      await deletePaperApi(paper.id);
      paperDataEpochRef.current += 1;
      applyPaperList(removePaperFromList(paperListRef.current, paper.id));
      setDeleteModal(null);
      showToast(`已删除试卷 ${paper.id}`);
    } catch (err) {
      showToast(errorMessage(err, '试卷删除失败'));
    } finally {
      endPaperMutation();
    }
  };

  const handleCreateFromTemplate = async (template: HskPaperTemplate) => {
    if (
      hydrating
      ||
      templateCreationInFlight
      || paperMutationInFlight
      || creatingTemplateRef.current
      || paperMutationRef.current
    ) return;
    templateCreationInFlight = true;
    startPaperOperation();
    creatingTemplateRef.current = true;
    setCreatingTemplateId(template.id);
    try {
      const paper = await createPaperFromTemplateApi({ templateId: template.id });
      setListStep('list');
      setEditingPaper(structuredClone(paper));
      showToast('已创建试卷，请从题库选题');
      cachePaper(paper);
    } catch (err) {
      showToast(errorMessage(err, '试卷创建失败'));
    } finally {
      templateCreationInFlight = false;
      finishPaperOperation();
      creatingTemplateRef.current = false;
      setCreatingTemplateId(null);
    }
  };

  const confirmUnpublish = async (paper: HskComposedPaper) => {
    if (!beginPaperMutation(paper.id, 'unpublish')) return;
    try {
      const unpublished = await unpublishPaperApi(paper.id);
      cachePaper(unpublished);
      setPublishModal(null);
      showToast('已取消发布');
    } catch (err) {
      showToast(errorMessage(err, '试卷取消发布失败'));
    } finally {
      endPaperMutation();
    }
  };

  const listBusy = hydrating || pendingPaperMutation !== null || creatingTemplateId !== null;

  if (previewPaper) {
    const template = getTemplate(previewPaper);
    const compileWarning = template
      ? validateDeliveryCompile(previewPaper, questionList, template)
      : '未找到关联模板';
    return (
      <>
        <HskPaperPreviewPage
          paper={previewPaper}
          template={template}
          questions={questionList}
          typeDefs={questionTypeList}
          compileWarning={compileWarning}
          onBack={() => setPreviewPaper(null)}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  if (editingPaper) {
    const template = getTemplate(editingPaper);
    const compileErr = template ? validateDeliveryCompile(editingPaper, questionList, template) : null;
    return (
      <>
        <HskPaperComposer
          paper={editingPaper}
          template={template}
          questions={questionList}
          typeDefs={questionTypeList}
          compileError={compileErr}
          busyAction={pendingPaperMutation?.paperId === editingPaper.id
            && (pendingPaperMutation.action === 'save' || pendingPaperMutation.action === 'publish')
            ? pendingPaperMutation.action
            : null}
          onBack={() => setEditingPaper(null)}
          onChange={setEditingPaper}
          onSaveDraft={async () => {
            if (!beginPaperMutation(editingPaper.id, 'save')) return;
            try {
              const saved = await patchPaper(editingPaper.id, { ...editingPaper, status: 'draft' });
              cachePaper(saved);
              setEditingPaper(saved);
              showToast('组卷草稿已保存');
            } catch (err) {
              showToast(errorMessage(err, '组卷草稿保存失败'));
            } finally {
              endPaperMutation();
            }
          }}
          onPublish={async () => {
            if (compileErr) {
              showToast(compileErr);
              return;
            }
            if (!beginPaperMutation(editingPaper.id, 'publish')) return;
            try {
              const saved = await patchPaper(editingPaper.id, editingPaper);
              cachePaper(saved);
              setEditingPaper(saved);
              const published = await publishPaperApi(editingPaper.id);
              cachePaper(published);
              showToast('试卷已发布');
              setEditingPaper(null);
            } catch (err) {
              showToast(errorMessage(err, '试卷发布失败'));
            } finally {
              endPaperMutation();
            }
          }}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  if (listStep === 'selectTemplate') {
    return (
      <div className="hsk-paper-mgmt">
        <div className="hsk-paper-mgmt-header">
          <div className="hsk-paper-mgmt-header-main">
            <button
              type="button"
              className="hsk-paper-back"
              disabled={hydrating || creatingTemplateId !== null}
              onClick={() => setListStep('list')}
            >
              ← 返回列表
            </button>
            <h2 className="hsk-paper-mgmt-title">选择试卷模板</h2>
            <p className="hsk-paper-mgmt-stats">从考试管理的模板中选择，生成具体试卷实例</p>
          </div>
        </div>
        <div className="hsk-paper-mgmt-body">
        <div className="hsk-paper-template-grid">
          {availableTemplates.length === 0 && (
            <div className="hsk-paper-empty">暂无可用模板，请先在考试管理中发布 HSK1/2 模板。</div>
          )}
          {availableTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="hsk-paper-template-card"
              disabled={hydrating || creatingTemplateId !== null}
              aria-busy={creatingTemplateId === tpl.id}
              onClick={() => handleCreateFromTemplate(tpl)}
            >
              <div className="hsk-paper-template-card-top">
                <span className="hsk-paper-template-level">{tpl.level}</span>
                <span className={`hsk-paper-template-status${tpl.status === 'published' ? ' is-published' : ''}`}>
                  {creatingTemplateId === tpl.id
                    ? '创建中...'
                    : tpl.status === 'published'
                      ? '已发布'
                      : '草稿'}
                </span>
              </div>
              <h3>{tpl.name}</h3>
              <p>
                {tpl.totalQuestions} 题 · {tpl.totalScore} 分 · {tpl.totalDuration} 分钟
              </p>
            </button>
          ))}
        </div>
        </div>
        {toast && <div className="hsk-toast show">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="hsk-paper-mgmt">
      <div className="hsk-paper-mgmt-header">
        <div className="hsk-paper-mgmt-header-main">
          <h2 className="hsk-paper-mgmt-title">试卷管理</h2>
          <p className="hsk-paper-mgmt-stats">
            共 {sortedPapers.length} 份试卷 · {publishedCount} 份已发布 · {sortedPapers.length - publishedCount} 份草稿
          </p>
        </div>
        <div className="hsk-paper-mgmt-header-actions">
          {paperLoadError && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setReloadNonce((value) => value + 1)}
            >
              重新加载
            </button>
          )}
          <input
            type="search"
            className="hsk-paper-mgmt-search"
            placeholder="搜索试卷编号或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            className="hsk-paper-create-btn"
            disabled={listBusy}
            onClick={() => setListStep('selectTemplate')}
          >
            + 新建试卷
          </button>
        </div>
      </div>

      <div className="hsk-paper-mgmt-body">
      <div className="hsk-paper-table-card">
        <table className="hsk-paper-table">
          <thead>
            <tr>
              <th className="col-id">试卷编号</th>
              <th className="col-name">试卷名称</th>
              <th className="col-tpl">模板来源</th>
              <th className="col-num">题目数</th>
              <th className="col-score">总分</th>
              <th className="col-publish">发布</th>
              <th className="col-date">创建时间</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.map((paper) => {
              const tpl = getTemplate(paper);
              const filled = countFilledSlots(paper.slots);
              const scoring = countScoringSlots(paper.slots);
              const desc = paperDescription(paper, tpl);
              const paperIndex = sortedPapers.findIndex((p) => p.id === paper.id);
              const displayId = formatPaperDisplayId(paper.id, paperIndex >= 0 ? paperIndex : 0);
              return (
                <tr key={paper.id}>
                  <td className="col-id">
                    <code className="hsk-paper-code" title={paper.id}>{displayId}</code>
                  </td>
                  <td className="col-name">
                    <div className="hsk-paper-name-cell">
                      <div className="hsk-paper-name-row">
                        <span className="hsk-paper-name">{paper.name}</span>
                        <span className={`hsk-paper-status${paper.status === 'published' ? ' is-published' : ''}`}>
                          {paper.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </div>
                      {desc && <div className="hsk-paper-desc">{desc}</div>}
                    </div>
                  </td>
                  <td className="col-tpl">
                    <div className="hsk-paper-tpl-cell">
                      <span className="hsk-paper-tpl-name">{tpl?.name ?? '未知模板'}</span>
                      {tpl && <span className="hsk-paper-tpl-level">{tpl.level}</span>}
                    </div>
                  </td>
                  <td className="col-num">
                    <span className={`hsk-paper-count${filled < scoring ? ' is-incomplete' : ''}`}>
                      {filled} 题
                    </span>
                  </td>
                  <td className="col-score">{paper.totalScore} 分</td>
                  <td className="col-publish">
                    <div className="hsk-paper-publish-control">
                    <label
                      className="status-toggle"
                      title={pendingPaperMutation?.paperId === paper.id
                        ? pendingPaperMutation.action === 'publish' ? '发布中' : '撤回中'
                        : paper.status === 'published' ? '已发布' : '草稿'}
                    >
                      <input
                        type="checkbox"
                        checked={paper.status === 'published'}
                        disabled={listBusy}
                        onChange={() => handleTogglePublish(paper)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    {pendingPaperMutation?.paperId === paper.id && pendingPaperMutation.action !== 'delete' && (
                      <span className="hsk-paper-pending-label">
                        {pendingPaperMutation.action === 'publish' ? '发布中...' : '撤回中...'}
                      </span>
                    )}
                    </div>
                  </td>
                  <td className="col-date">{formatPaperDate(paper.createdAt ?? paper.updatedAt)}</td>
                  <td className="col-actions">
                    <div className="hsk-paper-row-actions">
                      <button
                        type="button"
                        className="hsk-paper-action hsk-paper-action-preview"
                        onClick={() => setPreviewPaper(structuredClone(paper))}
                      >
                        预览
                      </button>
                      <button
                        type="button"
                        className="hsk-paper-action hsk-paper-action-compose"
                        disabled={listBusy}
                        onClick={() => setEditingPaper(structuredClone(paper))}
                      >
                        组卷编辑
                      </button>
                      {paper.status === 'published' ? (
                        <span className="hsk-paper-action hsk-paper-action-disabled" title="已发布试卷不可删除，请先取消发布">
                          删除
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="hsk-paper-action hsk-paper-action-danger"
                          disabled={listBusy}
                          onClick={() => {
                            const decision = decidePaperDelete({
                              paperStatus: paper.status,
                              localLinkedExamCount: 0,
                            });
                            if (!decision.shouldCallApi) {
                              showToast(decision.blockReason ?? '当前试卷不可删除');
                              return;
                            }
                            setDeleteModal({ paper });
                          }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPapers.length === 0 && (
          <div className="hsk-paper-empty">
            {searchQuery.trim() ? '没有匹配的试卷，请调整搜索条件。' : '暂无试卷，点击「新建试卷」从模板创建。'}
          </div>
        )}
      </div>
      </div>

      {deleteModal && (
        <div
          className="hsk-paper-modal-overlay"
          onClick={() => {
            if (!pendingPaperMutation) setDeleteModal(null);
          }}
          role="presentation"
        >
          <div className="hsk-paper-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="hsk-paper-modal-title">删除试卷「{deleteModal.paper.name}」</h3>
            <p className="hsk-paper-modal-text">
              确认删除试卷「{deleteModal.paper.id}」？若该试卷已被真实考试引用，后端将返回影响范围并阻止删除。
            </p>
            <div className="hsk-paper-modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pendingPaperMutation !== null}
                onClick={() => setDeleteModal(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="hsk-paper-modal-delete"
                disabled={pendingPaperMutation !== null}
                onClick={confirmDelete}
              >
                {pendingPaperMutation?.action === 'delete' ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {publishModal?.type === 'incomplete' && (
        <div className="hsk-paper-modal-overlay" onClick={() => setPublishModal(null)} role="presentation">
          <div className="hsk-paper-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="hsk-paper-modal-title">无法发布</h3>
            <p className="hsk-paper-modal-text">
              还有 <strong>{publishModal.emptySlots}</strong> 道题未从题库选题，请先完成组卷编辑。
            </p>
            <div className="hsk-paper-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPublishModal(null)}>
                知道了
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingPaper(structuredClone(publishModal.paper));
                  setPublishModal(null);
                }}
              >
                去组卷编辑
              </button>
            </div>
          </div>
        </div>
      )}

      {publishModal?.type === 'unpublish' && (
        <div
          className="hsk-paper-modal-overlay"
          onClick={() => {
            if (!pendingPaperMutation) setPublishModal(null);
          }}
          role="presentation"
        >
          <div className="hsk-paper-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="hsk-paper-modal-title">取消发布</h3>
            <div className="hsk-paper-modal-warning">
              该试卷已关联 <strong>{publishModal.linkedExams}</strong> 场考试。取消发布后，相关考试可能需要重新配置。
            </div>
            <div className="hsk-paper-modal-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={pendingPaperMutation !== null}
                onClick={() => setPublishModal(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="hsk-paper-modal-delete"
                disabled={pendingPaperMutation !== null}
                onClick={() => void confirmUnpublish(publishModal.paper)}
              >
                {pendingPaperMutation?.action === 'unpublish' ? '撤回中...' : '确认取消发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
