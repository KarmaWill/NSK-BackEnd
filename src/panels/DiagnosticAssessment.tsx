import { useEffect, useMemo, useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import {
  type DiagnosticQuestion,
  parseDiagnosticQuestionBankCsv,
} from '../utils/parseHskQuestionCsv';

const TABS = [
  { id: 'basic', label: '基础配置' },
  { id: 'scope', label: '题目范围' },
  { id: 'grading', label: '分级规则' },
] as const;

type GradingRule = {
  id: string;
  minScore: number;
  maxScore: number;
  hskLevel: string;
  label: string;
  recommendation: string;
};

const DEFAULT_GRADING: GradingRule[] = [
  { id: 'g1', minScore: 0, maxScore: 19, hskLevel: 'HSK1', label: '入门 · HSK 1', recommendation: '从 HSK1 课程与基础词汇开始系统学习。' },
  { id: 'g2', minScore: 20, maxScore: 39, hskLevel: 'HSK2', label: '初级 · HSK 2', recommendation: '巩固日常场景句型，可进入 HSK2 单元练习。' },
  { id: 'g3', minScore: 40, maxScore: 59, hskLevel: 'HSK3', label: '进阶 · HSK 3', recommendation: '加强阅读与听力，建议完成 HSK3 综合测评。' },
  { id: 'g4', minScore: 60, maxScore: 79, hskLevel: 'HSK4', label: '中级 · HSK 4', recommendation: '拓展长句表达，进入 HSK4 深度学习模块。' },
  { id: 'g5', minScore: 80, maxScore: 100, hskLevel: 'HSK5', label: '高级 · HSK 5', recommendation: '保持高频练习，可挑战 HSK5 模考与写作 Rater。' },
];

function getHskBadgeClass(level: number) {
  const classes: Record<number, string> = {
    1: 'hsk-badge-1',
    2: 'hsk-badge-2',
    3: 'hsk-badge-3',
    4: 'hsk-badge-4',
    5: 'hsk-badge-5',
    6: 'hsk-badge-6',
  };
  return classes[level] || 'hsk-badge-1';
}

function shortTypeCode(code: string) {
  const m = code.match(/T\d+_[A-Z_]+/);
  return m ? m[0].replace(/^T\d+_/, '') : code;
}

function formatOptionPreview(opt: { text: string; pinyin: string; image: string; translation: string }) {
  if (opt.image) return opt.image;
  if (opt.text && opt.pinyin) return `${opt.text} (${opt.pinyin})`;
  if (opt.text) return opt.text;
  if (opt.translation) return opt.translation;
  return '—';
}

function QuestionPreview({ q }: { q: DiagnosticQuestion | null }) {
  if (!q) {
    return (
      <div className="diagnostic-preview-empty">
        从左侧列表选择一题，查看题干、选项与解析预览。
      </div>
    );
  }

  const allOptions = [
    ...q.correctOptions.map((o) => ({ ...o, correct: true })),
    ...q.distractors.map((o) => ({ ...o, correct: false })),
  ];

  return (
    <div className="diagnostic-preview-inner">
      <div className="diagnostic-preview-meta">
        <span className={`hsk-badge ${getHskBadgeClass(q.hskLevelNum)}`}>{q.hskLevel}</span>
        <span className="diagnostic-preview-type">{q.typeName}</span>
        <span className="diagnostic-preview-id">{q.resourceId}</span>
      </div>
      <h3 className="diagnostic-preview-title">{q.title || '（无标题）'}</h3>
      {q.audioId && (
        <div className="diagnostic-preview-row">
          <span className="diagnostic-preview-label">音频</span>
          <code>{q.audioId}</code>
        </div>
      )}
      {(q.stemText || q.stemImage || q.stemTranslation) && (
        <div className="diagnostic-preview-row">
          <span className="diagnostic-preview-label">题干</span>
          <div>
            {q.stemImage && <div className="diagnostic-preview-image-ref">{q.stemImage}</div>}
            {q.stemText && <div>{q.stemText}</div>}
            {q.stemPinyin && <div className="diagnostic-preview-pinyin">{q.stemPinyin}</div>}
            {q.stemTranslation && <div className="text-muted">{q.stemTranslation}</div>}
          </div>
        </div>
      )}
      {q.knowledgePoint && (
        <div className="diagnostic-preview-row">
          <span className="diagnostic-preview-label">知识点</span>
          <span>{q.knowledgePoint}</span>
        </div>
      )}
      {allOptions.length > 0 && (
        <div className="diagnostic-preview-options">
          <span className="diagnostic-preview-label">选项</span>
          <ul>
            {allOptions.map((opt, i) => (
              <li key={i} className={opt.correct ? 'diagnostic-option-correct' : ''}>
                {opt.correct && <span className="diagnostic-option-tag">正确</span>}
                {formatOptionPreview(opt)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {q.explanation && (
        <div className="diagnostic-preview-explain">
          <span className="diagnostic-preview-label">解析</span>
          <p>{q.explanation}</p>
          {q.explanationEn && <p className="text-muted">{q.explanationEn}</p>}
        </div>
      )}
    </div>
  );
}

export function DiagnosticAssessment() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterHsk, setFilterHsk] = useState<number | null>(null);
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [entryTitle, setEntryTitle] = useState('入门诊断');
  const [entrySubtitle, setEntrySubtitle] = useState('约 15 分钟 · 自适应选题 · 给出推荐 HSK 起点');
  const [resultTitle, setResultTitle] = useState('你的中文起点');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [questionCount, setQuestionCount] = useState(20);
  const [gradingRules, setGradingRules] = useState<GradingRule[]>(DEFAULT_GRADING);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/hsk-question-bank.csv');
        if (!res.ok) throw new Error(`加载题库失败 (${res.status})`);
        const text = await res.text();
        const parsed = parseDiagnosticQuestionBankCsv(text);
        if (cancelled) return;
        setQuestions(parsed);
        setSelectedIds(new Set(parsed.map((q) => q.resourceId)));
        if (parsed.length > 0) setPreviewId(parsed[0].resourceId);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const typeOptions = useMemo(() => {
    const set = new Set(questions.map((q) => q.typeName));
    return Array.from(set).sort();
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchHsk = filterHsk === null || q.hskLevelNum === filterHsk;
      const matchType = !filterType || q.typeName === filterType;
      const qLower = searchQuery.toLowerCase();
      const matchSearch =
        !qLower ||
        q.resourceId.toLowerCase().includes(qLower) ||
        q.knowledgePoint.toLowerCase().includes(qLower) ||
        q.typeName.toLowerCase().includes(qLower) ||
        q.title.toLowerCase().includes(qLower);
      return matchHsk && matchType && matchSearch;
    });
  }, [questions, filterHsk, filterType, searchQuery]);

  const previewQuestion = questions.find((q) => q.resourceId === previewId) ?? null;

  const stats = useMemo(() => {
    const byLevel: Record<number, number> = {};
    const types = new Set<string>();
    for (const q of questions) {
      byLevel[q.hskLevelNum] = (byLevel[q.hskLevelNum] ?? 0) + 1;
      types.add(q.typeCode);
    }
    return {
      total: questions.length,
      selected: selectedIds.size,
      typeCount: types.size,
      byLevel,
    };
  }, [questions, selectedIds]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const ids = filteredQuestions.map((q) => q.resourceId);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const updateGrading = (id: string, patch: Partial<GradingRule>) => {
    setGradingRules((rules) => rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleSave = () => {
    showToast(`已保存：${selectedIds.size} 题入池 · ${questionCount} 题/次 · ${gradingRules.length} 条分级规则`);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">入门诊断</div>
          <div className="page-subtitle">C-Lingo 官网 · 入门诊断测评配置 · 题库来自全库 CSV</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={handleSave}>保存配置</button>
        </div>
      </div>

      {loadError && (
        <div className="card" style={{ marginBottom: 12, borderColor: 'var(--rose)' }}>
          <div className="card-body" style={{ color: 'var(--rose)' }}>{loadError}</div>
        </div>
      )}

      <div className="hsk-stats-row" style={{ marginBottom: 16 }}>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">题库总量</div>
          <div className="hsk-stat-value">{loading ? '…' : stats.total}<span className="hsk-stat-unit">题</span></div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">已选入测评池</div>
          <div className="hsk-stat-value">{stats.selected}<span className="hsk-stat-unit">题</span></div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">每次抽题数</div>
          <div className="hsk-stat-value">{questionCount}<span className="hsk-stat-unit">题</span></div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">覆盖题型编码</div>
          <div className="hsk-stat-value">{stats.typeCount}<span className="hsk-stat-unit">种</span></div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">HSK 级别分布</div>
          <div className="hsk-stat-value" style={{ fontSize: 13, fontFamily: 'inherit' }}>
            {[1, 2, 3, 4, 5].map((lv) => (
              <span key={lv} style={{ marginRight: 8 }}>
                {lv}:{stats.byLevel[lv] ?? 0}
              </span>
            ))}
          </div>
        </div>
      </div>

      <PageTabs tabs={[...TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        <PageTabPanel id="basic" activeTab={activeTab}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">测评入口与结果展示</div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">入口标题</label>
                  <input className="form-input" value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">结果页标题</label>
                  <input className="form-input" value={resultTitle} onChange={(e) => setResultTitle(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">入口副文案</label>
                <input className="form-input" value={entrySubtitle} onChange={(e) => setEntrySubtitle(e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">单次题量</label>
                  <input
                    type="number"
                    className="form-input"
                    min={5}
                    max={50}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Math.max(5, Math.min(50, Number(e.target.value) || 20)))}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', gap: 20, alignItems: 'flex-end', paddingBottom: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
                    答题时显示拼音
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={showTranslation} onChange={(e) => setShowTranslation(e.target.checked)} />
                    结果页显示英文释义
                  </label>
                </div>
              </div>
              <p className="text-muted" style={{ margin: '12px 0 0', fontSize: 13 }}>
                题目从「题目范围」Tab 勾选的题库池随机抽取；分级结果由「分级规则」Tab 的分数区间映射。
              </p>
            </div>
          </div>
        </PageTabPanel>

        <PageTabPanel id="scope" activeTab={activeTab}>
          <div className="paper-filter-bar">
            <div className="filter-group">
              <span className="filter-label">HSK级别:</span>
              <select value={filterHsk ?? ''} onChange={(e) => setFilterHsk(e.target.value ? Number(e.target.value) : null)}>
                <option value="">全部</option>
                {[1, 2, 3, 4, 5].map((lv) => (
                  <option key={lv} value={lv}>HSK {lv}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">题型:</span>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">全部题型</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <span className="filter-label">搜索:</span>
              <input
                type="text"
                className="search-input"
                placeholder="资源ID、知识点、标题…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={toggleSelectAllFiltered}>
              {filteredQuestions.every((q) => selectedIds.has(q.resourceId)) ? '取消全选' : '全选当前筛选'}
            </button>
            <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-light)' }}>
              显示 {filteredQuestions.length} / 已选 {selectedIds.size}
            </div>
          </div>

          <div className="diagnostic-scope-layout">
            <div className="paper-table-container diagnostic-table-wrap">
              <table className="paper-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }} />
                    <th style={{ width: 88 }}>资源ID</th>
                    <th style={{ width: 72 }}>级别</th>
                    <th style={{ width: 100 }}>题型</th>
                    <th>知识点 / 标题</th>
                    <th style={{ width: 100 }}>编码</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-light)' }}>
                        正在加载题库…
                      </td>
                    </tr>
                  ) : filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-light)' }}>
                        无匹配题目
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q) => (
                      <tr
                        key={q.resourceId}
                        className={previewId === q.resourceId ? 'diagnostic-row-active' : ''}
                        onClick={() => setPreviewId(q.resourceId)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(q.resourceId)}
                            onChange={() => toggleSelect(q.resourceId)}
                          />
                        </td>
                        <td><code style={{ fontSize: 12 }}>{q.resourceId}</code></td>
                        <td><span className={`hsk-badge ${getHskBadgeClass(q.hskLevelNum)}`}>{q.hskLevel}</span></td>
                        <td>{q.typeName}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{q.knowledgePoint || '—'}</div>
                          <div className="text-muted" style={{ fontSize: 12, marginTop: 2 }}>{q.title}</div>
                        </td>
                        <td style={{ fontSize: 11, fontFamily: 'JetBrains Mono' }}>{shortTypeCode(q.typeCode)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="card diagnostic-preview-card">
              <div className="card-header">
                <div className="card-title">题目预览</div>
              </div>
              <div className="card-body">
                <QuestionPreview q={previewQuestion} />
              </div>
            </div>
          </div>
        </PageTabPanel>

        <PageTabPanel id="grading" activeTab={activeTab}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">分数区间 → 推荐 HSK 起点</div>
              <span className="text-muted" style={{ fontSize: 13 }}>区间不可重叠，满分 100</span>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              <div className="paper-table-container">
                <table className="paper-table">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>分数下限</th>
                      <th style={{ width: 100 }}>分数上限</th>
                      <th style={{ width: 100 }}>映射级别</th>
                      <th style={{ width: 160 }}>结果标签</th>
                      <th>推荐说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradingRules.map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            min={0}
                            max={100}
                            value={rule.minScore}
                            onChange={(e) => updateGrading(rule.id, { minScore: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            min={0}
                            max={100}
                            value={rule.maxScore}
                            onChange={(e) => updateGrading(rule.id, { maxScore: Number(e.target.value) })}
                          />
                        </td>
                        <td>
                          <select
                            className="form-input form-select"
                            style={{ padding: '6px 8px' }}
                            value={rule.hskLevel}
                            onChange={(e) => updateGrading(rule.id, { hskLevel: e.target.value })}
                          >
                            {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map((lv) => (
                              <option key={lv} value={lv}>{lv}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            value={rule.label}
                            onChange={(e) => updateGrading(rule.id, { label: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="form-input"
                            style={{ padding: '6px 8px' }}
                            value={rule.recommendation}
                            onChange={(e) => updateGrading(rule.id, { recommendation: e.target.value })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </PageTabPanel>
      </PageTabs>

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
