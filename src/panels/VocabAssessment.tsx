import { useEffect, useMemo, useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';

const TABS = [
  { id: 'basic', label: '基础配置' },
  { id: 'scope', label: '词汇范围' },
  { id: 'pass', label: '通过标准' },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VocabWord = {
  word: string;
  pinyin: string;
  pos: string;
};

type LevelBank = {
  words: VocabWord[];
  coverage: number;
};

type VocabBank = Record<string, LevelBank>;

type LevelConfig = {
  key: string;       // 'HSK1' … 'HSK6'
  enabled: boolean;
  questionCount: number;
  passScore: number; // 0–100, percentage correct to pass this level
  label: string;
  color: string;
  badgeClass: string;
};

type QuestionType = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const LEVEL_DEFAULTS: Omit<LevelConfig, 'enabled' | 'questionCount' | 'passScore'>[] = [
  { key: 'HSK1', label: 'HSK 1', color: '#16a34a', badgeClass: 'hsk-badge-1' },
  { key: 'HSK2', label: 'HSK 2', color: '#0891b2', badgeClass: 'hsk-badge-2' },
  { key: 'HSK3', label: 'HSK 3', color: '#7c3aed', badgeClass: 'hsk-badge-3' },
  { key: 'HSK4', label: 'HSK 4', color: '#ea580c', badgeClass: 'hsk-badge-4' },
  { key: 'HSK5', label: 'HSK 5', color: '#be185d', badgeClass: 'hsk-badge-5' },
  { key: 'HSK6', label: 'HSK 6', color: '#1e40af', badgeClass: 'hsk-badge-6' },
];

const QUESTION_TYPE_DEFAULTS: QuestionType[] = [
  { id: 'char_to_meaning', label: '认字选义', description: '看汉字 → 选英文释义', enabled: true },
  { id: 'meaning_to_char', label: '看义选字', description: '看英文释义 → 选正确汉字', enabled: true },
  { id: 'char_to_pinyin', label: '选拼音', description: '看汉字 → 选正确拼音', enabled: true },
  { id: 'pinyin_to_char', label: '拼音配字', description: '看拼音 → 选正确汉字', enabled: false },
  { id: 'fill_blank', label: '语境填空', description: '在句子中选择正确词汇', enabled: false },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function initLevels(): LevelConfig[] {
  return LEVEL_DEFAULTS.map((def) => ({
    ...def,
    enabled: ['HSK1', 'HSK2', 'HSK3'].includes(def.key),
    questionCount: def.key === 'HSK1' ? 8 : def.key === 'HSK2' ? 8 : def.key === 'HSK3' ? 10 : 12,
    passScore: 70,
  }));
}

function totalQuestions(levels: LevelConfig[]): number {
  return levels.filter((l) => l.enabled).reduce((s, l) => s + l.questionCount, 0);
}

function estimatedMinutes(qCount: number, secPerQ = 15): number {
  return Math.ceil((qCount * secPerQ) / 60);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LevelToggleCard({
  level,
  bankSize,
  coverage,
  onChange,
}: {
  level: LevelConfig;
  bankSize: number;
  coverage: number;
  onChange: (patch: Partial<LevelConfig>) => void;
}) {
  return (
    <div className={`vocab-level-card ${level.enabled ? 'enabled' : ''}`}>
      <div className="vocab-level-card-header">
        <span className={`hsk-badge ${level.badgeClass}`}>{level.label}</span>
        <label className="vocab-toggle">
          <input
            type="checkbox"
            checked={level.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span className="vocab-toggle-track" />
        </label>
      </div>
      <div className="vocab-level-stats">
        <div className="vocab-level-stat">
          <span className="vocab-level-stat-val">{bankSize.toLocaleString()}</span>
          <span className="vocab-level-stat-unit">词</span>
        </div>
        <div className="vocab-level-stat">
          <span className="vocab-level-stat-val">{coverage}</span>
          <span className="vocab-level-stat-unit">% 覆盖</span>
        </div>
      </div>
      <div className="vocab-level-config" style={{ opacity: level.enabled ? 1 : 0.4, pointerEvents: level.enabled ? 'auto' : 'none' }}>
        <label className="vocab-level-config-label">抽题数量</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="range"
            min={3}
            max={Math.min(30, bankSize)}
            value={level.questionCount}
            onChange={(e) => onChange({ questionCount: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span className="vocab-level-stat-val" style={{ minWidth: 24, textAlign: 'right' }}>
            {level.questionCount}
          </span>
        </div>
      </div>
    </div>
  );
}

function WordBrowser({
  bank,
  levels,
}: {
  bank: VocabBank;
  levels: LevelConfig[];
}) {
  const [activeLevelKey, setActiveLevelKey] = useState('HSK1');
  const [search, setSearch] = useState('');
  const [hoveredWord, setHoveredWord] = useState<VocabWord | null>(null);

  const levelWords = useMemo(() => {
    const data = bank[activeLevelKey]?.words ?? [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (w) =>
        w.word.includes(q) ||
        w.pinyin.toLowerCase().includes(q) ||
        w.pos.includes(q),
    );
  }, [bank, activeLevelKey, search]);

  const enabledKeys = levels.filter((l) => l.enabled).map((l) => l.key);

  return (
    <div className="vocab-browser">
      <div className="vocab-browser-sidebar">
        {LEVEL_DEFAULTS.map((def) => {
          const isEnabled = enabledKeys.includes(def.key);
          return (
            <button
              key={def.key}
              type="button"
              className={`vocab-browser-level-btn ${activeLevelKey === def.key ? 'active' : ''} ${!isEnabled ? 'disabled' : ''}`}
              onClick={() => setActiveLevelKey(def.key)}
            >
              <span className={`hsk-badge ${def.badgeClass}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                {def.key}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>
                {bank[def.key]?.words.length ?? '…'} 词
              </span>
              {!isEnabled && <span style={{ fontSize: 10, color: 'var(--ink-light)', marginLeft: 'auto' }}>未启用</span>}
            </button>
          );
        })}
      </div>
      <div className="vocab-browser-main">
        <div className="vocab-browser-search">
          <input
            type="text"
            className="search-input"
            placeholder="搜索汉字、拼音或词性…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>
            {levelWords.length} / {bank[activeLevelKey]?.words.length ?? 0} 词
          </span>
        </div>
        <div className="vocab-word-grid">
          {levelWords.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: 'var(--ink-light)' }}>
              无匹配词汇
            </div>
          ) : (
            levelWords.map((w) => (
              <div
                key={w.word}
                className={`vocab-word-chip ${hoveredWord?.word === w.word ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredWord(w)}
                onMouseLeave={() => setHoveredWord(null)}
              >
                <span className="vocab-chip-hanzi">{w.word}</span>
                <span className="vocab-chip-pinyin">{w.pinyin}</span>
              </div>
            ))
          )}
        </div>
      </div>
      {hoveredWord && (
        <div className="vocab-word-tooltip">
          <div className="vocab-tooltip-hanzi">{hoveredWord.word}</div>
          <div className="vocab-tooltip-pinyin">{hoveredWord.pinyin}</div>
          <div className="vocab-tooltip-pos">{hoveredWord.pos || '—'}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VocabAssessment() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const [bank, setBank] = useState<VocabBank>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<LevelConfig[]>(initLevels);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(QUESTION_TYPE_DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);

  // 基础配置
  const [entryTitle, setEntryTitle] = useState('词汇测评');
  const [entrySubtitle, setEntrySubtitle] = useState('测试你掌握的 HSK 词汇量，精准匹配学习起点');
  const [resultTitle, setResultTitle] = useState('你的词汇水平');
  const [showPinyin, setShowPinyin] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/data/hsk-vocab-bank.json');
        if (!res.ok) throw new Error(`加载词库失败 (${res.status})`);
        const data: VocabBank = await res.json();
        if (!cancelled) setBank(data);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const updateLevel = (key: string, patch: Partial<LevelConfig>) => {
    setLevels((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const toggleQType = (id: string) => {
    setQuestionTypes((prev) =>
      prev.map((qt) => (qt.id === id ? { ...qt, enabled: !qt.enabled } : qt)),
    );
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const totalQ = totalQuestions(levels);
  const enabledTypes = questionTypes.filter((q) => q.enabled).length;
  const totalBankSize = Object.values(bank).reduce((s, b) => s + b.words.length, 0);
  const enabledBankSize = levels
    .filter((l) => l.enabled)
    .reduce((s, l) => s + (bank[l.key]?.words.length ?? 0), 0);

  const handleSave = () => {
    const enabledLevels = levels.filter((l) => l.enabled).map((l) => l.label).join(' / ');
    showToast(`已保存：${enabledLevels} · 共 ${totalQ} 题 · ${enabledTypes} 种题型`);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">词汇测评</div>
          <div className="page-subtitle">C-Lingo 官网 · 词汇测评配置 · 词库 {loading ? '加载中…' : `${totalBankSize.toLocaleString()} 词`}</div>
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

      {/* Stats row */}
      <div className="hsk-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">词库总量</div>
          <div className="hsk-stat-value">
            {loading ? '…' : totalBankSize.toLocaleString()}
            <span className="hsk-stat-unit">词</span>
          </div>
          <div className="hsk-stat-progress">
            <div className="hsk-stat-fill" style={{ width: '100%', background: 'var(--teal)' }} />
          </div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">已启用词库</div>
          <div className="hsk-stat-value">
            {enabledBankSize.toLocaleString()}
            <span className="hsk-stat-unit">词</span>
          </div>
          <div className="hsk-stat-progress">
            <div
              className="hsk-stat-fill"
              style={{ width: `${totalBankSize ? Math.round((enabledBankSize / totalBankSize) * 100) : 0}%`, background: 'var(--teal)' }}
            />
          </div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">每次出题数</div>
          <div className="hsk-stat-value">
            {totalQ}
            <span className="hsk-stat-unit">题</span>
          </div>
          <div className="hsk-stat-progress">
            <div className="hsk-stat-fill" style={{ width: `${Math.min(100, totalQ * 2)}%`, background: 'var(--amber)' }} />
          </div>
        </div>
        <div className="hsk-stat-card">
          <div className="hsk-stat-label">预计时长</div>
          <div className="hsk-stat-value">
            {estimatedMinutes(totalQ)}
            <span className="hsk-stat-unit">分钟</span>
          </div>
          <div className="hsk-stat-progress">
            <div className="hsk-stat-fill" style={{ width: `${Math.min(100, estimatedMinutes(totalQ) * 5)}%`, background: 'var(--amber)' }} />
          </div>
        </div>
      </div>

      <PageTabs tabs={[...TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        {/* ───────────────────── Tab 1: 基础配置 ───────────────────── */}
        <PageTabPanel id="basic" activeTab={activeTab}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            {/* 入口与展示 */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">测评入口文案</div>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">入口标题</label>
                  <input className="form-input" value={entryTitle} onChange={(e) => setEntryTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">入口副文案</label>
                  <input className="form-input" value={entrySubtitle} onChange={(e) => setEntrySubtitle(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">结果页标题</label>
                  <input className="form-input" value={resultTitle} onChange={(e) => setResultTitle(e.target.value)} />
                </div>
              </div>
            </div>

            {/* 答题体验 */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">答题与结果展示</div>
              </div>
              <div className="card-body">
                <label className="vocab-switch-row">
                  <span>
                    <span className="vocab-switch-label">答题时显示拼音</span>
                    <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>在汉字旁展示拼音辅助</span>
                  </span>
                  <input type="checkbox" checked={showPinyin} onChange={(e) => setShowPinyin(e.target.checked)} />
                </label>
                <label className="vocab-switch-row">
                  <span>
                    <span className="vocab-switch-label">随机打乱选项顺序</span>
                    <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>每次选项顺序不同，避免记忆位置</span>
                  </span>
                  <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} />
                </label>
                <label className="vocab-switch-row" style={{ marginBottom: 0 }}>
                  <span>
                    <span className="vocab-switch-label">答错后显示解析</span>
                    <span className="text-muted" style={{ fontSize: 12, display: 'block' }}>展示词义与例句帮助记忆</span>
                  </span>
                  <input type="checkbox" checked={showExplanation} onChange={(e) => setShowExplanation(e.target.checked)} />
                </label>
              </div>
            </div>

            {/* 题型配置 */}
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <div className="card-title">题型组合</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  已启用 {enabledTypes} / {questionTypes.length} 种题型，系统随机混合出题
                </span>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div className="vocab-qtype-grid">
                  {questionTypes.map((qt) => (
                    <label key={qt.id} className={`vocab-qtype-card ${qt.enabled ? 'enabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={qt.enabled}
                        onChange={() => toggleQType(qt.id)}
                        style={{ display: 'none' }}
                      />
                      <div className="vocab-qtype-check">{qt.enabled ? '✓' : ''}</div>
                      <div>
                        <div className="vocab-qtype-name">{qt.label}</div>
                        <div className="vocab-qtype-desc">{qt.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PageTabPanel>

        {/* ───────────────────── Tab 2: 词汇范围 ───────────────────── */}
        <PageTabPanel id="scope" activeTab={activeTab}>
          {/* Level cards */}
          <div className="vocab-levels-grid" style={{ marginBottom: 16 }}>
            {levels.map((level) => (
              <LevelToggleCard
                key={level.key}
                level={level}
                bankSize={bank[level.key]?.words.length ?? 0}
                coverage={bank[level.key]?.coverage ?? 0}
                onChange={(patch) => updateLevel(level.key, patch)}
              />
            ))}
          </div>

          {/* Word browser */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">词库浏览</div>
              <span className="text-muted" style={{ fontSize: 13 }}>来自《HSK 3.0 生词测评等级表格》</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-light)' }}>
                  正在加载词库…
                </div>
              ) : (
                <WordBrowser bank={bank} levels={levels} />
              )}
            </div>
          </div>
        </PageTabPanel>

        {/* ───────────────────── Tab 3: 通过标准 ───────────────────── */}
        <PageTabPanel id="pass" activeTab={activeTab}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header">
                <div className="card-title">各级通过分数线</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  每级独立计算正确率；全部达标后展示通过结果页
                </span>
              </div>
              <div className="card-body" style={{ paddingTop: 0 }}>
                <div className="paper-table-container">
                  <table className="paper-table">
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>级别</th>
                        <th style={{ width: 100 }}>词库词数</th>
                        <th style={{ width: 100 }}>出题数量</th>
                        <th style={{ width: 160 }}>通过分数线</th>
                        <th>未达标时的提示文案</th>
                        <th style={{ width: 80 }}>启用</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levels.map((level) => (
                        <tr key={level.key} style={{ opacity: level.enabled ? 1 : 0.45 }}>
                          <td>
                            <span className={`hsk-badge ${level.badgeClass}`}>{level.label}</span>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                            {bank[level.key]?.words.length?.toLocaleString() ?? '—'}
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontSize: 13 }}>
                            {level.enabled ? level.questionCount : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="range"
                                min={30}
                                max={100}
                                step={5}
                                value={level.passScore}
                                disabled={!level.enabled}
                                onChange={(e) => updateLevel(level.key, { passScore: Number(e.target.value) })}
                                style={{ width: 80 }}
                              />
                              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, minWidth: 40 }}>
                                {level.passScore}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <input
                              className="form-input"
                              style={{ padding: '6px 8px', fontSize: 12 }}
                              disabled={!level.enabled}
                              defaultValue={`你的 ${level.label} 词汇还需加强，建议多刷该级别练习`}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={level.enabled}
                              onChange={(e) => updateLevel(level.key, { enabled: e.target.checked })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">综合判定规则</div>
              </div>
              <div className="card-body">
                <PassRuleConfig />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">结果推荐文案预览</div>
              </div>
              <div className="card-body">
                <ResultPreview levels={levels} />
              </div>
            </div>
          </div>
        </PageTabPanel>
      </PageTabs>

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Pass Rule Config
// ---------------------------------------------------------------------------
function PassRuleConfig() {
  const [rule, setRule] = useState<'all_pass' | 'any_pass' | 'weighted'>('all_pass');
  const [minLevels, setMinLevels] = useState(2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(
        [
          { id: 'all_pass', label: '全部达标', desc: '所有启用级别均需达到通过线' },
          { id: 'any_pass', label: '最低 N 级达标', desc: '至少通过指定数量的级别' },
          { id: 'weighted', label: '加权总分', desc: '按各级权重计算综合分，统一与阈值比较' },
        ] as const
      ).map((opt) => (
        <label key={opt.id} className={`vocab-rule-option ${rule === opt.id ? 'selected' : ''}`}>
          <input
            type="radio"
            name="pass-rule"
            checked={rule === opt.id}
            onChange={() => setRule(opt.id)}
          />
          <span>
            <span className="vocab-rule-label">{opt.label}</span>
            <span className="vocab-rule-desc">{opt.desc}</span>
          </span>
        </label>
      ))}
      {rule === 'any_pass' && (
        <div className="form-group" style={{ margin: '4px 0 0' }}>
          <label className="form-label">最少需通过级别数</label>
          <input
            type="number"
            className="form-input"
            min={1}
            max={6}
            value={minLevels}
            onChange={(e) => setMinLevels(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result Preview
// ---------------------------------------------------------------------------
function ResultPreview({ levels }: { levels: LevelConfig[] }) {
  const enabled = levels.filter((l) => l.enabled);
  if (enabled.length === 0) {
    return <p className="text-muted" style={{ margin: 0 }}>请先启用至少一个 HSK 级别。</p>;
  }

  const highestEnabled = enabled[enabled.length - 1];

  return (
    <div className="vocab-result-preview">
      <div className="vocab-result-preview-chip">
        <span className={`hsk-badge ${highestEnabled.badgeClass}`}>{highestEnabled.label}</span>
        <span className="vocab-result-preview-title">词汇测评完成</span>
      </div>
      <div className="vocab-result-levels">
        {enabled.map((l) => (
          <div key={l.key} className="vocab-result-row">
            <span className={`hsk-badge ${l.badgeClass}`} style={{ fontSize: 10, padding: '1px 6px' }}>{l.label}</span>
            <div className="vocab-result-bar">
              <div className="vocab-result-bar-fill" style={{ width: '72%', background: l.color }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}>72%</span>
            <span className="hsk-status-badge success" style={{ fontSize: 10 }}>达标</span>
          </div>
        ))}
      </div>
      <p className="text-muted" style={{ fontSize: 12, margin: '10px 0 0' }}>
        以上为结果页示意（实际数据由测评结果填充）
      </p>
    </div>
  );
}
