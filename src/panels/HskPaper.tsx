import { useMemo, useState } from 'react';
import { HskDeliveryPreview } from '../components/HskDeliveryPreview';
import { HskQuestionPicker } from '../components/HskQuestionPicker';
import { HskTemplateEditor } from '../components/HskTemplateEditor';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { getLevelStandard } from '../config/hskLevelStandards';
import { levelToNumber } from '../config/hskQuestionTypes';
import { useHskStore } from '../hooks/useHskStore';
import {
  createPaperFromTemplate,
  loadHskStore,
  publishPaper,
  publishTemplate,
  savePaper,
  saveTemplate,
} from '../stores/hskExams';
import type { HskComposedPaper, HskPaperSlot, HskPaperTemplate } from '../types/hskExams';
import { previewExamDelivery, validateDeliveryCompile } from '../utils/hskCompileDelivery';
import {
  assignQuestionNumbers,
  calcPaperScore,
  countFilledSlots,
  countScoringSlots,
  createEmptyTemplate as buildEmptyTemplate,
} from '../utils/hskPaperUtils';

const PAPER_TABS = [
  { id: 'templates', label: '试卷模板' },
  { id: 'list', label: '试卷列表' },
  { id: 'compose', label: '组卷编辑' },
  { id: 'preview', label: '编译预览' },
] as const;

export function HskPaper() {
  const { store, refresh } = useHskStore();
  const [activeTab, setActiveTab] = useState<string>('list');
  const [selectedHskLevel, setSelectedHskLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<HskPaperTemplate | null>(null);
  const [editingPaper, setEditingPaper] = useState<HskComposedPaper | null>(null);
  const [pickerSlot, setPickerSlot] = useState<HskPaperSlot | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [previewPaper, setPreviewPaper] = useState<HskComposedPaper | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const filteredPapers = useMemo(() => {
    return store.papers.filter((p) => {
      const lvl = levelToNumber(String(p.level));
      const matchesLevel = selectedHskLevel === null || lvl === selectedHskLevel;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [store.papers, selectedHskLevel, searchQuery]);

  const getHskBadgeClass = (level: string) => {
    const n = levelToNumber(level) ?? 1;
    return `hsk-badge-${n}`;
  };

  const moduleStats = (paper: HskComposedPaper) => {
    const listening = paper.slots.filter((s) => s.moduleId === 'listening' && !s.isExample).length;
    const reading = paper.slots.filter((s) => s.moduleId === 'reading' && !s.isExample).length;
    const writing = paper.slots.filter((s) => s.moduleId === 'writing' && !s.isExample).length;
    return { listening, reading, writing };
  };

  if (editingTemplate) {
    return (
      <>
        <HskTemplateEditor
          template={editingTemplate}
          typeDefs={store.questionTypes}
          publishError={publishError}
          onChange={setEditingTemplate}
          onBack={() => {
            setEditingTemplate(null);
            setPublishError(null);
          }}
          onSave={() => {
            saveTemplate(store, { ...editingTemplate, status: 'draft' });
            refresh();
            showToast('模板草稿已保存');
          }}
          onPublish={() => {
            saveTemplate(store, editingTemplate);
            const err = publishTemplate(loadHskStore(), editingTemplate.id);
            if (err) {
              setPublishError(err);
              return;
            }
            setPublishError(null);
            refresh();
            showToast('模板已发布');
            setEditingTemplate(null);
          }}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  if (editingPaper) {
    const filled = countFilledSlots(editingPaper.slots);
    const scoring = countScoringSlots(editingPaper.slots);
    const template = store.templates.find((t) => t.id === editingPaper.templateId);
    const compileErr = template ? validateDeliveryCompile(editingPaper, store.questions, template) : null;
    const levelNum = levelToNumber(String(editingPaper.level));
    const standard = levelNum ? getLevelStandard(levelNum) : null;
    return (
      <>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button type="button" className="back-btn" onClick={() => setEditingPaper(null)}>← 返回列表</button>
            <div className="page-title" style={{ marginTop: 8 }}>{editingPaper.name}</div>
            <div className="page-subtitle">
              已选题 {filled}/{scoring} · {calcPaperScore(editingPaper.slots)} 分
              {standard && (
                <span style={{ marginLeft: 8 }}>
                  · HSK{levelNum} 标准 {standard.totalScore} 分 / {standard.totalQuestions} 题
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setPreviewPaper(editingPaper);
                setActiveTab('preview');
              }}
            >
              编译预览
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                savePaper(store, { ...editingPaper, status: 'draft' });
                refresh();
                showToast('组卷草稿已保存');
              }}
            >
              保存草稿
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
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
            >
              发布试卷
            </button>
          </div>
        </div>
        {compileErr && (
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-body" style={{ color: 'var(--danger)', fontSize: 13 }}>{compileErr}</div>
          </div>
        )}
        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-body">
            <div className="hsk-qtype-grid">
              {editingPaper.slots.filter((s) => !s.isExample).map((slot) => (
                <button
                  key={slot.globalIndex}
                  type="button"
                  className={`hsk-qtype-card ${slot.questionId ? 'configured' : 'unconfigured'}`}
                  onClick={() => setPickerSlot(slot)}
                >
                  <div className="hsk-qtc-top">
                    <span className="hsk-qtc-id">{slot.questionType}</span>
                    <span className={`hsk-qtc-status ${slot.questionId ? 'st-done' : 'st-empty'}`}>
                      {slot.questionId ? '已选' : '待选'}
                    </span>
                  </div>
                  <div className="hsk-qtc-name">第 {slot.questionNumber} 题</div>
                  <div className="hsk-qtc-desc">{slot.sectionName}</div>
                  <div className="hsk-qtc-footer">
                    <span className="hsk-qtc-count">{slot.questionId ?? '点击从题库选择'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <HskQuestionPicker
          open={!!pickerSlot}
          slot={pickerSlot}
          questions={store.questions}
          onClose={() => setPickerSlot(null)}
          onSelect={(question) => {
            if (!pickerSlot) return;
            const slots = editingPaper.slots.map((s) =>
              s.globalIndex === pickerSlot.globalIndex ? { ...s, questionId: question.question_uid } : s,
            );
            setEditingPaper({
              ...editingPaper,
              slots: assignQuestionNumbers(slots),
              totalScore: calcPaperScore(slots),
            });
            setPickerSlot(null);
          }}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  const templatesPanel = (
    <div className="paper-table-container">
      <table>
        <thead>
          <tr>
            <th>模板 ID</th>
            <th>名称</th>
            <th>级别</th>
            <th>题量/分值</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {store.templates.map((tpl) => (
            <tr key={tpl.id}>
              <td><span className="paper-id">{tpl.id}</span></td>
              <td>{tpl.name}</td>
              <td><span className={`hsk-badge ${getHskBadgeClass(String(tpl.level))}`}>{tpl.level}</span></td>
              <td>{tpl.totalQuestions} 题 / {tpl.totalScore} 分 / {tpl.totalDuration} 分钟</td>
              <td>{tpl.status === 'published' ? '已发布' : '草稿'}</td>
              <td>
                <div className="actions">
                  <button type="button" className="action-btn edit" onClick={() => setEditingTemplate(structuredClone(tpl))}>编辑</button>
                  <button
                    type="button"
                    className="action-btn data"
                    onClick={() => {
                      const paper = createPaperFromTemplate(store, tpl.id);
                      if (paper) {
                        refresh();
                        setEditingPaper(structuredClone(paper));
                        setActiveTab('compose');
                        showToast('已基于模板创建组卷');
                      }
                    }}
                  >
                    组卷
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const listPanel = (
    <>
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">HSK级别:</span>
          <select value={selectedHskLevel ?? ''} onChange={(e) => setSelectedHskLevel(e.target.value ? Number(e.target.value) : null)}>
            <option value="">全部级别</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>HSK {n}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="搜索试卷 ID 或名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th>试卷 ID</th>
              <th>名称</th>
              <th>级别</th>
              <th>构成</th>
              <th>总分/时长</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.map((paper) => {
              const stats = moduleStats(paper);
              return (
                <tr key={paper.id}>
                  <td><span className="paper-id">{paper.id}</span></td>
                  <td>{paper.name}</td>
                  <td><span className={`hsk-badge ${getHskBadgeClass(String(paper.level))}`}>{paper.level}</span></td>
                  <td>
                    <div className="question-stats">
                      <div className="stat-item stat-listening">{stats.listening}</div>
                      <div className="stat-item stat-reading">{stats.reading}</div>
                      <div className="stat-item stat-writing">{stats.writing}</div>
                    </div>
                  </td>
                  <td>{paper.totalScore} 分 / {paper.duration} 分钟</td>
                  <td>{paper.status === 'published' ? '已发布' : '草稿'}</td>
                  <td>
                    <div className="actions">
                      <button type="button" className="action-btn edit" onClick={() => setEditingPaper(structuredClone(paper))}>
                        组卷编辑
                      </button>
                      <button
                        type="button"
                        className="action-btn data"
                        onClick={() => {
                          setPreviewPaper(structuredClone(paper));
                          setActiveTab('preview');
                        }}
                      >
                        编译预览
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">试卷管理</div>
          <div className="page-subtitle">试卷模板 · 试卷列表 · 从题库组卷</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setEditingTemplate(buildEmptyTemplate())}
          >
            + 新建模板
          </button>
        </div>
      </div>

      <PageTabs tabs={[...PAPER_TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        <PageTabPanel id="templates" activeTab={activeTab}>{templatesPanel}</PageTabPanel>
        <PageTabPanel id="list" activeTab={activeTab}>{listPanel}</PageTabPanel>
        <PageTabPanel id="compose" activeTab={activeTab}>
          <div className="card">
            <div className="card-body">
              <p className="text-muted" style={{ margin: '0 0 12px' }}>
                请从「试卷模板」创建组卷，或在「试卷列表」点击「组卷编辑」从题库选题。
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('templates')}>
                前往模板列表
              </button>
            </div>
          </div>
        </PageTabPanel>
        <PageTabPanel id="preview" activeTab={activeTab}>
          {(() => {
            const paper = previewPaper ?? filteredPapers[0] ?? null;
            const template = paper ? store.templates.find((t) => t.id === paper.templateId) : null;
            const err = paper && template ? validateDeliveryCompile(paper, store.questions, template) : null;
            const delivery = paper && template ? previewExamDelivery(paper, template, store.questions) : null;
            return (
              <>
                <div className="paper-filter-bar">
                  <div className="filter-group">
                    <span className="filter-label">预览试卷:</span>
                    <select
                      value={paper?.id ?? ''}
                      onChange={(e) => {
                        const next = store.papers.find((p) => p.id === e.target.value);
                        setPreviewPaper(next ? structuredClone(next) : null);
                      }}
                    >
                      {store.papers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <HskDeliveryPreview delivery={delivery} error={err} />
              </>
            );
          })()}
        </PageTabPanel>
      </PageTabs>
      {toast && <div className="hsk-toast show">{toast}</div>}
    </>
  );
}
