import { useEffect, useMemo, useState } from 'react';

type RoleType = 'teaching' | 'assessment' | 'conversation' | 'companion';
type RoleStatus = 'draft' | 'published';
type RoleTag = '主要角色' | '辅助角色' | 'Premium';

type AiRole = {
  id: string;
  name: string;
  summary: string;
  roleType: RoleType;
  model: string;
  languagePref: string;
  systemPrompt: string;
  tag: RoleTag;
  status: RoleStatus;
  updatedAt: string;
  features: {
    grammar: boolean;
    pronunciation: boolean;
    translation: boolean;
    nuance: boolean;
    memory: boolean;
  };
};

const STORAGE_KEY = 'nsk-ai-roles-v2';

const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  teaching: '教学型',
  assessment: '测评型',
  conversation: '对话型',
  companion: '陪伴型',
};

const DEFAULT_ROLES: AiRole[] = [
  {
    id: 'AR0001',
    name: 'AI 老师 Lin',
    summary: '主教学 · 语法纠错 · 发音评测',
    roleType: 'teaching',
    model: 'qwen-max',
    languagePref: 'cn-native-auto',
    systemPrompt: '你是NSK的中文老师Lin，帮助12岁+学习者高效完成口语训练与纠错。',
    tag: '主要角色',
    status: 'published',
    updatedAt: formatNow(),
    features: { grammar: true, pronunciation: true, translation: true, nuance: true, memory: false },
  },
  {
    id: 'AR0002',
    name: 'AI 词典助手',
    summary: '即时查词 · 字源 · OCR 联动',
    roleType: 'assessment',
    model: 'deepseek-v3',
    languagePref: 'cn-en',
    systemPrompt: '你是词典型AI，优先提供释义、词性、例句与用法差异。',
    tag: '辅助角色',
    status: 'published',
    updatedAt: formatNow(),
    features: { grammar: true, pronunciation: false, translation: true, nuance: true, memory: true },
  },
  {
    id: 'AR0003',
    name: 'AI 陪伴伙伴',
    summary: '自由对话 · 情感陪伴',
    roleType: 'companion',
    model: 'kimi-k2',
    languagePref: 'cn-native-auto',
    systemPrompt: '你是陪伴型老师，语气友好，鼓励用户持续表达与复述。',
    tag: 'Premium',
    status: 'draft',
    updatedAt: formatNow(),
    features: { grammar: true, pronunciation: false, translation: true, nuance: false, memory: true },
  },
];

const EMPTY_FORM: AiRole = {
  id: '',
  name: '',
  summary: '',
  roleType: 'teaching',
  model: 'qwen-max',
  languagePref: 'cn-native-auto',
  systemPrompt: '',
  tag: '主要角色',
  status: 'draft',
  updatedAt: '',
  features: { grammar: true, pronunciation: true, translation: true, nuance: true, memory: false },
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
    const parsed = JSON.parse(raw) as AiRole[];
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_ROLES;
    return parsed;
  } catch {
    return DEFAULT_ROLES;
  }
}

function badgeClass(tag: RoleTag) {
  if (tag === '主要角色') return 'badge badge-teal';
  if (tag === '辅助角色') return 'badge badge-muted';
  return 'badge badge-amber';
}

function roleEmoji(type: RoleType) {
  if (type === 'teaching') return '🧑‍🏫';
  if (type === 'assessment') return '📖';
  if (type === 'conversation') return '💬';
  return '🤝';
}

export function AiRoles() {
  const [rows, setRows] = useState<AiRole[]>(() => loadRoles());
  const [selectedId, setSelectedId] = useState<string>(() => loadRoles()[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AiRole>(EMPTY_FORM);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId), [rows, selectedId]);

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
      summary: form.summary.trim(),
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
                <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{roleEmoji(row.roleType)}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-light)', marginTop: 3 }}>{row.summary || '未填写角色摘要'}</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className={badgeClass(row.tag)}>{row.tag}</span>
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
              <div className="form-group">
                <label className="form-label">角色类型</label>
                <select value={form.roleType} onChange={(e) => setForm((f) => ({ ...f, roleType: e.target.value as RoleType }))}>
                  <option value="teaching">教学型</option>
                  <option value="assessment">测评型</option>
                  <option value="conversation">对话型</option>
                  <option value="companion">陪伴型</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">角色标签</label>
                <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value as RoleTag }))}>
                  <option value="主要角色">主要角色</option>
                  <option value="辅助角色">辅助角色</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="form-group full">
              <label className="form-label">角色摘要（卡片展示）</label>
              <input type="text" value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} placeholder="如：主教学 · 语法纠错 · 发音评测" />
            </div>

            <div className="form-row">
              <div className="form-group">
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
              <div className="form-group">
                <label className="form-label">回复语言偏好</label>
                <select value={form.languagePref} onChange={(e) => setForm((f) => ({ ...f, languagePref: e.target.value }))}>
                  <option value="cn-native-auto">中文 + 用户母语（自动识别，兜底中英）</option>
                  <option value="cn-en">中文 + 英语</option>
                  <option value="cn-es">中文 + 西语</option>
                  <option value="cn-fr">中文 + 法语</option>
                  <option value="cn-pt">中文 + 葡语</option>
                  <option value="cn-ja">中文 + 日语</option>
                  <option value="cn-ko">中文 + 韩语</option>
                  <option value="cn-th">中文 + 泰语</option>
                  <option value="cn-vi">中文 + 越南语</option>
                  <option value="cn-id">中文 + 印尼语</option>
                  <option value="cn-ms">中文 + 马来语</option>
                  <option value="cn-km">中文 + 高棉语</option>
                  <option value="zh">仅中文</option>
                </select>
              </div>
            </div>

            <div className="form-group full" style={{ marginBottom: 14 }}>
              <label className="form-label">System Prompt（角色人设）</label>
              <textarea
                style={{ minHeight: 100 }}
                value={form.systemPrompt}
                onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                placeholder="输入角色人设和回复规范"
              />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '.4px', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 10 }}>功能开关</div>
              {[
                ['grammar', '语法纠错', '自动检测并纠正用户语法错误'],
                ['pronunciation', '发音评测', '使用语音识别评估发音准确度'],
                ['translation', '翻译辅助', '提供中英文对照翻译'],
                ['nuance', '语境细微差别解析', '深度解析词汇在不同语境下的用法差异'],
                ['memory', '对话历史记忆', '跨轮次记忆当前会话上下文'],
              ].map(([k, title, desc]) => (
                <div className="toggle-row" key={k}>
                  <div>
                    <div className="toggle-label">{title}</div>
                    <div className="toggle-desc">{desc}</div>
                  </div>
                  <label className="toggle-wrap">
                    <input
                      type="checkbox"
                      checked={form.features[k as keyof AiRole['features']]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          features: { ...f.features, [k]: e.target.checked },
                        }))
                      }
                    />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" onClick={() => saveForm(false)}>💾 保存配置</button>
            <button type="button" className="btn btn-secondary" onClick={() => saveForm(true)}>发布更新</button>
            {editingId && <button type="button" className="btn btn-danger ml-auto" onClick={() => deleteRole(editingId)}>删除角色</button>}
          </div>
        </div>
      </div>
    </>
  );
}
