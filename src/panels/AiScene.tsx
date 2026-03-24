import { useMemo, useState, useEffect } from 'react';

const AI_ROLES_STORAGE_KEY = 'nsk-ai-roles-v2';

type LangKey = 'CN' | 'EN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';
type ScoreBand = 'low' | 'mid' | 'high';
type ScoreDimension = 'pronunciation' | 'fluency' | 'accuracy' | 'completion';

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

type SceneTemplate = {
  key: string;
  icon: string;
  cn: string;
  en: string;
  category: string;
  background: string;
  topicDesc: string;
  roleA: string;
  roleB: string;
  level: '初级' | '中级' | '高级';
};

type SceneConfig = {
  templateKey: string;
  icon: string;
  aiName: string;
  aiRoleId?: string;
  usageScene: string;
  level: '初级' | '中级' | '高级';
  themeNameByLang: Record<LangKey, string>;
  themeCategory: string;
  topicBackground: string;
  topicDesc: string;
  topicDescByLang?: Record<LangKey, string>;
  shortBackgroundDesc?: string;
  /** 一句话背景描述（多语言） */
  shortBackgroundDescByLang?: Record<LangKey, string>;
  roleA: string;
  roleB: string;
  /** A/B 角色名称多语言（兼容旧数据用 roleA/roleB） */
  roleAByLang?: Record<LangKey, string>;
  roleBByLang?: Record<LangKey, string>;
  /** A/B 角色任务描述多语言 */
  roleATaskByLang?: Record<LangKey, string>;
  roleBTaskByLang?: Record<LangKey, string>;
  roleAAvatarUrl?: string;
  roleBAvatarUrl?: string;
  userPickRole: 'A' | 'B';
  aiPrompt: string;
  aiPromptWhenUserB?: string;
  turnLimit: number;
  enablePronunciationScore: boolean;
  scoreWeight: Record<ScoreDimension, number>;
  scoreFeedbackByBand: Record<ScoreBand, Record<LangKey, string>>;
  finalEvalPrompt: string;
  status: 'published' | 'draft';
  createdAt?: string;
  updated: string;
};

const LANG_OPTIONS: Array<{ key: LangKey; label: string }> = [
  { key: 'CN', label: '中文' }, { key: 'EN', label: '英文' }, { key: 'ES', label: '西语' }, { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' }, { key: 'JA', label: '日语' }, { key: 'KO', label: '韩语' }, { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' }, { key: 'ID', label: '印尼语' }, { key: 'MS', label: '马来语' }, { key: 'KM', label: '高棉语' },
];

const createEmptyLangMap = (cn = '', en = ''): Record<LangKey, string> => ({
  CN: cn, EN: en, ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '',
});

const createEmptyBandMap = (): Record<ScoreBand, Record<LangKey, string>> => ({
  low: createEmptyLangMap('基础待加强，请先稳定句型与发音。', 'Need stronger basics in pronunciation and sentence patterns.'),
  mid: createEmptyLangMap('表现良好，可继续提升表达完整度。', 'Good performance, improve completeness of expression.'),
  high: createEmptyLangMap('表现优秀，可提升复杂场景应变。', 'Excellent performance, challenge more complex responses.'),
});

const AVATAR_LIBRARY: { id: string; name: string; url: string }[] = [
  { id: 'avatar-1', name: '默认头像 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'avatar-2', name: '默认头像 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'avatar-3', name: '默认头像 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: 'avatar-4', name: '默认头像 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: 'avatar-5', name: '默认头像 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
];

const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    key: 'coffee-shop',
    icon: '☕',
    cn: '咖啡厅点餐',
    en: 'Coffee Shop',
    category: '生活口语',
    background: '餐厅点餐',
    topicDesc: '在咖啡厅完成点单、加料、支付与礼貌收尾',
    roleA: '顾客',
    roleB: '咖啡师',
    level: '初级',
  },
  {
    key: 'dating-chat',
    icon: '💑',
    cn: '约会对话',
    en: 'Asking Out',
    category: '社交口语',
    background: '约会邀约',
    topicDesc: '围绕邀约、安排时间、礼貌回应与拒绝表达',
    roleA: '邀约方',
    roleB: '被邀约方',
    level: '中级',
  },
  {
    key: 'market-shopping',
    icon: '🍎',
    cn: '菜市场购物',
    en: 'At the Market',
    category: '生活口语',
    background: '市场购物',
    topicDesc: '进行询价、砍价、数量确认与付款对话',
    roleA: '买家',
    roleB: '摊主',
    level: '初级',
  },
];

const buildFromTemplate = (tpl: SceneTemplate): SceneConfig => ({
  templateKey: tpl.key,
  icon: tpl.icon,
  aiName: `AI 场景教练 · ${tpl.cn}`,
  aiRoleId: '',
  usageScene: '场景训练（可控性训练）',
  level: tpl.level,
  themeNameByLang: createEmptyLangMap(tpl.cn, tpl.en),
  themeCategory: tpl.category,
  topicBackground: tpl.background,
  topicDesc: tpl.topicDesc,
  topicDescByLang: createEmptyLangMap(tpl.topicDesc, ''),
  shortBackgroundDesc: tpl.background,
  shortBackgroundDescByLang: createEmptyLangMap(tpl.background, ''),
  roleA: tpl.roleA,
  roleB: tpl.roleB,
  roleAByLang: createEmptyLangMap(tpl.roleA, ''),
  roleBByLang: createEmptyLangMap(tpl.roleB, ''),
  roleATaskByLang: createEmptyLangMap(),
  roleBTaskByLang: createEmptyLangMap(),
  roleAAvatarUrl: '',
  roleBAvatarUrl: '',
  userPickRole: 'A',
  aiPrompt: `你是场景训练AI教练，必须由AI先开口，严格围绕「${tpl.cn}」场景进行可控训练。`,
  aiPromptWhenUserB: `你是场景训练AI教练，必须由AI先开口，严格围绕「${tpl.cn}」场景进行可控训练。`,
  turnLimit: 8,
  enablePronunciationScore: true,
  scoreWeight: { pronunciation: 35, fluency: 25, accuracy: 25, completion: 15 },
  scoreFeedbackByBand: createEmptyBandMap(),
  finalEvalPrompt: '请基于本次场景训练输出总评、分项评分、错误要点和复练建议。',
  status: 'published',
  createdAt: '2026-03-01',
  updated: '2026-03-01',
});

const seedRows: SceneConfig[] = SCENE_TEMPLATES.map((tpl, idx) => ({
  ...buildFromTemplate(tpl),
  status: idx === 1 ? 'draft' : 'published',
  createdAt: idx === 0 ? '2026-03-01' : idx === 1 ? '2026-02-20' : '2026-02-15',
  updated: idx === 0 ? '2026-03-01' : idx === 1 ? '2026-02-20' : '2026-02-15',
}));

const formatDate = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function AiScene() {
  const [rows, setRows] = useState<SceneConfig[]>(seedRows);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [themeLang, setThemeLang] = useState<LangKey>('CN');
  const [shortDescLang, setShortDescLang] = useState<LangKey>('CN');
  const [roleLang, setRoleLang] = useState<LangKey>('CN');
  const [roleTaskLang, setRoleTaskLang] = useState<LangKey>('CN');
  const [form, setForm] = useState<SceneConfig>(seedRows[0]);
  const [aiRoleOptions, setAiRoleOptions] = useState<AiRoleOption[]>([]);
  const [avatarPickerFor, setAvatarPickerFor] = useState<'A' | 'B' | null>(null);
  const [avatarKeyword, setAvatarKeyword] = useState('');

  const publishedCount = useMemo(() => rows.filter((r) => r.status === 'published').length, [rows]);

  const langBtnStyle = (key: LangKey, active: boolean) =>
    key === 'CN'
      ? active
        ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' }
        : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }
      : undefined;

  useEffect(() => {
    setAiRoleOptions(loadAiRoleOptions());
    const onStorage = () => setAiRoleOptions(loadAiRoleOptions());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [modalOpen]);

  const avatarOptions = useMemo(() => {
    const kw = avatarKeyword.trim().toLowerCase();
    if (!kw) return AVATAR_LIBRARY;
    return AVATAR_LIBRARY.filter((m) => m.id.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw));
  }, [avatarKeyword]);

  const openCreate = () => {
    const base = buildFromTemplate(SCENE_TEMPLATES[0]);
    setEditingIndex(null);
    setThemeLang('CN');
    setShortDescLang('CN');
    setRoleLang('CN');
    setRoleTaskLang('CN');
    setForm({ ...base, status: 'draft', createdAt: '', updated: '' });
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    setThemeLang('CN');
    setShortDescLang('CN');
    setRoleLang('CN');
    setRoleTaskLang('CN');
    const row = rows[idx];
    const topicDescByLang = row.topicDescByLang ?? createEmptyLangMap(row.topicDesc, '');
    const shortBackgroundDescByLang = row.shortBackgroundDescByLang ?? createEmptyLangMap(row.shortBackgroundDesc ?? '', '');
    const roleAByLang = row.roleAByLang ?? createEmptyLangMap(row.roleA ?? '', '');
    const roleBByLang = row.roleBByLang ?? createEmptyLangMap(row.roleB ?? '', '');
    const roleATaskByLang = row.roleATaskByLang ?? createEmptyLangMap();
    const roleBTaskByLang = row.roleBTaskByLang ?? createEmptyLangMap();
    setForm({ ...row, topicDescByLang, shortBackgroundDescByLang, roleAByLang, roleBByLang, roleATaskByLang, roleBTaskByLang });
    setModalOpen(true);
  };

  const saveForm = () => {
    const name = form.aiRoleId ? (aiRoleOptions.find((r) => r.id === form.aiRoleId)?.name ?? form.aiName) : form.aiName;
    if ((!form.aiRoleId && !form.aiName.trim()) || !form.themeNameByLang.CN.trim()) return;
    const roleA = (form.roleAByLang?.CN ?? form.roleA).trim() || form.roleA;
    const roleB = (form.roleBByLang?.CN ?? form.roleB).trim() || form.roleB;
    const now = formatDate();
    const payload = { ...form, aiName: form.aiRoleId ? name : form.aiName, roleA, roleB, createdAt: form.createdAt || now, updated: now };
    if (editingIndex === null) setRows((prev) => [payload, ...prev]);
    else setRows((prev) => prev.map((r, i) => (i === editingIndex ? payload : r)));
    setModalOpen(false);
    setEditingIndex(null);
  };

  const togglePublish = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, status: r.status === 'published' ? 'draft' : 'published', updated: formatDate() } : r,
      ),
    );
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">场景训练管理</div>
          <div className="page-subtitle">场景训练是可控性训练：使用固定场景模板，不做自由场景切换</div>
        </div>
        <div className="page-actions">
          <div className="search-bar" style={{ width: 180 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input placeholder="搜索场景..." />
          </div>
          <select className="filter-select">
            <option value="">全部难度</option>
            <option>初级</option>
            <option>中级</option>
            <option>高级</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={openCreate}>+ 新建场景</button>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-icon blue">🎬</div><div><div className="stat-val">{rows.length}</div><div className="stat-label">场景总数</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-val">{publishedCount}</div><div className="stat-label">已上线</div></div></div>
        <div className="stat-card"><div className="stat-icon amber">⭐</div><div><div className="stat-val">2</div><div className="stat-label">Premium 专属</div></div></div>
        <div className="stat-card"><div className="stat-icon grey">🔁</div><div><div className="stat-val">28,304</div><div className="stat-label">本月练习次数</div></div></div>
      </div>

      <div id="scene-grid" className="scene-grid">
        {rows.map((row, idx) => (
          <div className="scene-card" key={`${row.templateKey}-${idx}`}>
            <div className="scene-card-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="scene-emoji">{row.icon}</div>
                <div>
                  <div className="scene-name">{row.themeNameByLang.CN}</div>
                  <div className="scene-en">{row.themeNameByLang.EN}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className={`badge ${row.level === '初级' ? 'badge-teal' : row.level === '中级' ? 'badge-amber' : 'badge-rejected'}`}>{row.level}</span>
                <button type="button" className={`tog ${row.status === 'published' ? 'on' : ''}`} style={{ padding: 0, border: 'none', font: 'inherit', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); togglePublish(idx); }} aria-label={row.status === 'published' ? '下线' : '发布'} title={row.status === 'published' ? '点击下线' : '点击发布'} />
              </div>
            </div>
            <div className="scene-meta"><span>👤 {(row.roleAByLang?.CN ?? row.roleA) || 'A'} vs {(row.roleBByLang?.CN ?? row.roleB) || 'B'}</span><span>🔄 {row.turnLimit}轮</span></div>
            <div className="scene-footer">
              <span className="td-mono" style={{ fontSize: 10.5 }}>创建 {row.createdAt || row.updated} · 更新 {row.updated}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(idx); }}>编辑配置 →</button>
                {row.status === 'published'
                  ? <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteIndex(idx)}>删除</button>
                  : <button type="button" className="btn btn-secondary btn-sm" onClick={() => togglePublish(idx)}>发布</button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)} role="dialog" aria-modal="true" aria-label="场景训练配置">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1120 }}>
          <div className="modal-header">
            <div className="modal-title">{editingIndex === null ? '新建场景训练配置' : '编辑场景训练配置'}</div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            <div className="section-title" style={{ marginTop: 0 }}>基础信息</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">AI 选型</label>
                <select className="form-input form-select" value={form.aiRoleId ?? ''} onChange={(e) => { const id = e.target.value; const role = aiRoleOptions.find((r) => r.id === id); setForm((p) => ({ ...p, aiRoleId: id, aiName: role?.name ?? p.aiName })); }}>
                  <option value="">请选择已配置的 AI 角色</option>
                  {aiRoleOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div className="form-hint" style={{ marginTop: 4 }}>来自「AI 角色配置」中新建的角色</div>
              </div>
              <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14, minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>头像配置</div>
                <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像图片；点击更换可重新选择</p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--mist)', borderRadius: 10, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {(form.userPickRole === 'A' ? form.roleBAvatarUrl : form.roleAAvatarUrl) ? (
                      <img
                        src={(form.userPickRole === 'A' ? form.roleBAvatarUrl : form.roleAAvatarUrl) as string}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>{form.icon}</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setAvatarPickerFor(form.userPickRole === 'A' ? 'B' : 'A'); setAvatarKeyword(''); }}
                    >
                      更换
                    </button>
                    <div className="form-hint" style={{ marginTop: 4 }}>前端展示Emoji标签</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">难度选择（用于语音测评连调）</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {(['初级', '中级', '高级'] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    className={`btn btn-sm ${form.level === lv ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setForm((p) => ({ ...p, level: lv }))}
                  >
                    {lv}
                  </button>
                ))}
              </div>
              <div className="form-hint" style={{ marginBottom: 2 }}>当前难度：{form.level}</div>
            </div>
            <div className="form-group">
              <label className="form-label">主题名称（多语言，≤10 字）</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {LANG_OPTIONS.map((o) => (
                    <button key={o.key} type="button" className={`btn btn-sm ${themeLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeLang(o.key)} style={langBtnStyle(o.key, themeLang === o.key)}>{o.key}</button>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, themeNameByLang: { ...p.themeNameByLang, ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.themeNameByLang.CN || p.themeNameByLang[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
              </div>
              <input className="form-input" maxLength={10} value={form.themeNameByLang[themeLang]} onChange={(e) => setForm((p) => ({ ...p, themeNameByLang: { ...p.themeNameByLang, [themeLang]: e.target.value.slice(0, 10) } }))} placeholder="主题名称（10 字内）" />
              <div className="form-hint" style={{ marginTop: 4 }}>{(form.themeNameByLang[themeLang] ?? '').length}/10</div>
            </div>
            <div className="form-group">
              <label className="form-label">一句话背景描述</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {LANG_OPTIONS.map((o) => (
                    <button key={o.key} type="button" className={`btn btn-sm ${shortDescLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setShortDescLang(o.key)} style={langBtnStyle(o.key, shortDescLang === o.key)}>{o.key}</button>
                  ))}
                </div>
                <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, shortBackgroundDescByLang: { ...(p.shortBackgroundDescByLang ?? createEmptyLangMap(p.shortBackgroundDesc ?? '', '')), ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.shortBackgroundDescByLang?.CN ?? p.shortBackgroundDesc ?? p.shortBackgroundDescByLang?.[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
              </div>
              <input className="form-input" type="text" maxLength={20} value={(form.shortBackgroundDescByLang ?? createEmptyLangMap(form.shortBackgroundDesc ?? '', ''))[shortDescLang]} onChange={(e) => setForm((p) => ({ ...p, shortBackgroundDescByLang: { ...(p.shortBackgroundDescByLang ?? createEmptyLangMap(p.shortBackgroundDesc ?? '', '')), [shortDescLang]: e.target.value.slice(0, 20) } }))} placeholder="不超过 20 字" />
              <div className="form-hint" style={{ marginTop: 4 }}>{((form.shortBackgroundDescByLang ?? createEmptyLangMap(form.shortBackgroundDesc ?? '', ''))[shortDescLang] ?? '').length}/20</div>
            </div>

            <div className="section-title">人物关系与开场规则</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">A 角色</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {LANG_OPTIONS.map((o) => (
                      <button key={o.key} type="button" className={`btn btn-sm ${roleLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleLang(o.key)} style={langBtnStyle(o.key, roleLang === o.key)}>{o.key}</button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, roleAByLang: { ...(p.roleAByLang ?? createEmptyLangMap(p.roleA ?? '', '')), ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleAByLang?.CN ?? p.roleA ?? p.roleAByLang?.[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
                </div>
                <input className="form-input" maxLength={10} value={(form.roleAByLang ?? createEmptyLangMap(form.roleA ?? '', ''))[roleLang]} onChange={(e) => setForm((p) => ({ ...p, roleAByLang: { ...(p.roleAByLang ?? createEmptyLangMap(p.roleA ?? '', '')), [roleLang]: e.target.value.slice(0, 10) } }))} placeholder="角色名称（10 字内）" style={{ marginBottom: 10 }} />
                <div className="form-hint" style={{ marginTop: -4, marginBottom: 8 }}>{((form.roleAByLang ?? createEmptyLangMap(form.roleA ?? '', ''))[roleLang] ?? '').length}/10</div>
                <label className="form-label" style={{ marginTop: 12, marginBottom: 6 }}>角色任务</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {LANG_OPTIONS.map((o) => (
                      <button key={o.key} type="button" className={`btn btn-sm ${roleTaskLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleTaskLang(o.key)} style={langBtnStyle(o.key, roleTaskLang === o.key)}>{o.key}</button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, roleATaskByLang: { ...(p.roleATaskByLang ?? createEmptyLangMap()), ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleATaskByLang?.CN ?? p.roleATaskByLang?.[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
                </div>
                <textarea className="form-input" rows={2} maxLength={20} value={(form.roleATaskByLang ?? createEmptyLangMap())[roleTaskLang]} onChange={(e) => setForm((p) => ({ ...p, roleATaskByLang: { ...(p.roleATaskByLang ?? createEmptyLangMap()), [roleTaskLang]: e.target.value.slice(0, 20) } }))} placeholder="A 角色任务描述（多语言，20 字内）" style={{ marginBottom: 10 }} />
                <div className="form-hint" style={{ marginTop: -4, marginBottom: 10 }}>{((form.roleATaskByLang ?? createEmptyLangMap())[roleTaskLang] ?? '').length}/20</div>
                <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14 }}>
                  <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>头像</div>
                  <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像；点击更换可重新选择</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 64, height: 64, background: 'var(--mist)', borderRadius: 10, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {form.roleAAvatarUrl ? <img src={form.roleAAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span style={{ fontSize: '1.5rem' }}>👤</span>}
                    </div>
                    <div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAvatarPickerFor('A'); setAvatarKeyword(''); }}>更换</button>
                      {form.roleAAvatarUrl && <div className="form-hint" style={{ marginTop: 4 }}>已选头像</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">B 角色</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {LANG_OPTIONS.map((o) => (
                      <button key={o.key} type="button" className={`btn btn-sm ${roleLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleLang(o.key)} style={langBtnStyle(o.key, roleLang === o.key)}>{o.key}</button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, roleBByLang: { ...(p.roleBByLang ?? createEmptyLangMap(p.roleB ?? '', '')), ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleBByLang?.CN ?? p.roleB ?? p.roleBByLang?.[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
                </div>
                <input className="form-input" maxLength={10} value={(form.roleBByLang ?? createEmptyLangMap(form.roleB ?? '', ''))[roleLang]} onChange={(e) => setForm((p) => ({ ...p, roleBByLang: { ...(p.roleBByLang ?? createEmptyLangMap(p.roleB ?? '', '')), [roleLang]: e.target.value.slice(0, 10) } }))} placeholder="角色名称（10 字内）" style={{ marginBottom: 10 }} />
                <div className="form-hint" style={{ marginTop: -4, marginBottom: 8 }}>{((form.roleBByLang ?? createEmptyLangMap(form.roleB ?? '', ''))[roleLang] ?? '').length}/10</div>
                <label className="form-label" style={{ marginTop: 12, marginBottom: 6 }}>角色任务</label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {LANG_OPTIONS.map((o) => (
                      <button key={o.key} type="button" className={`btn btn-sm ${roleTaskLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setRoleTaskLang(o.key)} style={langBtnStyle(o.key, roleTaskLang === o.key)}>{o.key}</button>
                    ))}
                  </div>
                  <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }} onClick={() => setForm((p) => ({ ...p, roleBTaskByLang: { ...(p.roleBTaskByLang ?? createEmptyLangMap()), ...Object.fromEntries((LANG_OPTIONS.map((o) => o.key)).filter((k) => k !== 'CN').map((k) => [k, (p.roleBTaskByLang?.CN ?? p.roleBTaskByLang?.[k]) || ''])) as Record<LangKey, string> } }))}>自动翻译</button>
                </div>
                <textarea className="form-input" rows={2} maxLength={20} value={(form.roleBTaskByLang ?? createEmptyLangMap())[roleTaskLang]} onChange={(e) => setForm((p) => ({ ...p, roleBTaskByLang: { ...(p.roleBTaskByLang ?? createEmptyLangMap()), [roleTaskLang]: e.target.value.slice(0, 20) } }))} placeholder="B 角色任务描述（多语言，20 字内）" style={{ marginBottom: 10 }} />
                <div className="form-hint" style={{ marginTop: -4, marginBottom: 10 }}>{((form.roleBTaskByLang ?? createEmptyLangMap())[roleTaskLang] ?? '').length}/20</div>
                <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14 }}>
                  <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>头像</div>
                  <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像；点击更换可重新选择</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 64, height: 64, background: 'var(--mist)', borderRadius: 10, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {form.roleBAvatarUrl ? <img src={form.roleBAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <span style={{ fontSize: '1.5rem' }}>👤</span>}
                    </div>
                    <div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setAvatarPickerFor('B'); setAvatarKeyword(''); }}>更换</button>
                      {form.roleBAvatarUrl && <div className="form-hint" style={{ marginTop: 4 }}>已选头像</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">用户扮演角色 / AI 扮演角色</label>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                <button type="button" className={`btn ${form.userPickRole === 'A' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 200px', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setForm((p) => ({ ...p, userPickRole: 'A' }))}>
                  <span style={{ fontWeight: 600 }}>用户扮演 A</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>{(form.roleAByLang != null ? form.roleAByLang : createEmptyLangMap(form.roleA || '', ''))[roleLang] || form.roleA || '角色 A'}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>AI 扮演 B · AI 先开口</span>
                </button>
                <button type="button" className={`btn ${form.userPickRole === 'B' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: '1 1 200px', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }} onClick={() => setForm((p) => ({ ...p, userPickRole: 'B' }))}>
                  <span style={{ fontWeight: 600 }}>用户扮演 B</span>
                  <span style={{ fontSize: 12, opacity: 0.9 }}>{(form.roleBByLang != null ? form.roleBByLang : createEmptyLangMap(form.roleB || '', ''))[roleLang] || form.roleB || '角色 B'}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>AI 扮演 A · AI 先开口</span>
                </button>
              </div>
            </div>

            <div className="form-group">
              <p className="form-hint" style={{ marginTop: 0, marginBottom: 8 }}>在此 Prompt 中两种角色都要设置；不同角色模式可用不同 Prompt 决定先开口者与对话逻辑。</p>
              <textarea className="form-input" rows={3} maxLength={1000} value={form.userPickRole === 'A' ? form.aiPrompt : (form.aiPromptWhenUserB ?? form.aiPrompt)} onChange={(e) => setForm((p) => (p.userPickRole === 'A' ? { ...p, aiPrompt: e.target.value.slice(0, 1000) } : { ...p, aiPromptWhenUserB: e.target.value.slice(0, 1000) }))} />
              <div className="form-hint" style={{ marginTop: 4 }}>{(form.userPickRole === 'A' ? form.aiPrompt : (form.aiPromptWhenUserB ?? form.aiPrompt)).length}/1000</div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">对话次数限制（轮）</label>
                <input className="form-input" type="number" min={1} max={50} value={form.turnLimit} onChange={(e) => setForm((p) => ({ ...p, turnLimit: Number(e.target.value || 1) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">状态</label>
                <select className="form-input form-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'published' | 'draft' }))}>
                  <option value="draft">草稿</option>
                  <option value="published">已上线</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={saveForm}>保存配置</button>
          </div>
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
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { if (avatarPickerFor === 'A') setForm((p) => ({ ...p, roleAAvatarUrl: m.url })); else setForm((p) => ({ ...p, roleBAvatarUrl: m.url })); setAvatarPickerFor(null); setAvatarKeyword(''); }}>选择</button>
                </div>
              ))}
              {avatarOptions.length === 0 && <div style={{ padding: 16, color: 'var(--ink-light)' }}>无匹配资源</div>}
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${deleteIndex !== null ? 'open' : ''}`} onClick={() => setDeleteIndex(null)} role="dialog" aria-modal="true" aria-label="删除场景配置">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <div className="modal-title">删除场景配置</div>
            <button type="button" className="modal-close" onClick={() => setDeleteIndex(null)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>确认删除该场景训练配置？删除后不可恢复。</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteIndex(null)}>取消</button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>确认删除</button>
          </div>
        </div>
      </div>
    </>
  );
}
