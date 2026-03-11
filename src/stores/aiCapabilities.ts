export type AiCapability = {
  aiId: string;
  levelId: string;
  unitId: string;
  /** 选中的 AI 角色 ID（来自 AI 角色配置） */
  aiRoleId?: string;
  themeNameByLang: Record<LangKey, string>;
  themeCategory: string;
  dialogBackground: string;
  dialogBackgroundByLang: Record<LangKey, string>;
  /** 一句话背景描述，≤20 字（兼容旧数据） */
  shortBackgroundDesc?: string;
  /** 一句话背景描述（多语言） */
  shortBackgroundDescByLang?: Record<LangKey, string>;
  goals: string[];
  prompt: string;
  turnLimit: number;
  roleA: string;
  roleB: string;
  roleAByLang?: Record<LangKey, string>;
  roleBByLang?: Record<LangKey, string>;
  roleATaskByLang?: Record<LangKey, string>;
  roleBTaskByLang?: Record<LangKey, string>;
  roleAAvatarUrl?: string;
  roleBAvatarUrl?: string;
  userPickRole: 'A' | 'B';
  firstSpeaker: 'A' | 'B';
  aiScoreDimension: ScoreDimension;
  aiScoreDescByDimension: Record<ScoreDimension, Record<LangKey, string>>;
  status: '启用' | '停用';
  updatedAt: string;
};

type LangKey = 'EN' | 'CN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'VI' | 'TH' | 'ID' | 'MS' | 'KM';
export type ScoreDimension = 'pronunciation' | 'fluency' | 'accuracy' | 'completeness';

const EMPTY_LANG_MAP: Record<LangKey, string> = {
  EN: '',
  CN: '',
  ES: '',
  FR: '',
  PT: '',
  JA: '',
  KO: '',
  VI: '',
  TH: '',
  ID: '',
  MS: '',
  KM: '',
};

const EMPTY_SCORE_DESC: Record<ScoreDimension, Record<LangKey, string>> = {
  pronunciation: { ...EMPTY_LANG_MAP },
  fluency: { ...EMPTY_LANG_MAP },
  accuracy: { ...EMPTY_LANG_MAP },
  completeness: { ...EMPTY_LANG_MAP },
};

export const AI_CAP_STORAGE_KEY = 'nsk-ai-capabilities-v1';

export const DEFAULT_AI_CAPABILITIES: AiCapability[] = [
  {
    aiId: 'AI-N101-U1-SPEAK-01',
    levelId: '1',
    unitId: 'N10100',
    themeNameByLang: { ...EMPTY_LANG_MAP, EN: 'Ordering Food', CN: '点餐对话' },
    themeCategory: '生活场景',
    dialogBackground: 'A student orders food in a canteen.',
    dialogBackgroundByLang: { ...EMPTY_LANG_MAP, EN: 'A student orders food in a canteen.', CN: '学生在食堂点餐。' },
    goals: ['完成点餐表达', '使用礼貌句式', '纠正常见发音'],
    prompt: '你是耐心的中文口语教练，围绕点餐场景发起对话并逐步引导。',
    turnLimit: 8,
    roleA: '学生',
    roleB: '服务员',
    userPickRole: 'A',
    firstSpeaker: 'B',
    aiScoreDimension: 'pronunciation',
    aiScoreDescByDimension: {
      ...EMPTY_SCORE_DESC,
      pronunciation: { ...EMPTY_LANG_MAP, CN: '重点给出声调、音节准确度建议', EN: 'Focus on tones and syllable accuracy.' },
    },
    status: '启用',
    updatedAt: '2026-03-05 10:20',
  },
  {
    aiId: 'AI-N101-U1-FREE-02',
    levelId: '1',
    unitId: 'N10100',
    themeNameByLang: { ...EMPTY_LANG_MAP, EN: 'Main Foods Free Talk', CN: '主食自由对话' },
    themeCategory: '自由模式',
    dialogBackground: 'Talk about your favorite staple foods and reasons.',
    dialogBackgroundByLang: { ...EMPTY_LANG_MAP, EN: 'Talk about your favorite staple foods and reasons.', CN: '谈谈你喜欢的主食和原因。' },
    goals: ['描述个人偏好', '练习理由表达'],
    prompt: '以自由对话方式交流主食偏好，鼓励用户扩展表达。',
    turnLimit: 10,
    roleA: '学习者',
    roleB: 'AI老师',
    userPickRole: 'A',
    firstSpeaker: 'B',
    aiScoreDimension: 'fluency',
    aiScoreDescByDimension: {
      ...EMPTY_SCORE_DESC,
      fluency: { ...EMPTY_LANG_MAP, CN: '重点反馈停顿、语流和连贯度', EN: 'Focus on pauses, speech flow and coherence.' },
    },
    status: '启用',
    updatedAt: '2026-03-05 10:20',
  },
  {
    aiId: 'AI-N102-U2-SPEAK-01',
    levelId: '1',
    unitId: 'N10200',
    themeNameByLang: { ...EMPTY_LANG_MAP, EN: 'Buying Drinks', CN: '购买饮品' },
    themeCategory: '实战模拟',
    dialogBackground: 'Order drinks at a shop and ask for recommendations.',
    dialogBackgroundByLang: { ...EMPTY_LANG_MAP, EN: 'Order drinks at a shop and ask for recommendations.', CN: '在饮品店点单并询问推荐。' },
    goals: ['掌握饮品词汇', '练习问答衔接'],
    prompt: '模拟饮品店对话，逐步增加表达难度。',
    turnLimit: 8,
    roleA: '顾客',
    roleB: '店员',
    userPickRole: 'B',
    firstSpeaker: 'A',
    aiScoreDimension: 'accuracy',
    aiScoreDescByDimension: {
      ...EMPTY_SCORE_DESC,
      accuracy: { ...EMPTY_LANG_MAP, CN: '重点反馈词法和句法准确性', EN: 'Focus on lexical and grammatical accuracy.' },
    },
    status: '停用',
    updatedAt: '2026-03-05 10:20',
  },
];

export function loadAiCapabilities(): AiCapability[] {
  try {
    const raw = localStorage.getItem(AI_CAP_STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CAPABILITIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_AI_CAPABILITIES;
    const normalized = parsed
      .map((item) => normalizeAiCapability(item))
      .filter(Boolean) as AiCapability[];
    return normalized.length ? normalized : DEFAULT_AI_CAPABILITIES;
  } catch {
    return DEFAULT_AI_CAPABILITIES;
  }
}

export function saveAiCapabilities(list: AiCapability[]) {
  localStorage.setItem(AI_CAP_STORAGE_KEY, JSON.stringify(list));
}

function normalizeAiCapability(input: unknown): AiCapability | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Partial<AiCapability> & {
    name?: string;
    scenario?: string;
    level?: string;
    aiScore?: string;
    aiScoreDesc?: string;
  };
  if (!row.aiId) return null;
  const themeName = row.themeNameByLang?.CN ?? row.themeNameByLang?.EN ?? row.name ?? '';
  if (!themeName) return null;
  const levelId = row.levelId ?? (row.level?.replace('Level ', '') || '1');
  const unitId = row.unitId ?? 'N10100';
  const userPickRole: 'A' | 'B' = row.userPickRole === 'B' ? 'B' : 'A';
  const firstSpeaker: 'A' | 'B' = userPickRole === 'A' ? 'B' : 'A';
  const scoreDimension = normalizeScoreDimension(row.aiScoreDimension);
  const scoreMap = normalizeScoreDescMap(row.aiScoreDescByDimension, row.aiScoreDesc ?? '');
  return {
    aiId: row.aiId,
    levelId,
    unitId,
    aiRoleId: row.aiRoleId ?? undefined,
    themeNameByLang: normalizeLangMap(row.themeNameByLang, themeName),
    themeCategory: row.themeCategory ?? row.level ?? '',
    dialogBackground: row.dialogBackground ?? row.scenario ?? '',
    dialogBackgroundByLang: normalizeLangMap(row.dialogBackgroundByLang, row.dialogBackground ?? row.scenario ?? ''),
    shortBackgroundDesc: row.shortBackgroundDesc ?? undefined,
    shortBackgroundDescByLang: normalizeLangMap(row.shortBackgroundDescByLang, row.shortBackgroundDesc ?? ''),
    goals: Array.isArray(row.goals) ? row.goals.filter(Boolean) : ['目标1', '目标2', '目标3'],
    prompt: row.prompt ?? '',
    turnLimit: typeof row.turnLimit === 'number' && Number.isFinite(row.turnLimit) ? row.turnLimit : 8,
    roleA: row.roleA ?? '学习者',
    roleB: row.roleB ?? 'AI老师',
    roleAByLang: normalizeLangMap(row.roleAByLang, row.roleA ?? ''),
    roleBByLang: normalizeLangMap(row.roleBByLang, row.roleB ?? ''),
    roleATaskByLang: normalizeLangMap(row.roleATaskByLang, ''),
    roleBTaskByLang: normalizeLangMap(row.roleBTaskByLang, ''),
    roleAAvatarUrl: row.roleAAvatarUrl ?? undefined,
    roleBAvatarUrl: row.roleBAvatarUrl ?? undefined,
    userPickRole,
    firstSpeaker,
    aiScoreDimension: scoreDimension,
    aiScoreDescByDimension: scoreMap,
    status: row.status === '停用' ? '停用' : '启用',
    updatedAt: row.updatedAt ?? '',
  };
}

function normalizeLangMap(input: unknown, fallback = ''): Record<LangKey, string> {
  const base: Record<LangKey, string> = { ...EMPTY_LANG_MAP };
  if (!input || typeof input !== 'object') {
    base.EN = fallback;
    return base;
  }
  const row = input as Partial<Record<LangKey, string>>;
  (Object.keys(base) as LangKey[]).forEach((k) => {
    base[k] = row[k] ?? '';
  });
  if (!base.EN) base.EN = fallback;
  return base;
}

function normalizeScoreDimension(input: unknown): ScoreDimension {
  if (input === 'fluency' || input === 'accuracy' || input === 'completeness') return input;
  return 'pronunciation';
}

function normalizeScoreDescMap(
  input: unknown,
  fallbackCurrent = '',
): Record<ScoreDimension, Record<LangKey, string>> {
  const base: Record<ScoreDimension, Record<LangKey, string>> = {
    pronunciation: { ...EMPTY_LANG_MAP },
    fluency: { ...EMPTY_LANG_MAP },
    accuracy: { ...EMPTY_LANG_MAP },
    completeness: { ...EMPTY_LANG_MAP },
  };
  if (!input || typeof input !== 'object') {
    base.pronunciation.CN = fallbackCurrent;
    return base;
  }
  const row = input as Partial<Record<ScoreDimension, unknown>>;
  (Object.keys(base) as ScoreDimension[]).forEach((k) => {
    base[k] = normalizeLangMap(row[k], '');
  });
  return base;
}
