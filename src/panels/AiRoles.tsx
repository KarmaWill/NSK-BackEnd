import { useEffect, useMemo, useState } from 'react';

type RoleType = 'conversation' | 'assessment' | 'explanation';
type RoleStatus = 'draft' | 'published';

type LangKey = 'CN' | 'EN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';
/** 学习报告分值档位 */
type ReportBand = '0-40' | '40-60' | '60-80' | '80-90' | '90-100';

const SUMMARY_GOALS_MAX = 10;

const LANG_OPTIONS: Array<{ key: LangKey; label: string }> = [
  { key: 'CN', label: '中文' }, { key: 'EN', label: '英文' }, { key: 'ES', label: '西语' }, { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' }, { key: 'JA', label: '日语' }, { key: 'KO', label: '韩语' }, { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' }, { key: 'ID', label: '印尼语' }, { key: 'MS', label: '马来语' }, { key: 'KM', label: '高棉语' },
];
function createEmptyLangMap(cn = '', en = ''): Record<LangKey, string> {
  return { CN: cn, EN: en, ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' };
}
const REPORT_BANDS: ReportBand[] = ['0-40', '40-60', '60-80', '80-90', '90-100'];
const REPORT_INTERPRET_PROMPT_TEMPLATE = `请根据以下对话生成解析，严格按上述JSON输出：
【对话记录】
{{对话内容}}
角色3-深度解析
你是专业的AI中文学习评估老师，负责在对话结束后生成客观、鼓励型、可落地的学习报告。

输出规则：
1. 只输出合法JSON，不输出任何多余文字。
2. 严格按下面结构输出，每个字段含义已标注清楚。
3. key_fixes 最多输出5条，只挑影响理解的错误。
4. 评分基于真实对话，先讲优点再讲改进，不使用打击性语言。

【固定输出JSON结构 + 字段说明】
{
  "overall_score": "综合评分（0-100数字）",
  "star_rating": "星级（1-5数字）",
  "study_duration_minutes": "学习时长，单位：分钟（数字）",
  "conversation_rounds": "对话轮数（数字）",
  "perfect_expression_count": "≥80分的完美表达句子数量（数字）",
  "perfect_expression_comment": "根据数量输出：再接再厉/哎呦不错哦/太棒了",
  "evaluation_dimensions": [
    {
      "dimension": "维度名称：流利度/准确度/完整度",
      "score": "该项得分（数字）",
      "comment": "简短评分依据，不超过30字"
    }
  ],
  "ai_feedback": {
    "summary": "AI导师鼓励性总结",
    "focus": "本次重点改进方向（蓝色标签内容）"
  },
  "key_fixes": [
    {
      "error_sentence": "学习者原错误句子",
      "error_reason": "错误原因简要说明",
      "correct_sentence": "正确中文句子"
    }
  ],
  "next_step_suggestion": "具体可执行的下一步学习建议",
  "archive_tip": "报告保存与历史记录提示语"
}`;
function createReportBandMap(): Record<ReportBand, Record<LangKey, string>> {
  return {
    '0-40': createEmptyLangMap('本段表现较弱，建议多听多练本场景核心句型和词汇。', 'Performance in this band needs more practice on core patterns and vocabulary.'),
    '40-60': createEmptyLangMap('有进步空间，建议加强场景常用表达与流利度。', 'Room for improvement; focus on common expressions and fluency.'),
    '60-80': createEmptyLangMap('表现良好，可继续打磨细节与自然度。', 'Good performance; keep refining details and naturalness.'),
    '80-90': createEmptyLangMap('表现优秀，可尝试更复杂或延伸话题。', 'Excellent; try more complex or extended topics.'),
    '90-100': createEmptyLangMap('表现出色，已较好掌握本场景。', 'Outstanding; you have a good grasp of this scenario.'),
  };
}

type ScoreWeight = { pronunciation: number; fluency: number; accuracy: number; completion: number };
type DifficultyLevelKey = 'easy' | 'mid' | 'hard';
type FluencyStrictness = 'loose' | 'normal' | 'strict';
type SpeedRequirement = 'slow_ok' | 'normal';
type DetailGranularity = 'overall' | 'sentence_char' | 'phoneme';

type DifficultyLevelRow = {
  level: DifficultyLevelKey;
  scoreWeight: ScoreWeight;
  pauseThresholdMs: number;
  minPhnScore: number;
  fluencyStrictness: FluencyStrictness;
  toneEnabled: boolean;
  toneWeight: number;
  speedRequirement: SpeedRequirement;
};

type FeedbackConfig = {
  showOverall: boolean;
  showAccuracy: boolean;
  showFluency: boolean;
  showWpm: boolean;
  showPause: boolean;
  improvementsMax: number;
  improvementsTriggerBelow: number;
  highlightAbove: number;
  historyMaxCount: number;
  retainAudioUrl: boolean;
  detailGranularity: DetailGranularity;
};

const DEFAULT_SCORE_WEIGHT: ScoreWeight = { pronunciation: 35, fluency: 25, accuracy: 25, completion: 15 };
const DEFAULT_TONE_WEIGHT = 30;
const DEFAULT_DIFFICULTY_LEVELS: DifficultyLevelRow[] = [
  { level: 'easy', scoreWeight: DEFAULT_SCORE_WEIGHT, pauseThresholdMs: 600, minPhnScore: 50, fluencyStrictness: 'loose', toneEnabled: false, toneWeight: DEFAULT_TONE_WEIGHT, speedRequirement: 'slow_ok' },
  { level: 'mid', scoreWeight: DEFAULT_SCORE_WEIGHT, pauseThresholdMs: 400, minPhnScore: 65, fluencyStrictness: 'normal', toneEnabled: true, toneWeight: DEFAULT_TONE_WEIGHT, speedRequirement: 'normal' },
  { level: 'hard', scoreWeight: DEFAULT_SCORE_WEIGHT, pauseThresholdMs: 300, minPhnScore: 75, fluencyStrictness: 'strict', toneEnabled: true, toneWeight: DEFAULT_TONE_WEIGHT, speedRequirement: 'normal' },
];
type AiRole = {
  id: string;
  name: string;
  summaryGoals: string[];
  roleType: RoleType;
  model: string;
  systemPrompt: string;
  avatarUrl: string;
  avatarEnabled: boolean;
  status: RoleStatus;
  updatedAt: string;
  features: {
    pronunciation: boolean;
    translation: boolean;
    promptDeepParse: string;
    promptReportInterpret: string;
    /** 学习报告按分值档位反馈（多语言） */
    reportFeedbackByBand?: Record<ReportBand, Record<LangKey, string>>;
    scoreWeight?: ScoreWeight;
    toneWeight?: number;
    charThreshold?: number;
    difficultyLevels?: DifficultyLevelRow[];
    feedback?: FeedbackConfig;
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
  features: { pronunciation: true, translation: true, promptDeepParse: '', promptReportInterpret: REPORT_INTERPRET_PROMPT_TEMPLATE },
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
  const sw = f?.scoreWeight as ScoreWeight | undefined;
  const dl = f?.difficultyLevels as DifficultyLevelRow[] | undefined;
  const fb = f?.feedback as FeedbackConfig | undefined;
  const reportBands = f?.reportFeedbackByBand as Record<ReportBand, Record<LangKey, string>> | undefined;
  return {
    id: r.id,
    name: r.name,
    summaryGoals,
    roleType: ((r.roleType as string) === 'teaching' || (r.roleType as string) === 'companion' ? 'conversation' : r.roleType) as RoleType,
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
      reportFeedbackByBand: reportBands && typeof reportBands['0-40'] === 'object' ? reportBands : undefined,
      scoreWeight: sw && [sw.pronunciation, sw.fluency, sw.accuracy, sw.completion].every((n) => typeof n === 'number') ? sw : undefined,
      toneWeight: typeof f?.toneWeight === 'number' ? f.toneWeight : undefined,
      charThreshold: typeof f?.charThreshold === 'number' ? f.charThreshold : undefined,
      difficultyLevels: Array.isArray(dl) && dl.length === 3
        ? dl.map((row, idx) => ({
            level: row.level,
            scoreWeight: row.scoreWeight && typeof row.scoreWeight.pronunciation === 'number'
              ? row.scoreWeight
              : (f?.scoreWeight && typeof f.scoreWeight.pronunciation === 'number' ? f.scoreWeight : DEFAULT_DIFFICULTY_LEVELS[idx].scoreWeight),
            pauseThresholdMs: row.pauseThresholdMs,
            minPhnScore: row.minPhnScore,
            fluencyStrictness: row.fluencyStrictness,
            toneEnabled: row.toneEnabled,
            toneWeight: typeof row.toneWeight === 'number'
              ? row.toneWeight
              : (typeof f?.toneWeight === 'number' ? f.toneWeight : DEFAULT_DIFFICULTY_LEVELS[idx].toneWeight),
            speedRequirement: row.speedRequirement,
          }))
        : undefined,
      feedback: fb && typeof fb.showOverall === 'boolean' ? fb : undefined,
    },
  };
}

function roleEmoji(type: RoleType) {
  if (type === 'explanation') return '🧑‍🏫';
  if (type === 'assessment') return '📖';
  return '💬';
}

type RoleFormTab = 'basic' | 'pronunciation' | 'deep-parse' | 'report';
const ROLE_FORM_TABS: { id: RoleFormTab; label: string }[] = [
  { id: 'basic', label: '基础配置' },
  { id: 'pronunciation', label: '发音配置' },
  { id: 'deep-parse', label: '深度解析' },
  { id: 'report', label: '学习报告' },
];

export function AiRoles() {
  const [rows, setRows] = useState<AiRole[]>(() => loadRoles());
  const [selectedId, setSelectedId] = useState<string>(() => loadRoles()[0]?.id ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [roleFormTab, setRoleFormTab] = useState<RoleFormTab>('basic');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AiRole>(EMPTY_FORM);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarKeyword, setAvatarKeyword] = useState('');
  const [reportLang, setReportLang] = useState<LangKey>('CN');
  const [dmCollapsed, setDmCollapsed] = useState(false);

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
    setRoleFormTab('basic');
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
    setRoleFormTab('basic');
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

  const updateReportBandFeedback = (band: ReportBand, lang: LangKey, text: string) => {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        reportFeedbackByBand: {
          ...(prev.features.reportFeedbackByBand ?? createReportBandMap()),
          [band]: {
            ...(prev.features.reportFeedbackByBand?.[band] ?? createEmptyLangMap()),
            [lang]: text,
          },
        },
      },
    }));
  };

  const reportLangBtnStyle = (key: LangKey, active: boolean) =>
    key === 'CN' ? (active ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' } : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' }) : undefined;

  const [publishConfirmRow, setPublishConfirmRow] = useState<AiRole | null>(null);
  const [publishConfirmStep, setPublishConfirmStep] = useState<1 | 2>(1);
  const [publishConfirmText, setPublishConfirmText] = useState('');

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

  const openPublishConfirm = (row: AiRole) => {
    setPublishConfirmRow(row);
    setPublishConfirmStep(1);
    setPublishConfirmText('');
  };

  const closePublishConfirm = () => {
    setPublishConfirmRow(null);
    setPublishConfirmStep(1);
    setPublishConfirmText('');
  };

  const doPublishConfirm = () => {
    if (!publishConfirmRow || publishConfirmText !== publishConfirmRow.name) return;
    quickPublish(publishConfirmRow.id);
    closePublishConfirm();
  };

  if (modalOpen) {
    return (
      <>
        <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModalOpen(false)} aria-label="关闭">✕ 关闭</button>
            <div>
              <div className="page-title">{editingId ? '编辑角色配置' : '新建角色配置'}</div>
              <div className="page-subtitle">{form.name || form.id || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignSelf: 'flex-end' }}>
            {ROLE_FORM_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn btn-sm ${roleFormTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRoleFormTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="card-body" style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
            {roleFormTab === 'basic' && (
              <>
                <div className="section-title" style={{ marginTop: 0 }}>基础信息</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">角色ID</label>
                    <input
                      type="text"
                      className="form-input td-mono"
                      value={form.id}
                      onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                      placeholder="如：AR-0003"
                    />
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
                  <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 12, background: 'var(--white)', padding: 14, minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 700, color: 'var(--ink)' }}>头像配置</div>
                      <label className="toggle-wrap" style={{ marginBottom: 0 }}>
                        <input type="checkbox" checked={form.avatarEnabled} onChange={(e) => setForm((f) => ({ ...f, avatarEnabled: e.target.checked }))} />
                        <span className="toggle-track" />
                        <span className="toggle-thumb" />
                      </label>
                    </div>
                    {form.avatarEnabled ? (
                      <>
                        <p className="form-hint" style={{ marginTop: 0, marginBottom: 10 }}>从资源库选择头像图片；点击更换可重新选择</p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ width: 64, height: 64, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {form.avatarUrl ? (
                              <img src={form.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span style={{ fontSize: '1.5rem' }} title={ROLE_TYPE_LABELS[form.roleType]}>{roleEmoji(form.roleType)}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAvatarPickerOpen(true)}>更换</button>
                            {form.avatarUrl && <div className="form-hint" style={{ marginTop: 0 }}>已选头像</div>}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ width: 64, height: 64, background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '2rem' }} title={ROLE_TYPE_LABELS[form.roleType]}>{roleEmoji(form.roleType)}</span>
                        </div>
                        <p className="form-hint" style={{ marginTop: 0, marginBottom: 0 }}>关闭后仅显示角色类型默认 emoji</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group full">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>角色目标</label>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={form.summaryGoals.length >= SUMMARY_GOALS_MAX} onClick={() => setForm((f) => ({ ...f, summaryGoals: [...f.summaryGoals, `目标${f.summaryGoals.length + 1}`] }))}>+ 新增目标</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {form.summaryGoals.map((g, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span className="td-mono" style={{ width: 52 }}>{`目标${idx + 1}`}</span>
                        <input className="form-input" value={g} onChange={(e) => { const next = [...form.summaryGoals]; next[idx] = e.target.value; setForm((f) => ({ ...f, summaryGoals: next })); }} />
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setForm((f) => ({ ...f, summaryGoals: f.summaryGoals.filter((_, i) => i !== idx) }))}>删除</button>
                      </div>
                    ))}
                    {form.summaryGoals.length === 0 && <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>暂无目标，可点击「+ 新增目标」添加（最多 {SUMMARY_GOALS_MAX} 条）</span>}
                  </div>
                </div>
                <div className="form-group full" style={{ marginBottom: 14 }}>
                  <label className="form-label">System Prompt（角色人设）</label>
                  <textarea style={{ minHeight: 100 }} value={form.systemPrompt} onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))} placeholder="输入角色人设和回复规范（含回复语言偏好，如：中文+用户母语）" />
                </div>
              </>
            )}
            {roleFormTab === 'pronunciation' && (() => {
              const levels = form.features.difficultyLevels ?? DEFAULT_DIFFICULTY_LEVELS;
              const setLevel = (idx: number, patch: Partial<DifficultyLevelRow>) => setForm((f) => {
                const list = f.features.difficultyLevels ?? [...DEFAULT_DIFFICULTY_LEVELS];
                const next = list.map((row, i) => i === idx ? { ...row, ...patch } : row);
                return { ...f, features: { ...f.features, difficultyLevels: next } };
              });
              return (
                <>
                  <div className={`difficulty-module ${dmCollapsed ? 'collapsed' : ''}`}>
                    <div className="dm-header" onClick={() => setDmCollapsed((c) => !c)}>
                      <div className="dm-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>🎚</div>
                      <div>
                        <div className="dm-title">难度级别评测参数</div>
                        <div className="dm-desc">对应 ConfigScreenView 的难度选择器，不同难度使用不同评测严格度</div>
                      </div>
                      <span className="dm-chevron">▾</span>
                    </div>
                    <div className="dm-body">
                      <table className="dm-table">
                        <thead>
                          <tr>
                            <th>难度</th>
                            <th>评分维度权重</th>
                            <th>声调评分权重</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levels.map((row, idx) => (
                            <tr key={row.level}>
                              <td>
                                <span className={`dm-badge ${row.level === 'easy' ? 'dm-badge-green' : row.level === 'mid' ? 'dm-badge-blue' : 'dm-badge-purple'}`}>
                                  {row.level === 'easy' ? '🟢 初级' : row.level === 'mid' ? '🔵 中级' : '🟣 高级'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, border: '1px solid var(--border)', borderRadius: 8, padding: 6, width: 'fit-content' }}>
                                  {[
                                    { key: 'pronunciation' as const, label: '发音权重', val: row.scoreWeight.pronunciation },
                                    { key: 'fluency' as const, label: '流利度权重', val: row.scoreWeight.fluency },
                                    { key: 'accuracy' as const, label: '准确度权重', val: row.scoreWeight.accuracy },
                                    { key: 'completion' as const, label: '完成度权重', val: row.scoreWeight.completion },
                                  ].map(({ key, label, val }) => (
                                    <div key={key} style={{ minWidth: 0, width: 130, border: '1px solid var(--border)', borderRadius: 8, padding: 6 }}>
                                      <label style={{ fontSize: 12, color: 'var(--ink-light)', display: 'block', marginBottom: 4, lineHeight: '16px' }}>{label}</label>
                                      <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={val}
                                        onChange={(e) =>
                                          setLevel(idx, {
                                            scoreWeight: {
                                              ...row.scoreWeight,
                                              [key]: Number(e.target.value) || 0,
                                            },
                                          })
                                        }
                                        style={{ width: 76 }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                <div
                                  className={`swm-total ${row.scoreWeight.pronunciation + row.scoreWeight.fluency + row.scoreWeight.accuracy + row.scoreWeight.completion === 100 ? 'ok' : 'warn'}`}
                                  style={{ marginTop: 8, display: 'inline-block' }}
                                >
                                  {row.scoreWeight.pronunciation + row.scoreWeight.fluency + row.scoreWeight.accuracy + row.scoreWeight.completion === 100
                                    ? '总计: 100% ✓'
                                    : `总计: ${row.scoreWeight.pronunciation + row.scoreWeight.fluency + row.scoreWeight.accuracy + row.scoreWeight.completion}% △`}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <label style={{ fontSize: 12, color: 'var(--ink-light)', display: 'block', marginBottom: 0, whiteSpace: 'nowrap' }}>声调评分权重</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={row.toneEnabled} onChange={(e) => setLevel(idx, { toneEnabled: e.target.checked })} />
                                    <span style={{ fontSize: 12, color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>启用</span>
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={row.toneWeight}
                                    onChange={(e) => setLevel(idx, { toneWeight: Number(e.target.value) || 0 })}
                                    style={{ width: 70 }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
            {roleFormTab === 'deep-parse' && (
              <>
                <div className="section-title" style={{ marginTop: 0 }}>深度解析（Prompt 文案）</div>
                <p className="form-hint" style={{ marginBottom: 10 }}>自动检测并纠正用户语法错误的 prompt 配置</p>
                <textarea
                  className="form-input"
                  style={{ minHeight: 200 }}
                  value={form.features.promptDeepParse}
                  onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, promptDeepParse: e.target.value } }))}
                  placeholder="在此填写深度解析场景下的系统 Prompt，用于指导 AI 如何分析与纠正用户表达中的语法、用词等问题……"
                />
              </>
            )}
            {roleFormTab === 'report' && (
              <>
                <div className="section-title" style={{ marginTop: 0 }}>学习报告 AI 解读（Prompt 文案）</div>
                <p className="form-hint" style={{ marginBottom: 10 }}>学习报告解读的 prompt 配置</p>
                <textarea
                  className="form-input"
                  style={{ minHeight: 200 }}
                  value={form.features.promptReportInterpret}
                  onChange={(e) => setForm((f) => ({ ...f, features: { ...f.features, promptReportInterpret: e.target.value } }))}
                  placeholder="在此填写学习报告解读场景下的系统 Prompt，用于指导 AI 如何解读学习数据、给出改进建议……"
                />
                <div className="section-title" style={{ marginTop: 24 }}>学习报告配置</div>
                <p className="form-hint" style={{ marginTop: 0, marginBottom: 12 }}>根据分值区间配置反馈文案，支持多语言。</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {LANG_OPTIONS.map((o) => (
                    <button key={o.key} type="button" className={`btn btn-sm ${reportLang === o.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setReportLang(o.key)} style={reportLangBtnStyle(o.key, reportLang === o.key)}>{o.key}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {REPORT_BANDS.map((band) => (
                    <div key={band} className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">分值 {band} 分</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={(form.features.reportFeedbackByBand ?? createReportBandMap())[band][reportLang]}
                        onChange={(e) => updateReportBandFeedback(band, reportLang, e.target.value)}
                        placeholder={`该分数段的反馈文案（${reportLang}）`}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="card-footer" style={{ borderTop: '1px solid var(--border)', padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => saveForm(false)}>💾 保存配置</button>
            <button type="button" className="btn btn-secondary" onClick={() => saveForm(true)}>发布更新</button>
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
              <input type="text" className="form-input" placeholder="输入资源ID / 文件名关键词" value={avatarKeyword} onChange={(e) => setAvatarKeyword(e.target.value)} style={{ marginBottom: 12 }} />
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
                  <button type="button" className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); openPublishConfirm(row); }}>
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

      <div className={`modal-overlay ${publishConfirmRow ? 'open' : ''}`} onClick={closePublishConfirm} role="dialog" aria-modal="true" aria-label={publishConfirmRow?.status === 'published' ? '确认下线' : '确认发布'}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
          <div className="modal-header">
            <div className="modal-title">{publishConfirmRow?.status === 'published' ? '下线角色' : '发布角色'}</div>
            <button type="button" className="modal-close" onClick={closePublishConfirm} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            {publishConfirmRow && (
              publishConfirmStep === 1 ? (
                <p style={{ margin: 0 }}>
                  {publishConfirmRow.status === 'published'
                    ? `确认将角色「${publishConfirmRow.name}」设为下线？此操作将使其在训练端不可用。`
                    : `确认将角色「${publishConfirmRow.name}」设为已发布？此操作将使其在训练端可用。`}
                </p>
              ) : (
                <>
                  <p style={{ margin: '0 0 8px' }}>二次确认：请输入角色名称 <b>{publishConfirmRow.name}</b> 以确认{publishConfirmRow.status === 'published' ? '下线' : '发布'}。</p>
                  <input className="form-input" value={publishConfirmText} onChange={(e) => setPublishConfirmText(e.target.value)} placeholder="请输入角色名称" />
                </>
              )
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closePublishConfirm}>取消</button>
            {publishConfirmRow && publishConfirmStep === 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => setPublishConfirmStep(2)}>继续</button>
            )}
            {publishConfirmRow && publishConfirmStep === 2 && (
              <button type="button" className="btn btn-primary" disabled={publishConfirmText !== publishConfirmRow.name} onClick={doPublishConfirm}>
                {publishConfirmRow.status === 'published' ? '确认下线' : '确认发布'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
