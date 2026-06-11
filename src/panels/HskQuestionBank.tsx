import { useEffect, useMemo, useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { HskImportWizard } from '../components/HskImportWizard';
import { HskQuestionListTable } from '../components/HskQuestionListTable';
import { HskQuestionTypeCard } from '../components/HskQuestionTypeCard';
import { HskTagManager } from '../components/HskTagManager';
import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import { useHskStore } from '../hooks/useHskStore';
import {
  importAnalyzeResultAsTemplate,
  mergeTypeCounts,
  upsertQuestionTypes,
  upsertQuestions,
} from '../stores/hskExams';
import type { HskLevelCode, HskQuestionRow, HskQuestionTypeCode, HskQuestionTypeDef, HskSectionModule } from '../types/hskExams';
import { HskQuestionConfig } from './HskQuestionConfig';
import { HskQuestionEditPage } from './HskQuestionEditPage';

const QUESTION_BANK_TABS = [
  { id: 'types', label: '题型管理' },
  { id: 'questions', label: '题目列表' },
  { id: 'tags', label: '标签管理' },
] as const;

export function HskQuestionBank() {
  const { store, refresh } = useHskStore();
  const [activeTab, setActiveTab] = useState<string>('types');
  const [selectedSection, setSelectedSection] = useState<HskSectionModule | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<HskQuestionTypeCode | 'all'>('all');
  const [questionLevelFilter, setQuestionLevelFilter] = useState<HskLevelCode | 'all'>('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [questionTagFilter, setQuestionTagFilter] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<HskQuestionRow | null>(null);
  const [configMode, setConfigMode] = useState<HskQuestionTypeCode | null>(null);
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

  const sectionCounts = useMemo(() => {
    const listening = questionTypes.filter((t) => t.section === 'listening').length;
    const reading = questionTypes.filter((t) => t.section === 'reading').length;
    const writing = questionTypes.filter((t) => t.section === 'writing').length;
    return { all: questionTypes.length, listening, reading, writing };
  }, [questionTypes]);

  const duplicateQuestionType = (source: HskQuestionTypeDef) => {
    const name = window.prompt('新题型名称', `${source.name}（副本）`);
    if (!name?.trim()) return;
    const idRaw = window.prompt('新题型 ID（如 L07、R08）', `${source.id}_NEW`);
    if (!idRaw?.trim()) return;
    const id = idRaw.trim().toUpperCase() as HskQuestionTypeCode;
    if (localTypes.some((t) => t.id === id)) {
      showToast(`题型 ID ${id} 已存在`);
      return;
    }
    if (!/^[LRW]\d{2}$/.test(id)) {
      showToast('题型 ID 格式应为 L01、R01、W01 等');
      return;
    }
    const row: HskQuestionTypeDef = {
      ...source,
      id,
      hskTypeCode: id,
      name: name.trim(),
      isPublished: false,
      lastModified: new Date().toISOString().slice(0, 10),
    };
    const next = [...localTypes, row];
    setLocalTypes(next);
    upsertQuestionTypes({ ...store, questions: localQuestions, tags: localTags }, next);
    showToast(`已新建题型 ${id}：${name.trim()}`);
  };

  const deleteQuestionType = (id: HskQuestionTypeCode) => {
    const row = questionTypes.find((t) => t.id === id);
    if (!row) return;
    if (row.questionCount > 0) {
      showToast('该题型下还有题目，无法删除');
      return;
    }
    if (!window.confirm(`确定删除题型 ${id}（${row.name}）？`)) return;
    const next = localTypes.filter((t) => t.id !== id);
    setLocalTypes(next);
    upsertQuestionTypes({ ...store, questions: localQuestions, tags: localTags }, next);
    showToast(`已删除题型 ${id}`);
  };

  const createQuestionTypeFromTemplate = () => {
    const template = localTypes[0];
    if (!template) return;
    duplicateQuestionType(template);
  };

  useEffect(() => {
    if (configMode && !localTypes.some((t) => t.id === configMode)) {
      setConfigMode(null);
    }
  }, [configMode, localTypes]);

  if (editingQuestion) {
    return (
      <HskQuestionEditPage
        question={editingQuestion}
        types={localTypes}
        tags={localTags}
        onBack={() => setEditingQuestion(null)}
        onSave={(next) => {
          const updated = localQuestions.map((q) =>
            q.question_uid === next.question_uid ? next : q,
          );
          setLocalQuestions(updated);
          upsertQuestions({ ...store, tags: localTags }, updated);
          showToast(next.status === 'published' ? `已发布 ${next.question_uid}` : `已保存草稿 ${next.question_uid}`);
          setEditingQuestion(null);
        }}
      />
    );
  }

  if (configMode) {
    const editingType = localTypes.find((t) => t.id === configMode);
    if (editingType) {
      return (
        <HskQuestionConfig
          typeDef={editingType}
          otherTypeIds={localTypes.filter((t) => t.id !== editingType.id).map((t) => t.id)}
          onBack={() => setConfigMode(null)}
          onSave={(next) => {
            const nextTypes = localTypes.map((t) => (t.id === editingType.id ? next : t));
            setLocalTypes(nextTypes);
            upsertQuestionTypes({ ...store, questions: localQuestions, tags: localTags }, nextTypes);
            if (next.id !== editingType.id) {
              setConfigMode(next.id);
            }
          }}
        />
      );
    }
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
    if (questionTypeFilter !== 'all' && q.type_id !== questionTypeFilter) return false;
    if (questionLevelFilter !== 'all' && q.level !== questionLevelFilter) return false;
    if (questionStatusFilter !== 'all' && q.status !== questionStatusFilter) return false;
    if (questionTagFilter !== 'all') {
      const tag = localTags.find((t) => t.id === questionTagFilter);
      if (tag && !q.tags.includes(tag.label)) return false;
    }
    if (questionDifficultyFilter !== 'all') {
      const typeDef = localTypes.find((t) => t.id === q.type_id);
      const stars = (typeDef?.difficulty.match(/★/g) ?? []).length;
      if (String(stars) !== questionDifficultyFilter) return false;
    }
    if (!questionSearch.trim()) return true;
    const s = questionSearch.toLowerCase();
    return (
      q.question_uid.toLowerCase().includes(s) ||
      q.stem.toLowerCase().includes(s) ||
      q.type_id.toLowerCase().includes(s) ||
      q.level.toLowerCase().includes(s) ||
      q.tags.some((tag) => tag.toLowerCase().includes(s))
    );
  });

  const typeFilterLabel = (type: HskQuestionTypeDef) => {
    const reg = getRegistryEntry(type.id, defaultCompoundForType(type.id));
    return `${reg?.runtimeTypeName ?? type.name} (${type.id})`;
  };

  const createQuestion = () => {
    const typeId = questionTypeFilter === 'all' ? 'L01' : questionTypeFilter;
    const id = `Q-${String(localQuestions.length + 1).padStart(3, '0')}`;
    const row: HskQuestionRow = {
      question_uid: id,
      type_id: typeId,
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
  };

  const deleteQuestion = (question: HskQuestionRow) => {
    if (!window.confirm(`确定删除题目 ${question.question_uid}？`)) return;
    const next = localQuestions.filter((q) => q.question_uid !== question.question_uid);
    setLocalQuestions(next);
    upsertQuestions(store, next);
    showToast(`已删除 ${question.question_uid}`);
  };

  const typesPanel = (
    <div className="hsk-type-mgmt">
      <div className="hsk-type-mgmt-toolbar">
        <div>
          <h2 className="hsk-type-mgmt-page-title">题型管理</h2>
          <p className="hsk-type-mgmt-lead">
            管理题库的题型模板，可通过复制现有题型来创建新题型
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={createQuestionTypeFromTemplate}>
          + 新建题型
        </button>
      </div>

      <div className="hsk-type-mgmt-filters">
        <div className="hsk-type-mgmt-tabs" role="tablist" aria-label="题型分类">
          {(
            [
              { id: 'all' as const, label: '全部', count: sectionCounts.all, icon: null },
              { id: 'listening' as const, label: '听力', count: sectionCounts.listening, icon: '🎧' },
              { id: 'reading' as const, label: '阅读', count: sectionCounts.reading, icon: '📖' },
              { id: 'writing' as const, label: '写作', count: sectionCounts.writing, icon: '✍️' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selectedSection === tab.id}
              className={`hsk-type-mgmt-tab${selectedSection === tab.id ? ' active' : ''}`}
              onClick={() => setSelectedSection(tab.id)}
            >
              {tab.icon && <span className="hsk-type-mgmt-tab-icon" aria-hidden>{tab.icon}</span>}
              {tab.label}
              <span className="hsk-type-mgmt-tab-count">({tab.count})</span>
            </button>
          ))}
        </div>
        <div className="hsk-type-mgmt-search">
          <input
            type="search"
            className="search-input"
            placeholder="搜索题型 ID、名称或描述…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="hsk-type-mgmt-grid">
        {filteredTypes.map((qtype) => (
          <HskQuestionTypeCard
            key={qtype.id}
            qtype={qtype}
            onEdit={() => setConfigMode(qtype.id)}
            onDuplicate={() => duplicateQuestionType(qtype)}
            onDelete={() => deleteQuestionType(qtype.id)}
          />
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="hsk-type-mgmt-empty">没有匹配的题型，请调整筛选或搜索条件。</div>
      )}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );

  const questionsPanel = (
    <div className="hsk-question-list">
      <div className="hsk-question-list-header">
        <div>
          <h2 className="hsk-question-list-title">题目列表</h2>
          <p className="hsk-question-list-lead">
            管理题库中的所有题目，查看题目关联的课程、试卷和视频
          </p>
        </div>
        <div className="hsk-question-list-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => showToast('AI 批量生成功能开发中')}
          >
            AI 批量生成
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImportOpen(true)}>
            导入 PDF
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={createQuestion}>
            + 新建题目
          </button>
        </div>
      </div>

      <div className="hsk-question-list-filter-card">
        <div className="hsk-question-list-filter-row">
          <label className="hsk-question-list-filter-search-wrap">
            <span className="hsk-question-list-filter-search-icon" aria-hidden>🔍</span>
            <input
              type="search"
              className="hsk-question-list-filter-search"
              placeholder="搜索题目、标签或编号…"
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
            />
          </label>
          <select
            className="hsk-question-list-filter-select"
            value={questionTypeFilter}
            onChange={(e) => setQuestionTypeFilter(e.target.value as HskQuestionTypeCode | 'all')}
          >
            <option value="all">全部题型</option>
            {localTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {typeFilterLabel(type)}
              </option>
            ))}
          </select>
          <select
            className="hsk-question-list-filter-select"
            value={questionLevelFilter}
            onChange={(e) => setQuestionLevelFilter(e.target.value as HskLevelCode | 'all')}
          >
            <option value="all">全部等级</option>
            {(['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'] as HskLevelCode[]).map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            className="hsk-question-list-filter-select"
            value={questionStatusFilter}
            onChange={(e) => setQuestionStatusFilter(e.target.value as 'all' | 'published' | 'draft')}
          >
            <option value="all">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
          <select
            className="hsk-question-list-filter-select"
            value={questionDifficultyFilter}
            onChange={(e) => setQuestionDifficultyFilter(e.target.value as typeof questionDifficultyFilter)}
          >
            <option value="all">全部难度</option>
            <option value="1">★☆☆☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="3">★★★☆☆</option>
            <option value="4">★★★★☆</option>
            <option value="5">★★★★★</option>
          </select>
        </div>
        <div className="hsk-question-list-filter-row hsk-question-list-filter-row-secondary">
          <select
            className="hsk-question-list-filter-select hsk-question-list-filter-select-tags"
            value={questionTagFilter}
            onChange={(e) => setQuestionTagFilter(e.target.value)}
          >
            <option value="all">全部标签</option>
            {localTags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>
          <span className="hsk-question-list-result-count">共 {filteredQuestions.length} 题</span>
        </div>
      </div>

      <HskQuestionListTable
        questions={filteredQuestions}
        types={localTypes}
        onEdit={setEditingQuestion}
        onPreview={setEditingQuestion}
        onDelete={deleteQuestion}
      />

      {filteredQuestions.length === 0 && (
        <div className="hsk-type-mgmt-empty">没有匹配的题目，请调整筛选或新建题目。</div>
      )}
    </div>
  );

  const tagsPanel = (
    <HskTagManager
      tags={localTags}
      questions={localQuestions}
      onTagsChange={(nextTags, nextQuestions) => {
        setLocalTags(nextTags);
        setLocalQuestions(nextQuestions);
        upsertQuestions({ ...store, tags: nextTags }, nextQuestions);
      }}
      onToast={showToast}
      onNavigateToTag={(tagLabel) => {
        const tag = localTags.find((t) => t.label === tagLabel);
        if (!tag) return;
        setActiveTab('questions');
        setQuestionTagFilter(tag.id);
      }}
    />
  );

  return (
    <>
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
    </>
  );
}
