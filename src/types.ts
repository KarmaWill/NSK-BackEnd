/* 概览 → NSK体系课程目录(目录管理/学习资源/题库管理/资源库) → AI 配置 → 内容运营 → 用户 & 运营 → 系统管理 */

export type PanelId =
  | 'dashboard'
  | 'course-config'
  | 'catalog'
  | 'resources'
  | 'audio-reading'
  | 'questions'
  | 'medialib'
  | 'multilang' /* 侧栏已去掉，翻译并入目录/学习资源/题库内 */
  | 'ai-roles'
  | 'ai-capabilities'
  | 'ai-free'
  | 'ai-scene'
  | 'ai-eval'
  | 'ai-api'
  | 'culture'
  | 'library'
  | 'hsk'
  | 'users'
  | 'premium'
  | 'notify'
  | 'qtype'
  | 'logs'
  | 'sysconfig'
  | 'vocab'; /* 保留，侧栏不展示 */

/** 当前页标题（用于面包屑「NSK Horizon OS › 当前页」） */
export const NAV_LABELS: Record<PanelId, string> = {
  dashboard: '数据仪表盘',
  'course-config': '课程库配置',
  catalog: '目录管理',
  resources: '学习资源',
  'audio-reading': '有声阅读配置',
  questions: '题库管理',
  medialib: '资源库',
  multilang: '多语言译文',
  'ai-roles': 'AI 角色配置',
  'ai-capabilities': '课程AI配置',
  'ai-free': '自由对话训练',
  'ai-scene': '场景训练管理',
  'ai-eval': '发音评测设置',
  'ai-api': 'API 集成配置',
  culture: '文化内容',
  library: '图书馆管理',
  hsk: 'HSK 考试配置',
  users: '用户管理',
  premium: 'Premium 管理',
  notify: '通知推送',
  qtype: '题型模板配置',
  logs: '操作日志',
  sysconfig: '系统设置',
  vocab: '词汇/语法库',
};
