import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { HskQuestionListTable } from '../components/HskQuestionListTable';
import { HskQuestionTypeSelect } from '../components/HskQuestionTypeSelect';
import { HskQuestionTypeCard } from '../components/HskQuestionTypeCard';
import { HskTagManager } from '../components/HskTagManager';
import { useHskStore } from '../hooks/useHskStore';
import {
  mergeTypeCounts,
  syncQuestionBankLocalCache,
} from '../stores/hskExams';
import type {
  HskLevelCode,
  HskQuestionRow,
  HskQuestionStatus,
  HskQuestionTag,
  HskQuestionTagCatalog,
  HskQuestionTypeCode,
  HskQuestionTypeDef,
  HskSectionModule,
} from '../types/hskExams';
import { DEFAULT_HSK_QUESTION_TAG_CATALOG, HSK_QUESTION_LEVELS } from '../types/hskExams';
import { HSK_QUESTION_STATUS_FILTER_OPTIONS } from '../config/hskQuestionWorkflow';
import { filterHskQuestionRows } from '../utils/hskQuestionBankFilters';
import { buildDefaultQuestionOptions, isLegacyGenericTypeId } from '../config/hskQuestionTypes';
import * as questionBankApi from '../services/assessmentExamBankApi';
import { HskQuestionEditPage } from './HskQuestionEditPage';
import { HskQuestionPreviewPage } from './HskQuestionPreviewPage';
import { createQuestionDetailRoute, type HskQuestionDetailRoute } from '../utils/hskQuestionDetailRoute';
import { persistHskQuestionWithLocalSync } from '../utils/hskQuestionPersistence';

const QUESTION_BANK_TABS = [
  { id: 'questions', label: '题目列表' },
  { id: 'types', label: '题型管理' },
  { id: 'tags', label: '标签管理' },
] as const;

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '题库接口请求失败';
}

function buildTagPatch(previous: HskQuestionTag, next: HskQuestionTag): Partial<HskQuestionTag> | null {
  const patch: Partial<HskQuestionTag> = {};
  if (previous.label !== next.label) patch.label = next.label;
  if ((previous.description ?? '') !== (next.description ?? '')) {
    patch.description = next.description;
  }
  if ((previous.category ?? '') !== (next.category ?? '')) {
    patch.category = next.category;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

function waitForSynchronousCatalogChange(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

export function HskQuestionBank() {
  const { store } = useHskStore({ initialServerRefresh: false });
  const [activeTab, setActiveTab] = useState<string>('questions');
  const [selectedSection, setSelectedSection] = useState<HskSectionModule | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<HskQuestionTypeCode | 'all'>('all');
  const [questionLevelFilter, setQuestionLevelFilter] = useState<HskLevelCode | 'all'>('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState<HskQuestionStatus | 'all'>('all');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [questionTagFilter, setQuestionTagFilter] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [questionDetail, setQuestionDetail] = useState<HskQuestionDetailRoute | null>(null);
  const [localTypes, setLocalTypes] = useState(store.questionTypes);
  const [localQuestions, setLocalQuestions] = useState(store.questions);
  const [localTags, setLocalTags] = useState(store.tags);
  const [localTagCatalog, setLocalTagCatalog] = useState(
    store.tagCatalog ?? DEFAULT_HSK_QUESTION_TAG_CATALOG,
  );
  const [remoteLoading, setRemoteLoading] = useState(false);
  const pendingCatalogSyncRef = useRef<{ removedCategories: Set<string> } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const applyQuestionBankLocalState = useCallback((input: {
    questionTypes?: HskQuestionTypeDef[];
    questions?: HskQuestionRow[];
    tags?: HskQuestionTag[];
    tagCatalog?: HskQuestionTagCatalog;
  }) => {
    const nextTypes = input.questionTypes ?? localTypes;
    const nextQuestions = input.questions ?? localQuestions;
    const nextTags = input.tags ?? localTags;
    const nextTagCatalog = input.tagCatalog ?? localTagCatalog;

    if (input.questionTypes !== undefined) setLocalTypes(input.questionTypes);
    if (input.questions !== undefined) setLocalQuestions(input.questions);
    if (input.tags !== undefined) setLocalTags(input.tags);
    if (input.tagCatalog !== undefined) setLocalTagCatalog(input.tagCatalog);

    syncQuestionBankLocalCache({
      questionTypes: nextTypes,
      questions: nextQuestions,
      tags: nextTags,
      tagCatalog: nextTagCatalog,
    });
  }, [localTagCatalog, localQuestions, localTags, localTypes]);

  const loadFormalQuestionBank = useCallback(async () => {
    setRemoteLoading(true);
    try {
      const [questionTypesData, questionsData, tagsData, tagCatalogData] = await Promise.all([
        questionBankApi.listQuestionTypes(),
        questionBankApi.listQuestions(),
        questionBankApi.listTags(),
        questionBankApi.getTagCatalog(),
      ]);

      setLocalTypes(questionTypesData);
      setLocalQuestions(questionsData);
      setLocalTags(tagsData);
      setLocalTagCatalog(tagCatalogData);
      syncQuestionBankLocalCache({
        questionTypes: questionTypesData,
        questions: questionsData,
        tags: tagsData,
        tagCatalog: tagCatalogData,
      });
      return true;
    } catch (err) {
      showToast(errorMessage(err));
      return false;
    } finally {
      setRemoteLoading(false);
    }
  }, [showToast]);

  const syncTagsWithApi = useCallback(async (
    previousTags: HskQuestionTag[],
    nextTags: HskQuestionTag[],
  ) => {
    const previousById = new Map(previousTags.map((tag) => [tag.id, tag]));
    const nextById = new Map(nextTags.map((tag) => [tag.id, tag]));
    let syncedTags = nextTags;

    for (const tag of previousTags) {
      if (!nextById.has(tag.id)) {
        await questionBankApi.deleteTag(tag.id);
      }
    }

    for (const tag of nextTags) {
      const previous = previousById.get(tag.id);
      if (!previous) continue;
      const patch = buildTagPatch(previous, tag);
      if (!patch) continue;
      const updated = await questionBankApi.patchTag(tag.id, patch);
      syncedTags = syncedTags.map((item) => (item.id === tag.id ? updated : item));
    }

    for (const tag of nextTags) {
      if (previousById.has(tag.id)) continue;
      const created = await questionBankApi.createTag(tag);
      syncedTags = syncedTags.map((item) => (item.id === tag.id ? created : item));
    }

    return syncedTags;
  }, []);

  const handleGlobalTagsChange = useCallback(async (nextTags: HskQuestionTag[]) => {
    const nextTagIds = new Set(nextTags.map((tag) => tag.id));
    const removedTags = localTags.filter((tag) => !nextTagIds.has(tag.id));
    const labelSet = new Set(nextTags.map((tag) => tag.label));
    const nextQuestions = localQuestions.map((question) => ({
      ...question,
      tags: question.tags.filter((label) => labelSet.has(label)),
    }));

    if (removedTags.length > 0) {
      await waitForSynchronousCatalogChange();
      const catalogSync = pendingCatalogSyncRef.current;
      if (
        catalogSync &&
        removedTags.every((tag) => tag.category && catalogSync.removedCategories.has(tag.category))
      ) {
        applyQuestionBankLocalState({ questions: nextQuestions, tags: nextTags });
        return;
      }
    }

    try {
      const syncedTags = await syncTagsWithApi(localTags, nextTags);
      applyQuestionBankLocalState({ questions: nextQuestions, tags: syncedTags });
    } catch (err) {
      showToast(errorMessage(err));
      void loadFormalQuestionBank();
    }
  }, [
    applyQuestionBankLocalState,
    loadFormalQuestionBank,
    localQuestions,
    localTags,
    showToast,
    syncTagsWithApi,
  ]);

  const handleTagCatalogChange = useCallback(async (nextCatalog: HskQuestionTagCatalog) => {
    const nextCustomCategories = new Set(nextCatalog.customCategories);
    const removedCategories = new Set(
      localTagCatalog.customCategories.filter((category) => !nextCustomCategories.has(category)),
    );
    const catalogSync = removedCategories.size > 0 ? { removedCategories } : null;
    pendingCatalogSyncRef.current = catalogSync;

    try {
      const updatedCatalog = await questionBankApi.patchTagCatalog(nextCatalog);
      applyQuestionBankLocalState({ tagCatalog: updatedCatalog });
      await loadFormalQuestionBank();
    } catch (err) {
      showToast(errorMessage(err));
      void loadFormalQuestionBank();
    } finally {
      if (pendingCatalogSyncRef.current === catalogSync) {
        pendingCatalogSyncRef.current = null;
      }
    }
  }, [applyQuestionBankLocalState, loadFormalQuestionBank, localTagCatalog, showToast]);

  useEffect(() => {
    setLocalTypes(store.questionTypes);
    setLocalQuestions(store.questions);
    setLocalTags(store.tags);
    setLocalTagCatalog(store.tagCatalog ?? DEFAULT_HSK_QUESTION_TAG_CATALOG);
  }, [store]);

  useEffect(() => {
    void loadFormalQuestionBank();
  }, [loadFormalQuestionBank]);

  const questionTypes = useMemo(
    () =>
      mergeTypeCounts(
        localTypes.filter((t) => !isLegacyGenericTypeId(t.id)),
        localQuestions,
      ),
    [localTypes, localQuestions],
  );

  const sectionCounts = useMemo(() => {
    const listening = questionTypes.filter((t) => t.section === 'listening').length;
    const reading = questionTypes.filter((t) => t.section === 'reading').length;
    const writing = questionTypes.filter((t) => t.section === 'writing').length;
    return { all: questionTypes.length, listening, reading, writing };
  }, [questionTypes]);

  const updateQuestionStatus = async (question: HskQuestionRow, status: HskQuestionStatus) => {
    try {
      const next = await questionBankApi.patchQuestionStatus(question.question_uid, status);
      const updated = localQuestions.map((q) =>
        q.question_uid === next.question_uid ? next : q,
      );
      applyQuestionBankLocalState({ questions: updated });
      if (next.status === 'pending_review') {
        showToast(`已提交审核 ${next.question_uid}`);
      } else if (next.status === 'pending_publish') {
        showToast(`已审核，${next.question_uid} 进入待发布`);
      } else if (next.status === 'published') {
        showToast(`已发布 ${next.question_uid}`);
      } else {
        showToast(`已保存草稿 ${next.question_uid}`);
      }
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const toastNode = toast ? <div className="hsk-toast show">{toast}</div> : null;

  if (questionDetail?.mode === 'preview') {
    return (
      <>
        <HskQuestionPreviewPage
          question={questionDetail.question}
          types={localTypes}
          onBack={() => setQuestionDetail(null)}
        />
        {toastNode}
      </>
    );
  }

  if (questionDetail?.mode === 'edit') {
    return (
      <>
        <HskQuestionEditPage
          question={questionDetail.question}
          types={localTypes}
          tags={localTags}
          tagCatalog={localTagCatalog}
          onBack={() => setQuestionDetail(null)}
          onGlobalTagsChange={handleGlobalTagsChange}
          onTagCatalogChange={handleTagCatalogChange}
          onSave={async (next) => {
            const editingQuestion = questionDetail.question;
            try {
              const isNewQuestion = !next.question_uid.trim();
              const { saved, localSyncError } = await persistHskQuestionWithLocalSync(
                next,
                {
                  create: questionBankApi.createQuestion,
                  update: questionBankApi.patchQuestion,
                },
                (persisted) => {
                  const updated = isNewQuestion
                    ? [...localQuestions, persisted]
                    : localQuestions.map((q) =>
                        q.question_uid === persisted.question_uid ? persisted : q,
                      );
                  applyQuestionBankLocalState({ questions: updated });
                },
              );
              if (localSyncError) {
                console.warn('题目已保存到后端，但浏览器本地缓存同步失败。', localSyncError);
              }
              showToast(
                saved.status === 'published'
                  ? `已发布 ${saved.question_uid}`
                  : saved.status === 'pending_review'
                    ? `已提交审核 ${saved.question_uid}`
                    : saved.status === 'pending_publish'
                      ? `已保存为待发布 ${saved.question_uid}`
                      : `已保存草稿 ${saved.question_uid}`,
              );
              setQuestionDetail((current) =>
                current?.mode === 'edit' && current.question === editingQuestion
                  ? null
                  : current,
              );
            } catch (err) {
              showToast(errorMessage(err));
            }
          }}
        />
        {toastNode}
      </>
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

  const filteredQuestions = filterHskQuestionRows({
    questions: localQuestions,
    types: localTypes,
    tags: localTags,
    typeFilter: questionTypeFilter,
    levelFilter: questionLevelFilter,
    statusFilter: questionStatusFilter,
    tagFilter: questionTagFilter,
    difficultyFilter: questionDifficultyFilter,
    searchQuery: questionSearch,
  });


  const createQuestion = () => {
    const typeId = questionTypeFilter === 'all' ? 'L01' : questionTypeFilter;
    const typeDef = localTypes.find((type) => type.id === typeId);
    const levelNumber = typeDef?.hskLevels.find((level) => level === 1 || level === 2) ?? 1;
    const defaultOptions = buildDefaultQuestionOptions(typeDef?.defaultOptionCount);
    const row: HskQuestionRow = {
      question_uid: '',
      type_id: typeId,
      level: `HSK${levelNumber}` as HskLevelCode,
      tags: [],
      stem: '新题目题干',
      options: defaultOptions,
      correctAnswer: 'A',
      explanation: '',
      score: typeDef?.defaultScore ?? 0,
      payload: {
        content: { phrase: '' },
        runtimeOptions: defaultOptions.map((option) => ({ key: option.label })),
      },
      audioStatus: 'none',
      imageStatus: 'none',
      linked_courses: [],
      linked_papers: [],
      linked_videos: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setQuestionDetail(createQuestionDetailRoute('edit', row));
  };

  const deleteQuestion = async (question: HskQuestionRow) => {
    if (!window.confirm(`确定删除题目 ${question.question_uid}？`)) return;
    try {
      await questionBankApi.deleteQuestion(question.question_uid);
      const next = localQuestions.filter((q) => q.question_uid !== question.question_uid);
      applyQuestionBankLocalState({ questions: next });
      showToast(`已删除 ${question.question_uid}`);
    } catch (err) {
      showToast(errorMessage(err));
    }
  };

  const typesPanel = (
    <div className="hsk-type-mgmt">
      <div className="hsk-type-mgmt-toolbar">
        <div>
          <h2 className="hsk-type-mgmt-page-title">题型管理</h2>
          <p className="hsk-type-mgmt-lead">
            查看 HSK1-2 一期固定题型及其结构
          </p>
        </div>
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
            className="btn btn-primary btn-sm"
            onClick={createQuestion}
            disabled={remoteLoading}
          >
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
          <HskQuestionTypeSelect
            value={questionTypeFilter}
            types={questionTypes}
            onChange={setQuestionTypeFilter}
            className="hsk-question-list-filter-type-select"
          />
          <select
            className="hsk-question-list-filter-select"
            value={questionLevelFilter}
            onChange={(e) => setQuestionLevelFilter(e.target.value as HskLevelCode | 'all')}
          >
            <option value="all">全部等级</option>
            {HSK_QUESTION_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          <select
            className="hsk-question-list-filter-select"
            value={questionStatusFilter}
            onChange={(e) => setQuestionStatusFilter(e.target.value as HskQuestionStatus | 'all')}
          >
            {HSK_QUESTION_STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
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
        onEdit={(question) => setQuestionDetail(createQuestionDetailRoute('edit', question))}
        onPreview={(question) => setQuestionDetail(createQuestionDetailRoute('preview', question))}
        onDelete={(question) => void deleteQuestion(question)}
        onStatusChange={(question, status) => void updateQuestionStatus(question, status)}
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
        void (async () => {
          try {
            const syncedTags = await syncTagsWithApi(localTags, nextTags);
            applyQuestionBankLocalState({ questions: nextQuestions, tags: syncedTags });
          } catch (err) {
            showToast(errorMessage(err));
            void loadFormalQuestionBank();
          }
        })();
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

      {toast && activeTab !== 'types' && <div className="hsk-toast show">{toast}</div>}
    </>
  );
}
