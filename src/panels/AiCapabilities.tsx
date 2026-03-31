import { useMemo, useState, useEffect } from 'react';
import { AI_CAP_STORAGE_KEY, DEFAULT_AI_CAPABILITIES, type AiCapability, type ScoreDimension, loadAiCapabilities, saveAiCapabilities } from '../stores/aiCapabilities';

const AI_ROLES_STORAGE_KEY = 'nsk-ai-roles-v2';
type LangKey = 'EN' | 'CN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'VI' | 'TH' | 'ID' | 'MS' | 'KM';

type AiRoleOption = { id: string; name: string };
function loadAiRoleOptions(): AiRoleOption[] {
  try {
    const raw = localStorage.getItem(AI_ROLES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: { id?: string; name?: string }) => ({ id: r.id ?? '', name: r.name ?? '' })).filter((r: AiRoleOption) => r.id && r.name);
  } catch {
    return [];
  }
}

const LANGS: { key: LangKey; label: string }[] = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英语' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'VI', label: '越南语' },
  { key: 'TH', label: '泰语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

const DEFAULT_CATEGORY_OPTIONS = ['生活场景', '校园口语', '商务口语', '旅游口语', '文化口语', '考试口语', '自由模式', '实战模拟'];

/** 主题分类多语言文案（全局，按分类内部键名存储，默认键名为中文） */
const CATEGORY_I18N_STORAGE_KEY = 'nsk-ai-category-i18n';

function loadCategoryLabelsFromStorage(): Record<string, Record<LangKey, string>> {
  try {
    const raw = localStorage.getItem(CATEGORY_I18N_STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as unknown;
    if (typeof p !== 'object' || p === null || Array.isArray(p)) return {};
    return p as Record<string, Record<LangKey, string>>;
  } catch {
    return {};
  }
}

function saveCategoryLabelsToStorage(data: Record<string, Record<LangKey, string>>) {
  try {
    localStorage.setItem(CATEGORY_I18N_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

const AVATAR_LIBRARY: { id: string; name: string; url: string }[] = [
  { id: 'avatar-1', name: '默认头像 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'avatar-2', name: '默认头像 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'avatar-3', name: '默认头像 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: 'avatar-4', name: '默认头像 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: 'avatar-5', name: '默认头像 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
];

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function emptyLang(): Record<LangKey, string> {
  return { CN: '', EN: '', ES: '', FR: '', PT: '', JA: '', KO: '', VI: '', TH: '', ID: '', MS: '', KM: '' };
}

function labelsForCategory(labels: Record<string, Record<LangKey, string>>, key: string): Record<LangKey, string> {
  const found = labels[key];
  if (found && typeof found === 'object') return { ...emptyLang(), ...found, CN: found.CN || key };
  return { ...emptyLang(), CN: key };
}

function categoryLabelsSearchBlob(labels: Record<string, Record<LangKey, string>>, key: string): string {
  const m = labelsForCategory(labels, key);
  return [key, ...Object.values(m)].join(' ');
}

function emptyScoreDesc(): Record<ScoreDimension, Record<LangKey, string>> {
  return {
    pronunciation: emptyLang(),
    fluency: emptyLang(),
    accuracy: emptyLang(),
    completeness: emptyLang(),
  };
}

export function AiCapabilities() {
  const [rows, setRows] = useState<AiCapability[]>(() => loadAiCapabilities());
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<AiCapability | null>(null);
  const [editingOriginAiId, setEditingOriginAiId] = useState<string | null>(null);
  const [themeLangTab, setThemeLangTab] = useState<LangKey>('CN');
  const [shortDescLang, setShortDescLang] = useState<LangKey>('CN');
  const [roleLang, setRoleLang] = useState<LangKey>('CN');
  const [roleTaskLang, setRoleTaskLang] = useState<LangKey>('CN');
  const [aiRoleOptions, setAiRoleOptions] = useState<AiRoleOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORY_OPTIONS);
  const [categoryLabels, setCategoryLabels] = useState<Record<string, Record<LangKey, string>>>(() => loadCategoryLabelsFromStorage());
  const [categoryEditLang, setCategoryEditLang] = useState<LangKey>('CN');
  const [showCategoryManage, setShowCategoryManage] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [avatarPickerFor, setAvatarPickerFor] = useState<'A' | 'B' | null>(null);
  const [avatarKeyword, setAvatarKeyword] = useState('');

  useEffect(() => {
    saveCategoryLabelsToStorage(categoryLabels);
  }, [categoryLabels]);

  const list = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter((r) =>
      [r.aiId, r.themeNameByLang.CN, r.themeNameByLang.EN, r.themeCategory, categoryLabelsSearchBlob(categoryLabels, r.themeCategory), r.dialogBackground, r.unitId, r.status]
        .join(' ')
        .toLowerCase()
        .includes(kw),
    );
  }, [rows, keyword, categoryLabels]);

  useEffect(() => {
    setAiRoleOptions(loadAiRoleOptions());
    const onStorage = () => setAiRoleOptions(loadAiRoleOptions());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [editing != null]);

  useEffect(() => {
    if (editing?.themeCategory && !categoryOptions.includes(editing.themeCategory)) {
      setCategoryOptions((prev) => [...prev, editing.themeCategory!]);
    }
  }, [editing?.themeCategory]);

  const avatarOptions = useMemo(() => {
    const kw = avatarKeyword.trim().toLowerCase();
    if (!kw) return AVATAR_LIBRARY;
    return AVATAR_LIBRARY.filter((m) => m.id.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw));
  }, [avatarKeyword]);

  const langBtnStyle = (key: LangKey, active: boolean) =>
    key === 'CN' ? (active ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' } : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }) : undefined;

  const openNew = () => {
    const suggestedAiId = `AI-${Date.now()}`;
    setEditingOriginAiId(null);
    setEditing({
      aiId: suggestedAiId,
      levelId: '1',
      unitId: 'N10100',
      aiRoleId: '',
      themeNameByLang: emptyLang(),
      themeCategory: DEFAULT_CATEGORY_OPTIONS[0],
      dialogBackground: '',
      dialogBackgroundByLang: emptyLang(),
      shortBackgroundDesc: '',
      shortBackgroundDescByLang: emptyLang(),
      goals: ['目标1', '目标2', '目标3'],
      prompt: '',
      turnLimit: 8,
      roleA: '学生',
      roleB: 'AI导师',
      roleAByLang: { ...emptyLang(), CN: '学生' },
      roleBByLang: { ...emptyLang(), CN: 'AI导师' },
      roleATaskByLang: emptyLang(),
      roleBTaskByLang: emptyLang(),
      roleAAvatarUrl: '',
      roleBAvatarUrl: '',
      userPickRole: 'A',
      firstSpeaker: 'B',
      aiScoreDimension: 'pronunciation',
      aiScoreDescByDimension: emptyScoreDesc(),
      status: '启用',
      createdAt: formatNow(),
      updatedAt: formatNow(),
    });
    setCategoryOptions(DEFAULT_CATEGORY_OPTIONS);
    setThemeLangTab('CN');
    setShortDescLang('CN');
    setRoleLang('CN');
    setRoleTaskLang('CN');
  };

  const saveOne = () => {
    if (!editing || !editing.aiId.trim() || !(editing.themeNameByLang.CN || editing.themeNameByLang.EN).trim()) return;
    const roleA = editing.roleAByLang?.CN ?? editing.roleA;
    const roleB = editing.roleBByLang?.CN ?? editing.roleB;
    const nextAiId = editing.aiId.trim();
    const now = formatNow();
    const toSave = {
      ...editing,
      aiId: nextAiId,
      createdAt: editing.createdAt || now,
      updatedAt: now,
      shortBackgroundDesc: editing.shortBackgroundDescByLang?.CN ?? editing.shortBackgroundDesc,
      roleA,
      roleB,
    };
    const hasOrigin = !!editingOriginAiId && rows.some((r) => r.aiId === editingOriginAiId);
    const next = hasOrigin
      ? rows.map((r) => (r.aiId === editingOriginAiId ? toSave : r))
      : rows.some((r) => r.aiId === nextAiId)
        ? rows.map((r) => (r.aiId === nextAiId ? toSave : r))
        : [toSave, ...rows];
    setRows(next);
    saveAiCapabilities(next);
    setEditingOriginAiId(null);
    setEditing(null);
  };

  const removeOne = (aiId: string) => {
    const next = rows.filter((r) => r.aiId !== aiId);
    setRows(next);
    saveAiCapabilities(next);
  };

  const resetAll = () => {
    if (!window.confirm('确认重置课程AI配置？将清空当前修改并恢复默认数据。')) return;
    localStorage.removeItem(AI_CAP_STORAGE_KEY);
    const resetRows = DEFAULT_AI_CAPABILITIES.map((r) => structuredClone(r));
    setRows(resetRows);
    saveAiCapabilities(resetRows);
    setEditingOriginAiId(null);
    setEditing(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">课程AI配置</div>
          <div className="page-subtitle">先在 AI角色配置里定义角色，再在这里做能力二次定义并收敛可调用范围</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setRows(loadAiCapabilities())}>↻ 刷新</button>
          <button type="button" className="btn btn-secondary" onClick={resetAll}>重置</button>
          <button type="button" className="btn btn-primary" onClick={openNew}>+ 新增课程AI配置</button>
        </div>
      </div>

      <div className="filter-bar">
        <input className="filter-select" style={{ minWidth: 340 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索 AI资源ID / 主题 / Level/Unit / 对话背景" />
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 {list.length} 条课程AI配置</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>AI资源ID</th>
              <th>主题（中文）</th>
              <th>主题分类</th>
              <th>难度</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.aiId}>
                <td className="td-mono">{r.aiId}</td>
                <td>{r.themeNameByLang.CN || r.themeNameByLang.EN || '—'}</td>
                <td>{r.themeCategory ? labelsForCategory(categoryLabels, r.themeCategory).CN || r.themeCategory : '—'}</td>
                <td>{r.levelId === '1' ? '初级' : r.levelId === '2' ? '中级' : '高级'}</td>
                <td>{r.status === '启用' ? <span className="badge badge-teal">启用</span> : <span className="badge badge-muted">停用</span>}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{r.createdAt || r.updatedAt || '—'}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{r.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingOriginAiId(r.aiId); setEditing(r); }}>编辑</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeOne(r.aiId)}>删除</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-light)' }}>暂无数据，请新增课程AI配置。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${editing ? 'open' : ''}`} onClick={() => { setEditingOriginAiId(null); setEditing(null); }} role="dialog" aria-modal="true" aria-label="课程AI配置编辑">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1040 }}>
          <div className="modal-header">
            <div className="modal-title">课程AI配置</div>
            <button type="button" className="modal-close" onClick={() => { setEditingOriginAiId(null); setEditing(null); }} aria-label="关闭">✕</button>
          </div>
          {editing && (
            <>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                <div className="section-title">基础信息</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">AI资源ID</label>
                    <input className="form-input td-mono" value={editing.aiId} onChange={(e) => setEditing((p) => (p ? { ...p, aiId: e.target.value } : p))} placeholder="建议格式：AI-时间戳 或 AI-课程-场景-序号" style={{ marginBottom: 4 }} />
                    <div className="form-hint" style={{ marginBottom: 10 }}>可手动编辑；新建时已提供推荐ID</div>
                    <label className="form-label">AI 选型</label>
                    <select className="form-input form-select" value={editing.aiRoleId ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, aiRoleId: e.target.value || undefined } : p))}>
                      <option value="">请选择已配置的 AI 角色</option>
                      {aiRoleOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <div className="form-hint" style={{ marginTop: 4 }}>来自「AI 角色配置」中新建的角色</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">难度选择（用于语音测评连调）</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {[
                      { key: '1', label: '初级' },
                      { key: '2', label: '中级' },
                      { key: '3', label: '高级' },
                    ].map((o) => (
                      <button
                        key={o.key}
                        type="button"
                        className={`btn btn-sm ${editing.levelId === o.key ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setEditing((p) => (p ? { ...p, levelId: o.key } : p))}
                        style={editing.levelId === o.key && o.key === '1' ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' } : undefined}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="form-hint" style={{ marginBottom: 2 }}>当前难度：{editing.levelId === '1' ? '初级' : editing.levelId === '2' ? '中级' : '高级'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">主题名称（多语言，≤10 字）</label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {LANGS.map((o) => (
                        <button key={o.key} type="button" className={`btn btn-sm ${themeLangTab === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeLangTab(o.key)} style={langBtnStyle(o.key, themeLangTab === o.key)}>{o.key}</button>
                      ))}
                    </div>
                    <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setEditing((p) => (p ? { ...p, themeNameByLang: { ...p.themeNameByLang, ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.themeNameByLang.CN || p.themeNameByLang[k]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                  </div>
                  <input className="form-input" maxLength={10} value={editing.themeNameByLang[themeLangTab] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, themeNameByLang: { ...p.themeNameByLang, [themeLangTab]: e.target.value.slice(0, 10) } } : p))} placeholder="主题名称（10 字内）" />
                  <div className="form-hint" style={{ marginTop: 4 }}>{(editing.themeNameByLang[themeLangTab] ?? '').length}/10</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">主题分类</label>
                    <select className="form-input form-select" value={editing.themeCategory} onChange={(e) => setEditing((p) => (p ? { ...p, themeCategory: e.target.value } : p))}>
                      {categoryOptions.map((v) => (
                        <option key={v} value={v}>{labelsForCategory(categoryLabels, v).CN || v}</option>
                      ))}
                      <option value="自定义">自定义</option>
                    </select>
                    {editing.themeCategory === '自定义' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input className="form-input" style={{ flex: '1 1 120px', minWidth: 0 }} value={customCategoryInput} onChange={(e) => setCustomCategoryInput(e.target.value)} placeholder="输入新分类名（内部键名，建议中文）" />
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const t = customCategoryInput.trim();
                            if (!t) return;
                            setCategoryOptions((prev) => (prev.includes(t) ? prev : [...prev, t]));
                            setCategoryLabels((prev) => ({ ...prev, [t]: labelsForCategory(prev, t) }));
                            setEditing((p) => (p ? { ...p, themeCategory: t } : p));
                            setCustomCategoryInput('');
                          }}
                        >
                          添加
                        </button>
                      </div>
                    )}
                    {editing.themeCategory && editing.themeCategory !== '自定义' && (
                      <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                        <label className="form-label" style={{ marginBottom: 8 }}>分类名称（多语言）</label>
                        <div className="form-hint" style={{ marginBottom: 8 }}>当前分类键：<span className="font-mono">{editing.themeCategory}</span> · 各语言展示文案可单独维护；切换上方下拉可编辑其他分类。</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {LANGS.map((o) => (
                              <button key={o.key} type="button" className={`btn btn-sm ${categoryEditLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCategoryEditLang(o.key)} style={langBtnStyle(o.key, categoryEditLang === o.key)}>
                                {o.key}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ marginLeft: 'auto' }}
                            onClick={() => {
                              const key = editing.themeCategory;
                              setCategoryLabels((prev) => {
                                const cur = labelsForCategory(prev, key);
                                const nextLang: Record<LangKey, string> = {
                                  ...cur,
                                  ...Object.fromEntries(
                                    LANGS.map((l) => l.key)
                                      .filter((k) => k !== 'CN')
                                      .map((k) => [k, (cur.CN || cur[k]) || '']),
                                  ) as Record<LangKey, string>,
                                };
                                return { ...prev, [key]: nextLang };
                              });
                            }}
                          >
                            自动翻译
                          </button>
                        </div>
                        <input
                          className="form-input"
                          value={labelsForCategory(categoryLabels, editing.themeCategory)[categoryEditLang] ?? ''}
                          onChange={(e) => {
                            const key = editing.themeCategory;
                            setCategoryLabels((prev) => ({
                              ...prev,
                              [key]: { ...labelsForCategory(prev, key), [categoryEditLang]: e.target.value },
                            }));
                          }}
                          placeholder={`${LANGS.find((l) => l.key === categoryEditLang)?.label ?? categoryEditLang}下的分类名称`}
                        />
                      </div>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 6, borderColor: 'var(--stone-dark)', color: 'var(--ink)' }} onClick={() => setShowCategoryManage((b) => !b)}>{showCategoryManage ? '收起管理' : '管理分类'}</button>
                    {showCategoryManage && (
                      <div style={{ marginTop: 8, padding: 10, background: 'var(--mist)', borderRadius: 8, border: '1px solid var(--stone-dark)' }}>
                        <div style={{ fontSize: 12, color: 'var(--ink-light)', marginBottom: 6 }}>点击「删除」可从列表中移除该分类；当前选中的分类被删时会自动切到剩余第一项；多语言文案在上方「分类名称（多语言）」中按当前选中项编辑。</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {categoryOptions.map((c) => (
                            <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'var(--white)', borderRadius: 6, border: '1px solid var(--stone-dark)', fontSize: 13 }}>
                              {labelsForCategory(categoryLabels, c).CN || c}
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '2px 6px', minWidth: 0, color: 'var(--rose)', fontSize: 12 }}
                                onClick={() => {
                                  setCategoryLabels((prev) => {
                                    const next = { ...prev };
                                    delete next[c];
                                    return next;
                                  });
                                  setCategoryOptions((prev) => {
                                    const next = prev.filter((x) => x !== c);
                                    if (next.length === 0) return prev;
                                    if (editing?.themeCategory === c) setEditing((p) => (p ? { ...p, themeCategory: next[0] } : p));
                                    return next;
                                  });
                                }}
                              >
                                删除
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>一句话背景描述（多语言，≤20 字）</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {LANGS.map((o) => (
                        <button key={o.key} type="button" className={`btn btn-sm ${shortDescLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShortDescLang(o.key)} style={langBtnStyle(o.key, shortDescLang === o.key)}>{o.key}</button>
                      ))}
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => setEditing((p) => (p ? { ...p, shortBackgroundDescByLang: { ...(p.shortBackgroundDescByLang ?? { ...emptyLang(), CN: p.shortBackgroundDesc ?? '' }), ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.shortBackgroundDescByLang?.CN ?? p.shortBackgroundDesc ?? p.shortBackgroundDescByLang?.[k as LangKey]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                    </div>
                  </div>
                  <input className="form-input" type="text" maxLength={20} value={(editing.shortBackgroundDescByLang ?? { ...emptyLang(), CN: editing.shortBackgroundDesc ?? '' })[shortDescLang] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, shortBackgroundDescByLang: { ...(p.shortBackgroundDescByLang ?? { ...emptyLang(), CN: p.shortBackgroundDesc ?? '' }), [shortDescLang]: e.target.value.slice(0, 20) } } : p))} placeholder="不超过 20 字" />
                  <div className="form-hint" style={{ marginTop: 4 }}>{((editing.shortBackgroundDescByLang ?? { ...emptyLang(), CN: editing.shortBackgroundDesc ?? '' })[shortDescLang] ?? '').length}/20</div>
                </div>

                <div className="section-title">人物关系与开场规则</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">A 角色</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {LANGS.map((o) => (
                          <button key={o.key} type="button" className={`btn btn-sm ${roleLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleLang(o.key)} style={langBtnStyle(o.key, roleLang === o.key)}>{o.key}</button>
                        ))}
                      </div>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setEditing((p) => (p ? { ...p, roleAByLang: { ...(p.roleAByLang ?? { ...emptyLang(), CN: p.roleA }), ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleAByLang?.CN ?? p.roleA ?? p.roleAByLang?.[k]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                    </div>
                    <input className="form-input" maxLength={10} value={(editing.roleAByLang ?? { ...emptyLang(), CN: editing.roleA })[roleLang] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, roleAByLang: { ...(p.roleAByLang ?? { ...emptyLang(), CN: p.roleA }), [roleLang]: e.target.value.slice(0, 10) } } : p))} placeholder="角色名称（10 字内）" style={{ marginBottom: 10 }} />
                    <div className="form-hint" style={{ marginTop: -4, marginBottom: 8 }}>{((editing.roleAByLang ?? { ...emptyLang(), CN: editing.roleA })[roleLang] ?? '').length}/10</div>
                    <label className="form-label" style={{ marginTop: 12, marginBottom: 6 }}>角色任务</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {LANGS.map((o) => (
                          <button key={o.key} type="button" className={`btn btn-sm ${roleTaskLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleTaskLang(o.key)} style={langBtnStyle(o.key, roleTaskLang === o.key)}>{o.key}</button>
                        ))}
                      </div>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setEditing((p) => (p ? { ...p, roleATaskByLang: { ...(p.roleATaskByLang ?? emptyLang()), ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleATaskByLang?.CN ?? p.roleATaskByLang?.[k]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                    </div>
                    <textarea className="form-input" rows={2} maxLength={20} value={(editing.roleATaskByLang ?? emptyLang())[roleTaskLang] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, roleATaskByLang: { ...(p.roleATaskByLang ?? emptyLang()), [roleTaskLang]: e.target.value.slice(0, 20) } } : p))} placeholder="A 角色任务描述（多语言，20 字内）" style={{ marginBottom: 10 }} />
                    <div className="form-hint" style={{ marginTop: -4, marginBottom: 10 }}>{((editing.roleATaskByLang ?? emptyLang())[roleTaskLang] ?? '').length}/20</div>
                    <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14 }}>
                      <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>头像</div>
                      <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像；点击更换可重新选择</p>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: 64, height: 64, background: 'var(--mist)', borderRadius: 10, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {editing.roleAAvatarUrl ? <img src={editing.roleAAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span style={{ fontSize: '1.5rem' }}>👤</span>}
                        </div>
                        <div>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAvatarPickerFor('A'); setAvatarKeyword(''); }}>更换</button>
                          {editing.roleAAvatarUrl && <div className="form-hint" style={{ marginTop: 4 }}>已选头像</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">B 角色</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {LANGS.map((o) => (
                          <button key={o.key} type="button" className={`btn btn-sm ${roleLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleLang(o.key)} style={langBtnStyle(o.key, roleLang === o.key)}>{o.key}</button>
                        ))}
                      </div>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setEditing((p) => (p ? { ...p, roleBByLang: { ...(p.roleBByLang ?? { ...emptyLang(), CN: p.roleB }), ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleBByLang?.CN ?? p.roleB ?? p.roleBByLang?.[k]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                    </div>
                    <input className="form-input" maxLength={10} value={(editing.roleBByLang ?? { ...emptyLang(), CN: editing.roleB })[roleLang] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, roleBByLang: { ...(p.roleBByLang ?? { ...emptyLang(), CN: p.roleB }), [roleLang]: e.target.value.slice(0, 10) } } : p))} placeholder="角色名称（10 字内）" style={{ marginBottom: 10 }} />
                    <div className="form-hint" style={{ marginTop: -4, marginBottom: 8 }}>{((editing.roleBByLang ?? { ...emptyLang(), CN: editing.roleB })[roleLang] ?? '').length}/10</div>
                    <label className="form-label" style={{ marginTop: 12, marginBottom: 6 }}>角色任务</label>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {LANGS.map((o) => (
                          <button key={o.key} type="button" className={`btn btn-sm ${roleTaskLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleTaskLang(o.key)} style={langBtnStyle(o.key, roleTaskLang === o.key)}>{o.key}</button>
                        ))}
                      </div>
                      <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setEditing((p) => (p ? { ...p, roleBTaskByLang: { ...(p.roleBTaskByLang ?? emptyLang()), ...Object.fromEntries((LANGS.map((l) => l.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleBTaskByLang?.CN ?? p.roleBTaskByLang?.[k]) || ''])) as Record<LangKey, string> } } : p))}>自动翻译</button>
                    </div>
                    <textarea className="form-input" rows={2} maxLength={20} value={(editing.roleBTaskByLang ?? emptyLang())[roleTaskLang] ?? ''} onChange={(e) => setEditing((p) => (p ? { ...p, roleBTaskByLang: { ...(p.roleBTaskByLang ?? emptyLang()), [roleTaskLang]: e.target.value.slice(0, 20) } } : p))} placeholder="B 角色任务描述（多语言，20 字内）" style={{ marginBottom: 10 }} />
                    <div className="form-hint" style={{ marginTop: -4, marginBottom: 10 }}>{((editing.roleBTaskByLang ?? emptyLang())[roleTaskLang] ?? '').length}/20</div>
                    <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14 }}>
                      <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>头像</div>
                      <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像；点击更换可重新选择</p>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ width: 64, height: 64, background: 'var(--mist)', borderRadius: 10, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {editing.roleBAvatarUrl ? <img src={editing.roleBAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span style={{ fontSize: '1.5rem' }}>👤</span>}
                        </div>
                        <div>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAvatarPickerFor('B'); setAvatarKeyword(''); }}>更换</button>
                          {editing.roleBAvatarUrl && <div className="form-hint" style={{ marginTop: 4 }}>已选头像</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">用户扮演角色 / AI 扮演角色</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                    <button type="button" className={`btn ${editing.userPickRole === 'A' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 200px', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setEditing((p) => (p ? { ...p, userPickRole: 'A', firstSpeaker: 'B' } : p))}>
                      <span style={{ fontWeight: 600 }}>用户扮演 A</span>
                      <span style={{ fontSize: 12, opacity: 0.9 }}>{(editing.roleAByLang ?? { ...emptyLang(), CN: editing.roleA })[roleLang] || editing.roleA || '角色 A'}</span>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>AI 扮演 B · AI 先开口</span>
                    </button>
                    <button type="button" className={`btn ${editing.userPickRole === 'B' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 200px', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setEditing((p) => (p ? { ...p, userPickRole: 'B', firstSpeaker: 'A' } : p))}>
                      <span style={{ fontWeight: 600 }}>用户扮演 B</span>
                      <span style={{ fontSize: 12, opacity: 0.9 }}>{(editing.roleBByLang ?? { ...emptyLang(), CN: editing.roleB })[roleLang] || editing.roleB || '角色 B'}</span>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>AI 扮演 A · AI 先开口</span>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <p className="form-hint" style={{ marginTop: 0, marginBottom: 8 }}>在此 Prompt 中两种角色都要设置；不同角色模式可用不同 Prompt 决定先开口者与对话逻辑。</p>
                  <textarea className="form-input" rows={3} maxLength={1000} value={editing.prompt} onChange={(e) => setEditing((p) => (p ? { ...p, prompt: e.target.value.slice(0, 1000) } : p))} />
                  <div className="form-hint" style={{ marginTop: 4 }}>{editing.prompt.length}/1000</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">对话次数限制（轮）</label>
                    <input type="number" min={1} max={50} className="form-input" value={editing.turnLimit} onChange={(e) => setEditing((p) => (p ? { ...p, turnLimit: Number(e.target.value || 1) } : p))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">状态</label>
                    <select className="form-input form-select" value={editing.status} onChange={(e) => setEditing((p) => (p ? { ...p, status: e.target.value as AiCapability['status'] } : p))}>
                      <option value="启用">启用</option>
                      <option value="停用">停用</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setEditingOriginAiId(null); setEditing(null); }}>取消</button>
                <button type="button" className="btn btn-primary" onClick={saveOne}>保存</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`modal-overlay ${avatarPickerFor ? 'open' : ''}`} onClick={() => { setAvatarPickerFor(null); setAvatarKeyword(''); }} role="dialog" aria-modal="true" aria-label="选择头像">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <div className="modal-title">选择头像 · {avatarPickerFor === 'A' ? 'A 角色' : 'B 角色'}</div>
            <button type="button" className="modal-close" onClick={() => { setAvatarPickerFor(null); setAvatarKeyword(''); }} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <label className="form-label">搜索</label>
            <input type="text" className="form-input" placeholder="关键词" value={avatarKeyword} onChange={(e) => setAvatarKeyword(e.target.value)} style={{ marginBottom: 12 }} />
            <label className="form-label">资源列表（{avatarOptions.length}）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {avatarOptions.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid var(--stone-dark)', borderRadius: 8 }}>
                  <img src={m.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setEditing((p) => { if (!p) return p; return avatarPickerFor === 'A' ? { ...p, roleAAvatarUrl: m.url } : { ...p, roleBAvatarUrl: m.url }; }); setAvatarPickerFor(null); setAvatarKeyword(''); }}>选择</button>
                </div>
              ))}
              {avatarOptions.length === 0 && <div style={{ padding: 16, color: 'var(--ink-light)' }}>无匹配资源</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

