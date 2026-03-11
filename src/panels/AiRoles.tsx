import { useEffect, useMemo, useState } from 'react';

type RoleType = 'conversation' | 'assessment' | 'explanation';
type RoleStatus = 'draft' | 'published';

const SUMMARY_GOALS_MAX = 10;

type AiRole = {
  id: string;
  name: string;
  summaryGoals: string[];
  roleType: RoleType;
  model: string;
  systemPrompt: string;
  avatarUrl: string;
  /** 是否启用头像；关闭时仅显示角色类型对应 emoji */
  avatarEnabled: boolean;
  status: RoleStatus;
  updatedAt: string;
  features: {
    pronunciation: boolean;
    translation: boolean;
    promptDeepParse: string;
    promptReportInterpret: string;
  };
};

const STORAGE_KEY = 'nsk-ai-roles-v2';

/** 头像资源库（与资源库一致：从资源库调取，此处为模拟列表，可后续对接 MediaLib） */
const AVATAR_IMAGE_LIBRARY: { id: string; name: string; url: string }[] = [
  { id: 'avatar-1', name: '默认头像 1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'avatar-2', name: '默认头像 2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'avatar-3', name: '默认头像 3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  { id: 'avatar-4', name: '默认头像 4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
  { id: 'avatar-5', name: '默认头像 5', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
];

const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  conversation: '对话型',
  assessment: '测评型',
  explanation: '讲解型',
};

const DEFAULT_ROLES: AiRole[] = [
  {
    id: 'AR0001',
    name: 'AI 老师 Lin',
    summaryGoals: ['主教学', '发音评测', '深度解析'],
    roleType: 'explanation',
    model: 'qwen-max',
    systemPrompt: '你是NSK的中文老师Lin，帮助12岁+学习者高效完成口语训练与纠错。回复使用中文 + 用户母语（自动识别，兜底中英）。',
    avatarUrl: '',
    avatarEnabled: true,
    status: 'published',
    updatedAt: formatNow(),
    features: { pronunciation: true, translation: true, promptDeepParse: '', promptReportInterpret: '' },
  },
  {
    id: 'AR0002',
    name: 'AI 词典助手',
    summaryGoals: ['即时查词', '字源', 'OCR 联动'],
    roleType: 'assessment',
    model: 'deepseek-v3',
    systemPrompt: '你是词典型AI，优先提供释义、词性、例句与用法差异。',
    avatarUrl: '',
    avatarEnabled: false,
    status: 'published',
    updatedAt: formatNow(),
    features: { pronunciation: false, translation: true, promptDeepParse: '', promptReportInterpret: '' },
  },
  {
    id: 'AR0003',
    name: 'AI 对话伙伴',
    summaryGoals: ['自由对话', '场景练习'],
    roleType: 'conversation',
    model: 'kimi-k2',
    systemPrompt: '你是对话型老师，语气友好，鼓励用户持续表达与复述。',
    avatarUrl: '',
    avatarEnabled: true,
    status: 'draft',
    updatedAt: formatNow(),
    features: { pronunciation: false, translation: true, promptDeepParse: '', promptReportInterpret: '' },
  },
];

const EMPTY_FORM: AiRole = {
  id: '',
  name: '',
  summaryGoals: [],
  roleType: 'conversation',
  model: 'qwen-max',
  systemPrompt: '',
  avatarUrl: '',
  avatarEnabled: true,
  status: 'draft',
  updatedAt: '',
  features: { pronunciation: true, translation: true, promptDeepParse: '', promptReportInterpret: '' },
};

function formatNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function loadRoles(): AiRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLES;
    const parsed = JSON.parse(raw) as (AiRole & { summary?: string; tag?: string; features?: Record<string, unknown> })[];
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_ROLES;
    return parsed.map((r) => migrateRole(r)) as AiRole[];
  } catch {
    return DEFAULT_ROLES;
  }
}

function migrateRole(r: AiRole & { summary?: string; summaryGoals?: string[]; tag?: string; avatarUrl?: string; avatarEnabled?: boolean; features?: Record<string, unknown> }): AiRole {
  const summaryGoals = Array.isArray(r.summaryGoals)
    ? r.summaryGoals.slice(0, SUMMARY_GOALS_MAX)
    : r.summary
      ? [r.summary]
      : [];
  const f = r.features as AiRole['features'] | undefined;
  return {
    id: r.id,
    name: r.name,
    summaryGoals,
    roleType: (r.roleType === 'teaching' || r.roleType === 'companion' ? 'conversation' : r.roleType) as RoleType,
    model: r.model ?? 'qwen-max',
    systemPrompt: r.systemPrompt ?? '',
    avatarUrl: r.avatarUrl ?? '',
    avatarEnabled: r.avatarEnabled ?? true,
    status: r.status,
    updatedAt: r.updatedAt ?? formatNow(),
    features: {
      pronunciation: f?.pronunciation ?? true,
      translation: f?.translation ?? true,
      promptDeepParse: f?.promptDeepParse ?? '',
      promptReportInterpret: f?.promptReportInterpret ?? '',
    },
  };
}

function roleEmoji(type: RoleType) {
  if (type === 'explanation') return '🧑‍🏫';
  if (type === 'assessment') return '📖';
  return '💬';
}

export function AiRoles() {
  const [rows, setRows] = useState<AiRole[]>(() => loadRoles());
  const [selectedId, setSelectedId] = useState<string>(() => loadRoles()[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AiRole>(EMPTY_FORM);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarKeyword, setAvatarKeyword] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId), [rows, selectedId]);

  const avatarOptions = useMemo(() => {
    const kw = avatarKeyword.trim().toLowerCase();
    if (!kw) return AVATAR_IMAGE_LIBRARY;
    return AVATAR_IMAGE_LIBRARY.filter((m) => m.id.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw));
  }, [avatarKeyword]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      id: `AR${String(Date.now()).slice(-6)}`,
    });
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    setEditingId(id);
    setForm({ ...target, features: { ...target.features } });
    setModalOpen(true);
  };

  const saveForm = (publish: boolean) => {
    if (!form.name.trim()) return;
    const next: AiRole = {
      ...form,
      name: form.name.trim(),
      summaryGoals: form.summaryGoals.filter(Boolean).slice(0, SUMMARY_GOALS_MAX),
      systemPrompt: form.systemPrompt.trim(),
      status: publish ? 'published' : form.status,
      updatedAt: formatNow(),
    };
    setRows((prev) => {
      if (!editingId) return [next, ...prev];
      return prev.map((r) => (r.id === editingId ? next : r));
    });
    setSelectedId(next.id);
    setModalOpen(false);
  };

  const deleteRole = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (selectedId === id) {
      const fallback = rows.find((r) => r.id !== id);
      setSelectedId(fallback?.id ?? '');
    }
    setModalOpen(false);
  };

  const quickPublish = (id: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'published' ? 'draft' : 'published',
              updatedAt: formatNow(),
            }
          : r,
      ),
    );
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">AI 角色配置</div>
          <div className="page-subtitle">角色可反复编辑并保存；发布后实时更新到训练端调用</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>+ 新建角色</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">角色列表</div>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ marginBottom: 18 }}>
            {rows.map((row) => (
              <div
                key={row.id}
                className={`ai-role-card ${selectedId === row.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(row.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedId(row.id)}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 6, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 10, background: 'var(--bg)' }}>
                  {row.avatarEnabled && row.avatarUrl && (
                    <img
                      src={row.avatarUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        const fallback = el.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  )}
                  <span style={{ fontSize: '1.8rem', display: row.avatarEnabled && row.avatarUrl ? 'none' : 'block' }}>{roleEmoji(row.roleType)}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-light)', marginTop: 3 }}>{row.summaryGoals?.length ? row.summaryGoals.join(' · ') : '未填写角色摘要'}</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className={row.status === 'published' ? 'badge badge-green' : 'badge'}>{row.status === 'published' ? '已发布' : '草稿'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(row.id); }}>编辑</button>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); quickPublish(row.id); }}>
                    {row.status === 'published' ? '下线' : '发布'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="form-hint">
              当前选中：{selected.name} · {ROLE_TYPE_LABELS[selected.roleType]} · 最近更新 {selected.updatedAt}
            </div>
          )}
        </div>
      </div>

      <div className={`modal-overlay ${modalOpen ? 'open' : ''}`} onClick={() => setModalOpen(false)} role="dialog" aria-modal="true" aria-label="角色配置">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 920 }}>
          <div className="modal-header">
            <div className="modal-title">{editingId ? '编辑角色配置' : '新建角色配置'}</div>
            <button type="button" className="modal-close" onClick={() => setModalOpen(false)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">角色ID</label>
                <input type="text" value={form.id} readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">角色名称</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="如：AI 老师 Lin" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ minWidth: 0 }}>
                <label className="form-label">角色类型</label>
                <select value={form.roleType} onChange={(e) => setForm((f) => ({ ...f, roleType: e.target.value as RoleType }))}>
                  <option value="conversation">对话型</option>
                  <option value="assessment">测评型</option>
                  <option value="explanation">讲解型</option>
                </select>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">底层 AI 模型</label>
                  <select value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}>
                    <option value="qwen-max">通义千问 Qwen-Max（阿里）</option>
                    <option value="ernie-4.0">文心一言 ERNIE 4.0（百度）</option>
                    <option value="doubao-pro">豆包 Pro（字节）</option>
                    <option value="glm-4">智谱 GLM-4（智谱）</option>
                    <option value="spark-max">讯飞星火 Max（科大讯飞）</option>
                    <option value="kimi-k2">Kimi K2（月之暗面）</option>
                    <option value="deepseek-v3">DeepSeek V3（深度求索）</option>
                    <option value="hunyuan">腾讯混元 Hunyuan（腾讯）</option>
                    <option value="baichuan4">百川 Baichuan4（百川）</option>
                    <option value="yi-large">零一万物 Yi-Large（零一）</option>
                    <option value="gpt4o">GPT-4o (OpenAI)</option>
                    <option value="claude">Claude 3.5 Sonnet</option>
                    <option value="gemini">Gemini Pro</option>
                  </select>
                </div>
              </div>
              <div
                style={{
                  border: '1px solid var(--stone-dark)',
                  borderRadius: 12,
                  background: 'var(--white)',
                  padding: 14,
                  minWidth: 0,
                  alignSelf: 'stretch',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)' }}>头像配置</div>
                  <label className="toggle-wrap" style={{ marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={form.avatarEnabled}
                      onChange={(e) => setForm((f) => ({ ...f, avatarEnabled: e.target.checked }))}
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                {form.avatarEnabled ? (
                  <>
                    <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像图片；点击更换可重新选择</p>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          background: 'var(--bg)',
                          borderRadius: 10,
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {form.avatarUrl ? (
                          <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <span style={{ fontSize: '1.5rem' }} title={ROLE_TYPE_LABELS[form.roleType]}>{roleEmoji(form.roleType)}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAvatarPickerOpen(true)}>
                          更换
                        </button>
                        {form.avatarUrl && <div className="form-hint" style={{ marginTop: 0 }}>已选头像</div>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        background: 'var(--bg)',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '2rem' }} title={ROLE_TYPE_LABELS[form.roleType]}>{roleEmoji(form.roleType)}</span>
                    </div>
                    <p className="form-hint" style={{ marginTop: 0, marginBottom: 0 }}>关闭后仅显示角色类型默认 emoji（{ROLE_TYPE_LABELS[form.roleType]}）</p>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group full">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>角色目标</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={form.summaryGoals.length >= SUMMARY_GOALS_MAX}
                  onClick={() => setForm((f) => ({ ...f, summaryGoals: [...f.summaryGoals, `目标${f.summaryGoals.length + 1}`] }))}
                >
                  + 新增目标
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                {form.summaryGoals.map((g, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="td-mono" style={{ width: 52 }}>{`目标${idx + 1}`}</span>
                    <input
                      className="form-input"
                      value={g}
                      onChange={(e) => {
                        const next = [...form.summaryGoals];
                        next[idx] = e.target.value;
                        setForm((f) => ({ ...f, summaryGoals: next }));
                      }}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setForm((f) => ({ ...f, summaryGoals: f.summaryGoals.filter((_, i) => i !== idx) }))}>删除</button>
                  </div>
                ))}
                {form.summaryGoals.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>暂无目标，可点击「+ 新增目标」添加（最多 {SUMMARY_GOALS_MAX} 条）</span>}
              </div>
            </div>

            <div className="form-group full" style={{ marginBottom: 14 }}>
              <label className="form-label">System Prompt（角色人设）</label>
              <textarea
                style={{ minHeight: 100 }}
                value={form.systemPrompt}
                onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                placeholder="输入角色人设和回复规范（含回复语言偏好，如：中文+用户母语）"
              />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 10 }}>功能开关</div>
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">发音评测</div>
                  <div className="toggle-desc">使用语音识别评估发音准确度</div>
                </div>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={form.features.pronunciation} onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, pronunciation: e.target.checked } }))} />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
              <div className="toggle-row">
                <div>
                  <div className="toggle-label">翻译辅助</div>
                  <div className="toggle-desc">提供中英文对照翻译</div>
                </div>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={form.features.translation} onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, translation: e.target.checked } }))} />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
            </div>

            <div className="form-group full" style={{ marginTop: 14 }}>
              <label className="form-label">深度解析（Prompt 文案）</label>
              <textarea
                style={{ minHeight: 72 }}
                value={form.features.promptDeepParse}
                onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, promptDeepParse: e.target.value } }))}
                placeholder="自动检测并纠正用户语法错误的 prompt 配置"
              />
            </div>
            <div className="form-group full">
              <label className="form-label">学习报告AI解读（Prompt 文案）</label>
              <textarea
                style={{ minHeight: 72 }}
                value={form.features.promptReportInterpret}
                onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, promptReportInterpret: e.target.value } }))}
                placeholder="深度解析词汇在不同语境下用法差异的 prompt 配置"
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={() => saveForm(false)}>💾 保存配置</button>
            <button type="button" className="btn btn-secondary" onClick={() => saveForm(true)}>发布更新</button>
            {editingId && <button type="button" className="btn btn-danger ml-auto" onClick={() => deleteRole(editingId)}>删除角色</button>}
          </div>
        </div>
      </div>

      {/* 资源库选择 · 头像图片 */}
      <div className={`modal-overlay ${avatarPickerOpen ? 'open' : ''}`} onClick={() => { setAvatarPickerOpen(false); setAvatarKeyword(''); }} role="dialog" aria-modal="true" aria-label="资源库选择">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div className="modal-header">
            <div className="modal-title">资源库选择 · 头像图片</div>
            <button type="button" className="modal-close" onClick={() => { setAvatarPickerOpen(false); setAvatarKeyword(''); }} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <label className="form-label">搜索资源</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入资源ID / 文件名关键词"
              value={avatarKeyword}
              onChange={(e) => setAvatarKeyword(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <label className="form-label">资源列表（{avatarOptions.length}）</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {avatarOptions.map((m) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <img src={m.url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{m.name}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setForm((f) => ({ ...f, avatarUrl: m.url })); setAvatarPickerOpen(false); setAvatarKeyword(''); }}>选择</button>
                </div>
              ))}
              {avatarOptions.length === 0 && <div style={{ padding: 16, color: 'var(--ink-light)' }}>无匹配资源，请修改关键词。</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
