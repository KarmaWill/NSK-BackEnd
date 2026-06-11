import { useMemo, useState } from 'react';
import { HskPaperComposer } from '../components/HskPaperComposer';
import { HskPaperPreviewPage } from '../components/HskPaperPreviewPage';
import { useHskStore } from '../hooks/useHskStore';
import {
  createPaperFromTemplate,
  deletePaper,
  loadHskStore,
  publishPaper,
  savePaper,
  unpublishPaper,
} from '../stores/hskExams';
import type { HskComposedPaper, HskPaperTemplate } from '../types/hskExams';
import { validateDeliveryCompile } from '../utils/hskCompileDelivery';
import { countFilledSlots, countScoringSlots } from '../utils/hskPaperUtils';

type ListStep = 'list' | 'selectTemplate';

type DeleteModal = {
  paper: HskComposedPaper;
  linkedExams: number;
};

type PublishModal =
  | { type: 'incomplete'; paper: HskComposedPaper; emptySlots: number }
  | { type: 'unpublish'; paper: HskComposedPaper; linkedExams: number };

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

export function HskPaper() {
  const { store, refresh } = useHskStore();
  const [listStep, setListStep] = useState<ListStep>('list');
  const [toast, setToast] = useState<string | null>(null);
  const [editingPaper, setEditingPaper] = useState<HskComposedPaper | null>(null);
  const [previewPaper, setPreviewPaper] = useState<HskComposedPaper | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModal | null>(null);
  const [publishModal, setPublishModal] = useState<PublishModal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const sortedPapers = useMemo(
    () =>
      [...store.papers].sort((a, b) => {
        const at = new Date(a.createdAt ?? a.updatedAt).getTime();
        const bt = new Date(b.createdAt ?? b.updatedAt).getTime();
        return bt - at;
      }),
    [store.papers],
  );

  const filteredPapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedPapers;
    return sortedPapers.filter((paper) => {
      const tpl = store.templates.find((t) => t.id === paper.templateId);
      return (
        paper.id.toLowerCase().includes(q) ||
        paper.name.toLowerCase().includes(q) ||
        paper.description?.toLowerCase().includes(q) ||
        tpl?.name.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, sortedPapers, store.templates]);

  const publishedCount = sortedPapers.filter((p) => p.status === 'published').length;

  const getTemplate = (paper: HskComposedPaper) =>
    store.templates.find((t) => t.id === paper.templateId);

  const getLinkedExamCount = (paperId: string) =>
    store.exams.filter((e) => e.paperId === paperId).length;

  const handleTogglePublish = (paper: HskComposedPaper) => {
    if (paper.status === 'published') {
      const linkedExams = getLinkedExamCount(paper.id);
      if (linkedExams > 0) {
        setPublishModal({ type: 'unpublish', paper, linkedExams });
        return;
      }
      unpublishPaper(store, paper.id);
      refresh();
      showToast('已取消发布');
      return;
    }
    const emptySlots = countEmptySlots(paper);
    if (emptySlots > 0) {
      setPublishModal({ type: 'incomplete', paper, emptySlots });
      return;
    }
    const err = publishPaper(loadHskStore(), paper.id);
    if (err) {
      showToast(err);
      return;
    }
    refresh();
    showToast('试卷已发布');
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    deletePaper(store, deleteModal.paper.id);
    refresh();
    setDeleteModal(null);
    showToast(`已删除试卷 ${deleteModal.paper.id}`);
  };

  const handleCreateFromTemplate = (template: HskPaperTemplate) => {
    const paper = createPaperFromTemplate(store, template.id);
    if (!paper) {
      showToast('模板不存在');
      return;
    }
    refresh();
    setListStep('list');
    setEditingPaper(structuredClone(paper));
    showToast('已创建试卷，请从题库选题');
  };

  if (previewPaper) {
    const template = getTemplate(previewPaper);
    const compileWarning = template
      ? validateDeliveryCompile(previewPaper, store.questions, template)
      : '未找到关联模板';
    return (
      <>
        <HskPaperPreviewPage
          paper={previewPaper}
          template={template}
          questions={store.questions}
          typeDefs={store.questionTypes}
          compileWarning={compileWarning}
          onBack={() => setPreviewPaper(null)}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  if (editingPaper) {
    const template = getTemplate(editingPaper);
    const compileErr = template ? validateDeliveryCompile(editingPaper, store.questions, template) : null;
    return (
      <>
        <HskPaperComposer
          paper={editingPaper}
          template={template}
          questions={store.questions}
          typeDefs={store.questionTypes}
          compileError={compileErr}
          onBack={() => setEditingPaper(null)}
          onChange={setEditingPaper}
          onSaveDraft={() => {
            savePaper(store, { ...editingPaper, status: 'draft' });
            refresh();
            showToast('组卷草稿已保存');
          }}
          onPublish={() => {
            if (compileErr) {
              showToast(compileErr);
              return;
            }
            savePaper(store, editingPaper);
            const err = publishPaper(loadHskStore(), editingPaper.id);
            if (err) {
              showToast(err);
              return;
            }
            refresh();
            showToast('试卷已发布');
            setEditingPaper(null);
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
            <button type="button" className="hsk-paper-back" onClick={() => setListStep('list')}>
              ← 返回列表
            </button>
            <h2 className="hsk-paper-mgmt-title">选择试卷模板</h2>
            <p className="hsk-paper-mgmt-stats">从考试管理的模板中选择，生成具体试卷实例</p>
          </div>
        </div>
        <div className="hsk-paper-mgmt-body">
        <div className="hsk-paper-template-grid">
          {store.templates.length === 0 && (
            <div className="hsk-paper-empty">暂无模板，请先在考试管理中配置试卷模板。</div>
          )}
          {store.templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              className="hsk-paper-template-card"
              onClick={() => handleCreateFromTemplate(tpl)}
            >
              <div className="hsk-paper-template-card-top">
                <span className="hsk-paper-template-level">{tpl.level}</span>
                <span className={`hsk-paper-template-status${tpl.status === 'published' ? ' is-published' : ''}`}>
                  {tpl.status === 'published' ? '已发布' : '草稿'}
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
          <input
            type="search"
            className="hsk-paper-mgmt-search"
            placeholder="搜索试卷编号或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="hsk-paper-create-btn" onClick={() => setListStep('selectTemplate')}>
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
                    <label className="status-toggle" title={paper.status === 'published' ? '已发布' : '草稿'}>
                      <input
                        type="checkbox"
                        checked={paper.status === 'published'}
                        onChange={() => handleTogglePublish(paper)}
                      />
                      <span className="toggle-slider" />
                    </label>
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
                          onClick={() =>
                            setDeleteModal({
                              paper,
                              linkedExams: getLinkedExamCount(paper.id),
                            })
                          }
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
        <div className="hsk-paper-modal-overlay" onClick={() => setDeleteModal(null)} role="presentation">
          <div className="hsk-paper-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="hsk-paper-modal-title">删除试卷「{deleteModal.paper.name}」</h3>
            {deleteModal.linkedExams > 0 ? (
              <div className="hsk-paper-modal-warning">
                该试卷已关联 <strong>{deleteModal.linkedExams}</strong> 场考试。删除后相关考试将一并移除，确认删除？
              </div>
            ) : (
              <p className="hsk-paper-modal-text">
                确认删除试卷「{deleteModal.paper.id}」？此操作不可恢复。
              </p>
            )}
            <div className="hsk-paper-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteModal(null)}>
                取消
              </button>
              <button type="button" className="hsk-paper-modal-delete" onClick={confirmDelete}>
                确认删除
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
        <div className="hsk-paper-modal-overlay" onClick={() => setPublishModal(null)} role="presentation">
          <div className="hsk-paper-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <h3 className="hsk-paper-modal-title">取消发布</h3>
            <div className="hsk-paper-modal-warning">
              该试卷已关联 <strong>{publishModal.linkedExams}</strong> 场考试。取消发布后，相关考试可能需要重新配置。
            </div>
            <div className="hsk-paper-modal-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPublishModal(null)}>
                取消
              </button>
              <button
                type="button"
                className="hsk-paper-modal-delete"
                onClick={() => {
                  unpublishPaper(store, publishModal.paper.id);
                  refresh();
                  setPublishModal(null);
                  showToast('已取消发布');
                }}
              >
                确认取消发布
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
