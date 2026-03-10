import { useMemo, useState } from 'react';

type LangKey = 'CN' | 'EN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';
type ScoreBand = 'low' | 'mid' | 'high';
type ScoreDimension = 'pronunciation' | 'fluency' | 'accuracy' | 'completion';

type FreeConfig = {
  icon: string;
  aiName: string;
  usageScene: string;
  themeNameByLang: Record<LangKey, string>;
  themeCategory: string;
  topicBackground: string;
  topicDesc: string;
  roleA: string;
  roleB: string;
  userPickRole: 'A' | 'B';
  aiPrompt: string;
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
    roleA: '学习者',
    roleB: '对话伙伴',
    userPickRole: 'A',
    aiPrompt: '你是中文自由对话老师，必须由AI先开口。先问候，再围绕主题逐步提问并纠错。',
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
    roleA: '求职者',
    roleB: '面试官',
    userPickRole: 'A',
    aiPrompt: 'AI先开口，扮演专业面试官，问题由浅入深，结尾给出表达优化建议。',
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
    roleA: '国际学生',
    roleB: '本地朋友',
    userPickRole: 'B',
    aiPrompt: 'AI先开口，以本地朋友身份发起话题，引导用户表达观点与提问。',
    turnLimit: 8,
    enablePronunciationScore: false,
    scoreWeight: { pronunciation: 25, fluency: 30, accuracy: 25, completion: 20 },
    scoreFeedbackByBand: createEmptyBandMap(),
    finalEvalPrompt: '从跨文化理解与表达清晰度角度做总评，并给出后续可练习话题。',
    status: 'draft',
    updated: '2026-02-28',
  },
];

const CATEGORY_OPTIONS = ['生活口语', '校园口语', '商务口语', '旅游口语', '文化口语', '考试口语', '自定义'];
const BACKGROUND_OPTIONS = ['日常沟通', '校园场景', '餐厅点餐', '交通出行', '面试与会议', '节日与习俗', '自定义'];

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
  const [feedbackLang, setFeedbackLang] = useState<LangKey>('CN');
  const [form, setForm] = useState<FreeConfig>(seedConfigs[0]);

  const publishedCount = useMemo(() => rows.filter((r) => r.status === 'published').length, [rows]);
  const draftCount = rows.length - publishedCount;
  const aiSpeakRole = form.userPickRole === 'A' ? 'B' : 'A';

  const openCreate = () => {
    setEditingIndex(null);
    setThemeLang('CN');
    setFeedbackLang('CN');
    setForm({
      icon: '💬',
      aiName: '',
      usageScene: '',
      themeNameByLang: createEmptyLangMap(),
      themeCategory: '生活口语',
      topicBackground: '日常沟通',
      topicDesc: '',
      roleA: '学习者',
      roleB: '对话伙伴',
      userPickRole: 'A',
      aiPrompt: 'AI先开口发起对话。',
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
    setFeedbackLang('CN');
    setForm(rows[idx]);
    setModalOpen(true);
  };

  const saveForm = () => {
    if (!form.aiName.trim() || !form.themeNameByLang.CN.trim()) return;
    const payload = { ...form, updated: formatDate() };
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

  const updateScoreWeight = (k: ScoreDimension, value: number) => {
    setForm((prev) => ({ ...prev, scoreWeight: { ...prev.scoreWeight, [k]: value } }));
  };

  const updateBandFeedback = (band: ScoreBand, lang: LangKey, text: string) => {
    setForm((prev) => ({
      ...prev,
      scoreFeedbackByBand: {
        ...prev.scoreFeedbackByBand,
        [band]: {
          ...prev.scoreFeedbackByBand[band],
          [lang]: text,
        },
      },
    }));
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
          <button type="button" className="btn btn-secondary">导出</button>
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
                <label className="form-label">AI 名称</label>
                <input className="form-input" value={form.aiName} onChange={(e) => setForm((p) => ({ ...p, aiName: e.target.value }))} placeholder="如：AI 自由对话老师 Lin" />
              </div>
              <div className="form-group">
                <label className="form-label">用于模块</label>
                <input className="form-input" value={form.usageScene} onChange={(e) => setForm((p) => ({ ...p, usageScene: e.target.value }))} placeholder="如：自由对话训练 / 场景陪练" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">主题名称（多语言）</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className={`btn btn-sm ${themeLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setThemeLang(o.key)}
                    style={langBtnStyle(o.key, themeLang === o.key)}
                  >
                    {o.key}
                  </button>
                ))}
              </div>
              <input
                className="form-input"
                value={form.themeNameByLang[themeLang]}
                onChange={(e) => setForm((p) => ({ ...p, themeNameByLang: { ...p.themeNameByLang, [themeLang]: e.target.value } }))}
                placeholder={`请输入${LANG_OPTIONS.find((l) => l.key === themeLang)?.label ?? themeLang}主题名称`}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">主题分类</label>
                <select className="form-input form-select" value={form.themeCategory} onChange={(e) => setForm((p) => ({ ...p, themeCategory: e.target.value }))}>
                  {CATEGORY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">话题背景</label>
                <select className="form-input form-select" value={form.topicBackground} onChange={(e) => setForm((p) => ({ ...p, topicBackground: e.target.value }))}>
                  {BACKGROUND_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">背景话题说明</label>
              <textarea className="form-input" rows={2} value={form.topicDesc} onChange={(e) => setForm((p) => ({ ...p, topicDesc: e.target.value }))} />
            </div>

            <div className="section-title">人物关系与开场规则</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">A 角色</label>
                <input className="form-input" value={form.roleA} onChange={(e) => setForm((p) => ({ ...p, roleA: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">B 角色</label>
                <input className="form-input" value={form.roleB} onChange={(e) => setForm((p) => ({ ...p, roleB: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">用户扮演角色</label>
                <select className="form-input form-select" value={form.userPickRole} onChange={(e) => setForm((p) => ({ ...p, userPickRole: e.target.value as 'A' | 'B' }))}>
                  <option value="A">用户扮演 A</option>
                  <option value="B">用户扮演 B</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AI 扮演角色（自动）</label>
                <input className="form-input" value={`AI 扮演 ${aiSpeakRole} · 且永远由 AI 先开口`} readOnly />
              </div>
            </div>

            <div className="section-title">Prompt 与对话限制</div>
            <div className="form-group">
              <label className="form-label">对话 Prompt（限定说话内容）</label>
              <textarea className="form-input" rows={3} value={form.aiPrompt} onChange={(e) => setForm((p) => ({ ...p, aiPrompt: e.target.value }))} />
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

            <div className="section-title">发音评分与反馈报告</div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.enablePronunciationScore}
                  onChange={(e) => setForm((p) => ({ ...p, enablePronunciationScore: e.target.checked }))}
                />
                启用发音评分
              </label>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">发音准确度权重</label>
                <input className="form-input" type="number" min={0} max={100} value={form.scoreWeight.pronunciation} onChange={(e) => updateScoreWeight('pronunciation', Number(e.target.value || 0))} />
              </div>
              <div className="form-group">
                <label className="form-label">流利度权重</label>
                <input className="form-input" type="number" min={0} max={100} value={form.scoreWeight.fluency} onChange={(e) => updateScoreWeight('fluency', Number(e.target.value || 0))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">表达准确度权重</label>
                <input className="form-input" type="number" min={0} max={100} value={form.scoreWeight.accuracy} onChange={(e) => updateScoreWeight('accuracy', Number(e.target.value || 0))} />
              </div>
              <div className="form-group">
                <label className="form-label">目标完成度权重</label>
                <input className="form-input" type="number" min={0} max={100} value={form.scoreWeight.completion} onChange={(e) => updateScoreWeight('completion', Number(e.target.value || 0))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">分值反馈文案（多语言）</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    className={`btn btn-sm ${feedbackLang === o.key ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFeedbackLang(o.key)}
                    style={langBtnStyle(o.key, feedbackLang === o.key)}
                  >
                    {o.key}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.scoreFeedbackByBand.low[feedbackLang]}
                  onChange={(e) => updateBandFeedback('low', feedbackLang, e.target.value)}
                  placeholder="低分反馈（0-59）"
                />
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.scoreFeedbackByBand.mid[feedbackLang]}
                  onChange={(e) => updateBandFeedback('mid', feedbackLang, e.target.value)}
                  placeholder="中分反馈（60-84）"
                />
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.scoreFeedbackByBand.high[feedbackLang]}
                  onChange={(e) => updateBandFeedback('high', feedbackLang, e.target.value)}
                  placeholder="高分反馈（85-100）"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">整段对话评估 Prompt</label>
              <textarea
                className="form-input"
                rows={3}
                value={form.finalEvalPrompt}
                onChange={(e) => setForm((p) => ({ ...p, finalEvalPrompt: e.target.value }))}
                placeholder="用于评估用户整段对话表现的总评 Prompt"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={saveForm}>保存配置</button>
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
