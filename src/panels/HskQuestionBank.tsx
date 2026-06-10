import { useEffect, useMemo, useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { HskImportWizard } from '../components/HskImportWizard';
import { HskQuestionPayloadEditor } from '../components/HskQuestionPayloadEditor';
import { getSectionName } from '../config/hskQuestionTypes';
import { useHskStore } from '../hooks/useHskStore';
import {
  importAnalyzeResultAsTemplate,
  mergeTypeCounts,
  upsertQuestionTypes,
  upsertQuestions,
  upsertTags,
} from '../stores/hskExams';
import type { HskQuestionRow, HskSectionModule } from '../types/hskExams';
import { HskQuestionConfig } from './HskQuestionConfig';

const QUESTION_BANK_TABS = [
  { id: 'types', label: '题型管理' },
  { id: 'questions', label: '题目列表' },
  { id: 'tags', label: '题型标签' },
] as const;

export function HskQuestionBank() {
  const { store, refresh } = useHskStore();
  const [activeTab, setActiveTab] = useState<string>('types');
  const [selectedSection, setSelectedSection] = useState<HskSectionModule | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HskQuestionRow | null>(null);
  const [configMode, setConfigMode] = useState<{ section: HskSectionModule; typeId: string; hskLevel: number } | null>(null);
  const [localTypes, setLocalTypes] = useState(store.questionTypes);
  const [localQuestions, setLocalQuestions] = useState(store.questions);
  const [localTags, setLocalTags] = useState(store.tags);

  useEffect(() => {
    setLocalTypes(store.questionTypes);
    setLocalQuestions(store.questions);
    setLocalTags(store.tags);
  }, [store]);

  const questionTypes = useMemo(
    () => mergeTypeCounts(localTypes, localQuestions),
    [localTypes, localQuestions],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const togglePublishStatus = (id: string) => {
    const next = localTypes.map((q) =>
      q.id === id ? { ...q, isPublished: !q.isPublished, lastModified: new Date().toISOString().slice(0, 10) } : q,
    );
    setLocalTypes(next);
    upsertQuestionTypes({ ...store, questions: localQuestions, tags: localTags }, next);
    const qtype = localTypes.find((q) => q.id === id);
    showToast(`已${qtype?.isPublished ? '取消发布' : '发布'} ${qtype?.name}`);
  };

  if (configMode) {
    return (
      <HskQuestionConfig
        section={configMode.section}
        questionTypeId={configMode.typeId}
        hskLevel={configMode.hskLevel}
        onBack={() => setConfigMode(null)}
      />
    );
  }

  const filteredTypes = questionTypes.filter((q) => {
    const matchesSection = selectedSection === 'all' || q.section === selectedSection;
    const matchesSearch =
      searchQuery === '' ||
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const filteredQuestions = localQuestions.filter((q) => {
    if (!questionSearch.trim()) return true;
    const s = questionSearch.toLowerCase();
    return q.question_uid.toLowerCase().includes(s) || q.stem.toLowerCase().includes(s) || q.type_id.toLowerCase().includes(s);
  });

  const getSectionBadgeClass = (section: HskSectionModule) => {
    switch (section) {
      case 'listening':
        return 'section-badge-listening';
      case 'reading':
        return 'section-badge-reading';
      case 'writing':
        return 'section-badge-writing';
    }
  };

  const typesPanel = (
    <>
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">题型分类:</span>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value as HskSectionModule | 'all')}>
            <option value="all">全部分类</option>
            <option value="listening">听力题型</option>
            <option value="reading">阅读题型</option>
            <option value="writing">书写题型</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">搜索:</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索题型ID、名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
          共 {filteredTypes.length} 种题型 · 题库 {localQuestions.length} 题
        </div>
      </div>

      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>题型ID</th>
              <th style={{ width: '120px' }}>题型名称</th>
              <th style={{ width: '90px' }}>分类</th>
              <th>题型描述</th>
              <th style={{ width: '120px' }}>题库题量</th>
              <th style={{ width: '140px' }}>适用级别</th>
              <th style={{ width: '100px' }}>发布状态</th>
              <th style={{ width: '200px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.map((qtype) => (
              <tr key={qtype.id}>
                <td><span className="paper-id">{qtype.id}</span></td>
                <td><div className="paper-name">{qtype.name}</div></td>
                <td>
                  <span className={`section-badge ${getSectionBadgeClass(qtype.section)}`}>
                    {getSectionName(qtype.section)}
                  </span>
                </td>
                <td><div style={{ fontSize: '13px', color: 'var(--ink-light)' }}>{qtype.description}</div></td>
                <td>
                  <strong>{qtype.questionCount}</strong>
                  <span style={{ color: 'var(--ink-light)', fontSize: 12 }}> / {qtype.totalQuestions}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {qtype.hskLevels.map((level) => (
                      <span key={level} className="hsk-level-mini">HSK{level}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <label className="status-toggle">
                    <input type="checkbox" checked={qtype.isPublished} onChange={() => togglePublishStatus(qtype.id)} />
                    <span className="toggle-slider" />
                  </label>
                </td>
                <td>
                  <div className="actions">
                    <button
                      type="button"
                      className="action-btn edit"
                      onClick={() => setConfigMode({ section: qtype.section, typeId: qtype.id, hskLevel: qtype.hskLevels[0] })}
                    >
                      配置
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {toast && <div className="hsk-toast show">{toast}</div>}
    </>
  );

  const questionsPanel = (
    <>
      <div className="paper-filter-bar">
        <div className="filter-group">
          <input
            type="text"
            className="search-input"
            placeholder="搜索题目 ID、题型或题干..."
            value={questionSearch}
            onChange={(e) => setQuestionSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => {
            const id = `Q-${String(localQuestions.length + 1).padStart(3, '0')}`;
            const row: HskQuestionRow = {
              question_uid: id,
              type_id: 'L01',
              level: 'HSK1',
              tags: [],
              stem: '新题目题干',
              options: [
                { label: 'A', text: '' },
                { label: 'B', text: '' },
              ],
              correctAnswer: 'A',
              explanation: '',
              score: 5,
              payload: { content: { phrase: '' }, runtimeOptions: [{ key: 'A' }, { key: 'B' }, { key: 'C' }] },
              audioStatus: 'none',
              imageStatus: 'none',
              linked_courses: [],
              linked_papers: [],
              linked_videos: [],
              status: 'draft',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            const next = [...localQuestions, row];
            setLocalQuestions(next);
            upsertQuestions(store, next);
            showToast(`已新建题目 ${id}`);
          }}
        >
          + 新建题目
        </button>
      </div>
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th>题目 ID</th>
              <th>题型</th>
              <th>级别</th>
              <th>题干</th>
              <th>Payload</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuestions.map((q) => (
              <tr key={q.question_uid}>
                <td><span className="paper-id">{q.question_uid}</span></td>
                <td>{q.type_id}</td>
                <td>{q.level}</td>
                <td>{q.stem}</td>
                <td style={{ fontSize: 12 }}>
                  {q.payload?.runtimeOptions?.length ? `${q.payload.runtimeOptions.length} 选项` : '—'}
                  {q.payload?.subQuestions?.length ? ` · ${q.payload.subQuestions.length} 子题` : ''}
                  {(q.audioUrl || q.payload?.audioUrl) ? ' · 音频' : ''}
                </td>
                <td>{q.status === 'published' ? '已发布' : '草稿'}</td>
                <td>
                  <button type="button" className="action-btn edit" onClick={() => setEditingQuestion(q)}>
                    编辑 Payload
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const tagsPanel = (
    <div className="card">
      <div className="card-header">
        <div className="card-title">题型标签</div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 12 }}>
          {localTags.map((tag) => (
            <span key={tag.id} className="library-feature-selected-tag" title={tag.description}>
              {tag.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            const label = prompt('新标签名称');
            if (!label?.trim()) return;
            const next = [...localTags, { id: `tag-${Date.now()}`, label: label.trim() }];
            setLocalTags(next);
            upsertTags(store, next);
            showToast(`已添加标签 ${label.trim()}`);
          }}
        >
          + 新建标签
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">题库管理</div>
          <div className="page-subtitle">题型管理 · 题目 Payload 编辑 · 智能导入</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => setImportOpen(true)}>
            智能导入
          </button>
        </div>
      </div>

      <PageTabs tabs={[...QUESTION_BANK_TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        <PageTabPanel id="types" activeTab={activeTab}>{typesPanel}</PageTabPanel>
        <PageTabPanel id="questions" activeTab={activeTab}>{questionsPanel}</PageTabPanel>
        <PageTabPanel id="tags" activeTab={activeTab}>{tagsPanel}</PageTabPanel>
      </PageTabs>

      <HskImportWizard
        open={importOpen}
        existingTypeCodes={localTypes.map((t) => t.hskTypeCode)}
        onClose={() => setImportOpen(false)}
        onImported={(result) => {
          importAnalyzeResultAsTemplate(store, result);
          refresh();
          showToast(`已导入模板：${result.examMeta.title}（可在试卷管理查看）`);
        }}
      />
      {toast && activeTab !== 'types' && <div className="hsk-toast show">{toast}</div>}

      {editingQuestion && (
        <HskQuestionPayloadEditor
          open
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSave={(next) => {
            const updated = localQuestions.map((q) => (q.question_uid === next.question_uid ? next : q));
            setLocalQuestions(updated);
            upsertQuestions(store, updated);
            showToast(`已保存 ${next.question_uid} Payload`);
            setEditingQuestion(null);
          }}
        />
      )}
    </>
  );
}
