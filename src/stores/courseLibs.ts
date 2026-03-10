export type CourseModuleKey = 'catalog' | 'resources' | 'medialib' | 'audio-reading' | 'questions' | 'ai-capabilities';
export type CourseModuleConfig = Record<CourseModuleKey, boolean>;

export type CourseLibRow = {
  id: string;
  name: string;
  bizAttr: string;
  modules: CourseModuleConfig;
  status: 'enabled' | 'disabled';
  createdAt: string;
  updatedAt: string;
};

export const COURSE_LIB_STORAGE_KEY = 'nsk-course-libs-v1';
export const COURSE_LIBS_UPDATED_EVENT = 'nsk-course-libs-updated';
export const REQUIRED_MODULES: CourseModuleKey[] = ['catalog', 'resources', 'medialib'];
export const MODULE_OPTIONS: Array<{ key: CourseModuleKey; label: string }> = [
  { key: 'catalog', label: '目录管理' },
  { key: 'resources', label: '学习资源' },
  { key: 'medialib', label: '资源库' },
  { key: 'audio-reading', label: '有声阅读配置' },
  { key: 'questions', label: '题库管理' },
  { key: 'ai-capabilities', label: '课程AI配置' },
];

export const DEFAULT_MODULES: CourseModuleConfig = {
  catalog: true,
  resources: true,
  medialib: true,
  'audio-reading': true,
  questions: true,
  'ai-capabilities': true,
};

const nowStamp = () => new Date().toLocaleString('zh-CN', { hour12: false });

export const DEFAULT_COURSE_LIBS: CourseLibRow[] = [
  {
    id: 'CL-001',
    name: 'NSK体系课程',
    bizAttr: '体系课',
    modules: { ...DEFAULT_MODULES },
    status: 'enabled',
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
  },
];

export function loadCourseLibs(): CourseLibRow[] {
  try {
    const raw = localStorage.getItem(COURSE_LIB_STORAGE_KEY);
    if (!raw) return DEFAULT_COURSE_LIBS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_COURSE_LIBS;
    const normalized = parsed
      .map((item) => normalizeCourseLib(item))
      .filter(Boolean) as CourseLibRow[];
    return normalized.length ? normalized : DEFAULT_COURSE_LIBS;
  } catch {
    return DEFAULT_COURSE_LIBS;
  }
}

export function saveCourseLibs(list: CourseLibRow[]) {
  localStorage.setItem(COURSE_LIB_STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(COURSE_LIBS_UPDATED_EVENT));
}

function normalizeCourseLib(input: unknown): CourseLibRow | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Partial<CourseLibRow> & { modules?: Partial<CourseModuleConfig> };
  if (!row.id || !row.name) return null;
  return {
    id: row.id,
    name: row.name,
    bizAttr: row.bizAttr || '体系课',
    modules: normalizeModules(row.modules),
    status: row.status === 'disabled' ? 'disabled' : 'enabled',
    createdAt: row.createdAt || nowStamp(),
    updatedAt: row.updatedAt || row.createdAt || nowStamp(),
  };
}

function normalizeModules(input?: Partial<CourseModuleConfig>): CourseModuleConfig {
  const base: CourseModuleConfig = { ...DEFAULT_MODULES };
  if (!input || typeof input !== 'object') return base;
  (Object.keys(base) as CourseModuleKey[]).forEach((k) => {
    if (typeof input[k] === 'boolean') base[k] = Boolean(input[k]);
  });
  REQUIRED_MODULES.forEach((k) => {
    base[k] = true;
  });
  return base;
}
