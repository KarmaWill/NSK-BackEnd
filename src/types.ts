/* 概览 → NSK体系课程目录(目录管理/学习资源/题库管理/资源库) → AI 配置 → 专业内容管理 → 用户 & 运营 → 系统管理 */

export type PanelId =
  | 'dashboard'
  | 'course-config'
  | 'medialib'
  | 'database'
  | 'catalog'
  | 'resources'
  | 'audio-reading'
  | 'audio-reading-mgmt'
  | 'questions'
  | 'ai-roles'
  | 'ai-capabilities'
  | 'ai-free'
  | 'ai-scene'
  | 'ai-eval'
  | 'ai-api'
  | 'culture'
  | 'library'
  | 'hsk'
  | 'hsk-question-bank'
  | 'hsk-paper'
  | 'hsk-exam'
  | 'users'
  | 'feedback'
  | 'premium'
  | 'notify'
  | 'qtype'
  | 'logs'
  | 'sysconfig'
  | 'vocab'; /* 保留，侧栏不展示 */

/** 当前页标题（用于面包屑「C-Lingo AIOS › 当前页」） */
export const NAV_LABELS: Record<PanelId, string> = {
  dashboard: '数据仪表盘',
  'course-config': '课程库配置',
  medialib: '资源库',
  database: '数据库管理',
  catalog: '目录管理',
  resources: '学习资源',
  'audio-reading': '有声阅读配置',
  'audio-reading-mgmt': '有声阅读管理',
  questions: '题库管理',
  'ai-roles': 'AI 角色配置',
  'ai-capabilities': '课程AI配置',
  'ai-free': '自由对话训练',
  'ai-scene': '场景训练管理',
  'ai-eval': '发音评测设置',
  'ai-api': 'API 集成配置',
  culture: '文化视频管理',
  library: '书籍教材管理',
  hsk: 'HSK考试管理',
  'hsk-question-bank': '题库管理',
  'hsk-paper': '试卷管理',
  'hsk-exam': '考试管理',
  users: '用户管理',
  feedback: '用户反馈池',
  premium: 'Premium 管理',
  notify: '通知推送',
  qtype: '题型模板配置',
  logs: '操作日志',
  sysconfig: '系统设置',
  vocab: '词汇/语法库',
};
