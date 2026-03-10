import { useMemo, useState } from 'react';

type LangKey = 'CN' | 'EN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';
type ScoreBand = 'low' | 'mid' | 'high';
type ScoreDimension = 'pronunciation' | 'fluency' | 'accuracy' | 'completion';

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
  usageScene: string;
  level: '初级' | '中级' | '高级';
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
  usageScene: '场景训练（可控性训练）',
  level: tpl.level,
  themeNameByLang: createEmptyLangMap(tpl.cn, tpl.en),
  themeCategory: tpl.category,
  topicBackground: tpl.background,
  topicDesc: tpl.topicDesc,
  roleA: tpl.roleA,
  roleB: tpl.roleB,
  userPickRole: 'A',
  aiPrompt: `你是场景训练AI教练，必须由AI先开口，严格围绕「${tpl.cn}」场景进行可控训练。`,
  turnLimit: 8,
  enablePronunciationScore: true,
  scoreWeight: { pronunciation: 35, fluency: 25, accuracy: 25, completion: 15 },
  scoreFeedbackByBand: createEmptyBandMap(),
  finalEvalPrompt: '请基于本次场景训练输出总评、分项评分、错误要点和复练建议。',
  status: 'published',
  updated: '2026-03-01',
});

const seedRows: SceneConfig[] = SCENE_TEMPLATES.map((tpl, idx) => ({
  ...buildFromTemplate(tpl),
  status: idx === 1 ? 'draft' : 'published',
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
  const [feedbackLang, setFeedbackLang] = useState<LangKey>('CN');
  const [form, setForm] = useState<SceneConfig>(seedRows[0]);

  const publishedCount = useMemo(() => rows.filter((r) => r.status === 'published').length, [rows]);
  const aiSpeakRole = form.userPickRole === 'A' ? 'B' : 'A';

  const langBtnStyle = (key: LangKey, active: boolean) =>
    key === 'CN'
      ? active
        ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' }
        : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }
      : undefined;

  const applyTemplate = (templateKey: string) => {
    const tpl = SCENE_TEMPLATES.find((t) => t.key === templateKey);
    if (!tpl) return;
    setForm((prev) => {
      const fixed = buildFromTemplate(tpl);
      return {
        ...prev,
        templateKey: fixed.templateKey,
        icon: fixed.icon,
        level: fixed.level,
        themeNameByLang: fixed.themeNameByLang,
        themeCategory: fixed.themeCategory,
        topicBackground: fixed.topicBackground,
        topicDesc: fixed.topicDesc,
        roleA: fixed.roleA,
        roleB: fixed.roleB,
        aiPrompt: fixed.aiPrompt,
      };
    });
  };

  const openCreate = () => {
    const base = buildFromTemplate(SCENE_TEMPLATES[0]);
    setEditingIndex(null);
    setThemeLang('CN');
    setFeedbackLang('CN');
    setForm({ ...base, status: 'draft', updated: '' });
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
                <div className={`tog ${row.status === 'published' ? 'on' : ''}`} />
              </div>
            </div>
            <div className="scene-meta"><span>👤 {row.roleA} vs {row.roleB}</span><span>🔄 {row.turnLimit}轮 / 可控训练</span></div>
            <div className="scene-goals">
              <div className="scene-goal-item">{row.themeCategory}</div>
              <div className="scene-goal-item">{row.topicBackground}</div>
            </div>
            <div className="scene-footer">
              <span className="td-mono" style={{ fontSize: 10.5 }}>更新 {row.updated}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(idx)}>编辑配置 →</button>
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
            <div className="section-title" style={{ marginTop: 0 }}>固定场景模板（不可自由替换）</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">场景模板</label>
                <select
                  className="form-input form-select"
                  value={form.templateKey}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  {SCENE_TEMPLATES.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>{tpl.cn} · {tpl.en}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">训练类型</label>
                <input className="form-input" value="可控性训练（固定场景）" readOnly />
              </div>
            </div>

            <div className="section-title">基础信息</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">AI 名称</label>
                <input className="form-input" value={form.aiName} onChange={(e) => setForm((p) => ({ ...p, aiName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">用于模块</label>
                <input className="form-input" value={form.usageScene} onChange={(e) => setForm((p) => ({ ...p, usageScene: e.target.value }))} />
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
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">主题分类（固定模板带出）</label>
                <input className="form-input" value={form.themeCategory} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">话题背景（固定模板带出）</label>
                <input className="form-input" value={form.topicBackground} readOnly />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">背景话题说明（固定模板带出）</label>
              <textarea className="form-input" rows={2} value={form.topicDesc} readOnly />
            </div>

            <div className="section-title">人物关系与开场规则</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">A 角色（固定）</label>
                <input className="form-input" value={form.roleA} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">B 角色（固定）</label>
                <input className="form-input" value={form.roleB} readOnly />
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
                <input className="form-input" value={`AI 扮演 ${aiSpeakRole} · 永远由 AI 先开口`} readOnly />
              </div>
            </div>

            <div className="section-title">Prompt 与对话限制</div>
            <div className="form-group">
              <label className="form-label">场景 Prompt（限定内容）</label>
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
                <input type="checkbox" checked={form.enablePronunciationScore} onChange={(e) => setForm((p) => ({ ...p, enablePronunciationScore: e.target.checked }))} />
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
                <textarea className="form-input" rows={2} value={form.scoreFeedbackByBand.low[feedbackLang]} onChange={(e) => updateBandFeedback('low', feedbackLang, e.target.value)} placeholder="低分反馈（0-59）" />
                <textarea className="form-input" rows={2} value={form.scoreFeedbackByBand.mid[feedbackLang]} onChange={(e) => updateBandFeedback('mid', feedbackLang, e.target.value)} placeholder="中分反馈（60-84）" />
                <textarea className="form-input" rows={2} value={form.scoreFeedbackByBand.high[feedbackLang]} onChange={(e) => updateBandFeedback('high', feedbackLang, e.target.value)} placeholder="高分反馈（85-100）" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">整段表现评估 Prompt</label>
              <textarea className="form-input" rows={3} value={form.finalEvalPrompt} onChange={(e) => setForm((p) => ({ ...p, finalEvalPrompt: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={saveForm}>保存配置</button>
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
