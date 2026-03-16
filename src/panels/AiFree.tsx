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

type FreeConfig = {
  icon: string;
  aiName: string;
  /** 选中的 AI 角色 ID（来自 AI 角色配置） */
  aiRoleId?: string;
  usageScene: string;
  themeNameByLang: Record<LangKey, string>;
  themeCategory: string;
  topicBackground: string;
  /** 话题场景描述（详细），兼容旧数据 */
  topicDesc?: string;
  /** 话题场景描述（多语言），50 字内 */
  topicDescByLang?: Record<LangKey, string>;
  /** 一句话背景描述，不超过 20 字 */
  shortBackgroundDesc?: string;
  /** 一句话背景描述（多语言） */
  shortBackgroundDescByLang?: Record<LangKey, string>;
  roleA: string;
  roleB: string;
  /** A/B 角色名称多语言 */
  roleAByLang?: Record<LangKey, string>;
  roleBByLang?: Record<LangKey, string>;
  /** A/B 角色任务描述多语言 */
  roleATaskByLang?: Record<LangKey, string>;
  roleBTaskByLang?: Record<LangKey, string>;
  roleAAvatarUrl?: string;
  roleBAvatarUrl?: string;
  userPickRole: 'A' | 'B';
  /** 用户扮演 A 时的对话 Prompt（AI 扮演 B，先开口） */
  aiPrompt: string;
  /** 用户扮演 B 时的对话 Prompt（AI 扮演 A，先开口） */
  aiPromptWhenUserB: string;
  turnLimit: number;
  enablePronunciationScore: boolean;
  scoreWeight: Record<ScoreDimension, number>;
  scoreFeedbackByBand: Record<ScoreBand, Record<LangKey, string>>;
  finalEvalPrompt: string;
  status: 'published' | 'draft';
  updated: string;
};

const LANG_OPTIONS: Array<{ key: LangKey; label: string }> = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英文' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

const createEmptyLangMap = (cn = '', en = ''): Record<LangKey, string> => ({
  CN: cn, EN: en, ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '',
});

const createEmptyBandMap = (): Record<ScoreBand, Record<LangKey, string>> => ({
  low: createEmptyLangMap('继续加油，建议先练习发音与基础句式。', 'Keep practicing pronunciation and basic sentence patterns.'),
  mid: createEmptyLangMap('表现不错，可继续提升流利度与表达完整度。', 'Good progress, improve fluency and completeness.'),
  high: createEmptyLangMap('表现优秀，建议挑战更复杂话题。', 'Excellent performance, challenge more complex topics.'),
});

const seedConfigs: FreeConfig[] = [
  {
    icon: '💬',
    aiName: 'AI 自由对话老师 Lin',
    usageScene: '自由对话训练',
    themeNameByLang: createEmptyLangMap('日常自由对话', 'Daily Free Talk'),
    themeCategory: '生活口语',
    topicBackground: '日常沟通',
    topicDesc: '围绕吃饭、出行、购物、校园等常见主题自由对话',
    topicDescByLang: createEmptyLangMap('围绕吃饭、出行、购物、校园等常见主题自由对话', ''),
    shortBackgroundDesc: '日常场景自由对话',
    shortBackgroundDescByLang: createEmptyLangMap('日常场景自由对话', ''),
    roleA: '学习者',
    roleB: '对话伙伴',
    roleAByLang: createEmptyLangMap('学习者', ''),
    roleBByLang: createEmptyLangMap('对话伙伴', ''),
    roleATaskByLang: createEmptyLangMap(),
    roleBTaskByLang: createEmptyLangMap(),
    roleAAvatarUrl: '',
    roleBAvatarUrl: '',
    userPickRole: 'A',
    aiPrompt: '你是中文自由对话老师，必须由AI先开口。先问候，再围绕主题逐步提问并纠错。',
    aiPromptWhenUserB: '你是学习者的对话伙伴，必须由AI先开口。先简短问候，再引导对方用中文表达并适时纠错。',
    turnLimit: 8,
    enablePronunciationScore: true,
    scoreWeight: { pronunciation: 35, fluency: 25, accuracy: 25, completion: 15 },
    scoreFeedbackByBand: createEmptyBandMap(),
    finalEvalPrompt: '基于整段对话，按维度给出总评、分数和改进建议，输出支持多语言。',
    status: 'published',
    updated: '2026-03-01',
  },
  {
    icon: '🧑‍💼',
    aiName: 'AI 商务会话教练',
    usageScene: '商务场景自由对话',
    themeNameByLang: createEmptyLangMap('职场沟通进阶', 'Business Conversation'),
    themeCategory: '商务口语',
    topicBackground: '面试与会议',
    topicDesc: '面试自我介绍、会议沟通、任务汇报',
    topicDescByLang: createEmptyLangMap('面试自我介绍、会议沟通、任务汇报', ''),
    shortBackgroundDesc: '职场面试与会议',
    shortBackgroundDescByLang: createEmptyLangMap('职场面试与会议', ''),
    roleA: '求职者',
    roleB: '面试官',
    roleAByLang: createEmptyLangMap('求职者', ''),
    roleBByLang: createEmptyLangMap('面试官', ''),
    roleATaskByLang: createEmptyLangMap(),
    roleBTaskByLang: createEmptyLangMap(),
    roleAAvatarUrl: '',
    roleBAvatarUrl: '',
    userPickRole: 'A',
    aiPrompt: 'AI先开口，扮演专业面试官，问题由浅入深，结尾给出表达优化建议。',
    aiPromptWhenUserB: 'AI先开口，扮演求职者做自我介绍与回答，引导面试官提问，结尾可请求反馈。',
    turnLimit: 10,
    enablePronunciationScore: true,
    scoreWeight: { pronunciation: 30, fluency: 30, accuracy: 25, completion: 15 },
    scoreFeedbackByBand: createEmptyBandMap(),
    finalEvalPrompt: '综合评估用户在商务表达中的逻辑、礼貌和准确性，并输出下一步训练建议。',
    status: 'published',
    updated: '2026-02-18',
  },
  {
    icon: '🌍',
    aiName: 'AI 文化交流助手',
    usageScene: '文化主题自由对话',
    themeNameByLang: createEmptyLangMap('文化交流对话', 'Culture Talk'),
    themeCategory: '文化口语',
    topicBackground: '节日与习俗',
    topicDesc: '围绕节日、饮食、礼仪等文化话题交流',
    topicDescByLang: createEmptyLangMap('围绕节日、饮食、礼仪等文化话题交流', ''),
    shortBackgroundDesc: '文化交流与习俗',
    shortBackgroundDescByLang: createEmptyLangMap('文化交流与习俗', ''),
    roleA: '国际学生',
    roleB: '本地朋友',
    roleAByLang: createEmptyLangMap('国际学生', ''),
    roleBByLang: createEmptyLangMap('本地朋友', ''),
    roleATaskByLang: createEmptyLangMap(),
    roleBTaskByLang: createEmptyLangMap(),
    roleAAvatarUrl: '',
    roleBAvatarUrl: '',
    userPickRole: 'B',
    aiPrompt: 'AI先开口，以本地朋友身份发起话题，引导用户表达观点与提问。',
    aiPromptWhenUserB: 'AI先开口，以国际学生身份提问，引导本地朋友介绍节日与习俗。',
    turnLimit: 8,
    enablePronunciationScore: false,
    scoreWeight: { pronunciation: 25, fluency: 30, accuracy: 25, completion: 20 },
    scoreFeedbackByBand: createEmptyBandMap(),
    finalEvalPrompt: '从跨文化理解与表达清晰度角度做总评，并给出后续可练习话题。',
    status: 'draft',
    updated: '2026-02-28',
  },
];

/** 头像资源库（与 AiRoles 一致，可后续对接资源库） */
const AVATAR_LIBRARY: { id: string; name: string; url: string }[] = [
  { id: 'avatar-1', name: '默认头像 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'avatar-2', name: '默认头像 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'avatar-3', name: '默认头像 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: 'avatar-4', name: '默认头像 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: 'avatar-5', name: '默认头像 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
];

const formatDate = () => {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};

export function AiFree() {
  const [rows, setRows] = useState<FreeConfig[]>(seedConfigs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [themeLang, setThemeLang] = useState<LangKey>('CN');
  const [topicDescLang, setTopicDescLang] = useState<LangKey>('CN');
  const [shortDescLang, setShortDescLang] = useState<LangKey>('CN');
  const [roleLang, setRoleLang] = useState<LangKey>('CN');
  const [roleTaskLang, setRoleTaskLang] = useState<LangKey>('CN');
  const [, setFeedbackLang] = useState<LangKey>('CN');
  const [form, setForm] = useState<FreeConfig>(seedConfigs[0]);
  const [aiRoleOptions, setAiRoleOptions] = useState<AiRoleOption[]>(() => loadAiRoleOptions());
  const [avatarPickerFor, setAvatarPickerFor] = useState<'A' | 'B' | null>(null);
  const [avatarKeyword, setAvatarKeyword] = useState('');

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

  const publishedCount = useMemo(() => rows.filter((r) => r.status === 'published').length, [rows]);
  const draftCount = rows.length - publishedCount;

  const openCreate = () => {
    setEditingIndex(null);
    setThemeLang('CN');
    setTopicDescLang('CN');
    setShortDescLang('CN');
    setRoleLang('CN');
    setRoleTaskLang('CN');
    setFeedbackLang('CN');
    setForm({
      icon: '💬',
      aiName: '',
      aiRoleId: '',
      usageScene: '',
      themeNameByLang: createEmptyLangMap(),
      themeCategory: '生活口语',
      topicBackground: '日常沟通',
      topicDesc: '',
      topicDescByLang: createEmptyLangMap(),
      shortBackgroundDesc: '',
      shortBackgroundDescByLang: createEmptyLangMap(),
      roleA: '学习者',
      roleB: '对话伙伴',
      roleAByLang: createEmptyLangMap('学习者', ''),
      roleBByLang: createEmptyLangMap('对话伙伴', ''),
      roleATaskByLang: createEmptyLangMap(),
      roleBTaskByLang: createEmptyLangMap(),
      roleAAvatarUrl: '',
      roleBAvatarUrl: '',
      userPickRole: 'A',
      aiPrompt: 'AI先开口发起对话。',
      aiPromptWhenUserB: '',
      turnLimit: 8,
      enablePronunciationScore: true,
      scoreWeight: { pronunciation: 30, fluency: 25, accuracy: 25, completion: 20 },
      scoreFeedbackByBand: createEmptyBandMap(),
      finalEvalPrompt: '',
      status: 'draft',
      updated: '',
    });
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    setEditingIndex(idx);
    setThemeLang('CN');
    setTopicDescLang('CN');
    setShortDescLang('CN');
    setRoleLang('CN');
    setRoleTaskLang('CN');
    setFeedbackLang('CN');
    const row = rows[idx];
    const topicDescByLang = row.topicDescByLang ?? createEmptyLangMap(row.topicDesc ?? '', '');
    const shortBackgroundDescByLang = row.shortBackgroundDescByLang ?? createEmptyLangMap(row.shortBackgroundDesc ?? '', '');
    const roleAByLang = row.roleAByLang ?? createEmptyLangMap(row.roleA ?? '', '');
    const roleBByLang = row.roleBByLang ?? createEmptyLangMap(row.roleB ?? '', '');
    const roleATaskByLang = row.roleATaskByLang ?? createEmptyLangMap();
    const roleBTaskByLang = row.roleBTaskByLang ?? createEmptyLangMap();
    const roles = loadAiRoleOptions();
    const matchedRole = row.aiRoleId ? roles.find((r) => r.id === row.aiRoleId) : roles.find((r) => r.name === row.aiName);
    setForm({ ...row, topicDescByLang, shortBackgroundDescByLang, roleAByLang, roleBByLang, roleATaskByLang, roleBTaskByLang, aiRoleId: matchedRole?.id ?? row.aiRoleId ?? '' });
    setModalOpen(true);
  };

  const saveForm = () => {
    const name = form.aiRoleId ? (aiRoleOptions.find((r) => r.id === form.aiRoleId)?.name ?? form.aiName) : form.aiName;
    if (!form.aiRoleId || !name.trim() || !form.themeNameByLang.CN.trim()) return;
    const roleA = (form.roleAByLang?.CN ?? form.roleA).trim() || form.roleA;
    const roleB = (form.roleBByLang?.CN ?? form.roleB).trim() || form.roleB;
      const shortBackgroundDesc = ((form.shortBackgroundDescByLang?.CN ?? form.shortBackgroundDesc ?? '').trim() || form.shortBackgroundDesc) ?? '';
    const payload = { ...form, aiName: name, topicDesc: form.topicDescByLang?.CN ?? form.topicDesc ?? '', roleA, roleB, shortBackgroundDesc, updated: formatDate() };
    if (editingIndex === null) {
      setRows((prev) => [payload, ...prev]);
    } else {
      setRows((prev) => prev.map((r, i) => (i === editingIndex ? payload : r)));
    }
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

  const langBtnStyle = (key: LangKey, active: boolean) =>
    key === 'CN'
      ? active
        ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' }
        : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }
      : undefined;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">自由对话训练</div>
          <div className="page-subtitle">管理自由对话配置：主题多语言、角色关系、AI先开口、评分与反馈报告</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>+ 新建配置</button>
        </div>
      </div>

      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-icon blue">💬</div><div><div className="stat-val">{rows.length}</div><div className="stat-label">自由训练配置</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-val">{publishedCount}</div><div className="stat-label">已上线</div></div></div>
        <div className="stat-card"><div className="stat-icon amber">📝</div><div><div className="stat-val">{draftCount}</div><div className="stat-label">草稿</div></div></div>
        <div className="stat-card"><div className="stat-icon grey">🗣️</div><div><div className="stat-val">12,841</div><div className="stat-label">本月对话次数</div></div></div>
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <span className="card-title">配置列表</span>
          <span className="table-count" style={{ marginLeft: 8 }}>共 {rows.length} 条</span>
          <div style={{ marginLeft: 'auto' }} className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input placeholder="搜索配置..." />
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              <th>AI 名称 / 主题</th>
              <th>主题分类</th>
              <th>人物关系</th>
              <th>轮数限制</th>
              <th>状态</th>
              <th>最后更新</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.aiName}-${idx}`} style={row.status === 'draft' ? { opacity: 0.72 } : undefined}>
                <td style={{ textAlign: 'center', fontSize: 18 }}>{row.icon}</td>
                <td>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{row.aiName || '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-light)', marginTop: 2 }}>{row.themeNameByLang.CN || '未配置主题'}</div>
                </td>
                <td><span className="badge badge-muted">{row.themeCategory}</span></td>
                <td style={{ fontSize: 12 }}>{row.roleA} / {row.roleB}</td>
                <td><span className="td-mono" style={{ fontSize: 12 }}>{row.turnLimit} 轮</span></td>
                <td><span className={`status-dot ${row.status === 'published' ? 'published' : 'draft'}`}>{row.status === 'published' ? '已上线' : '草稿'}</span></td>
                <td className="td-mono" style={{ fontSize: 11 }}>{row.updated}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(idx)}>编辑</button>
                    {row.status === 'published'
                      ? <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteIndex(idx)}>删除</button>
                      : <button type="button" className="btn btn-secondary btn-sm" onClick={() => togglePublish(idx)}>发布</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)} role="dialog" aria-modal="true" aria-label="自由对话配置">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1120 }}>
          <div className="modal-header">
            <div className="modal-title">{editingIndex === null ? '新建自由对话配置' : '编辑自由对话配置'}</div>
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
              <input className="form-input" maxLength={10} value={form.themeNameByLang[themeLang]} onChange={(e) => setForm((p) => ({ ...p, themeNameByLang: { ...p.themeNameByLang, [themeLang]: e.target.value.slice(0, 10) } }))} placeholder="主题名称（如：咖啡厅闲谈）" />
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
              <textarea className="form-input" rows={3} maxLength={1000} value={form.userPickRole === 'A' ? form.aiPrompt : (form.aiPromptWhenUserB ?? '')} onChange={(e) => setForm((p) => (p.userPickRole === 'A' ? { ...p, aiPrompt: e.target.value.slice(0, 1000) } : { ...p, aiPromptWhenUserB: e.target.value.slice(0, 1000) }))} />
              <div className="form-hint" style={{ marginTop: 4 }}>{(form.userPickRole === 'A' ? form.aiPrompt : (form.aiPromptWhenUserB ?? '')).length}/1000</div>
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

      <div className={`modal-overlay ${deleteIndex !== null ? 'open' : ''}`} onClick={() => setDeleteIndex(null)} role="dialog" aria-modal="true" aria-label="删除配置">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
          <div className="modal-header">
            <div className="modal-title">删除配置</div>
            <button type="button" className="modal-close" onClick={() => setDeleteIndex(null)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>确认删除该自由对话配置？删除后不可恢复。</p>
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
