import { useEffect, useState } from 'react';
import type { PanelId } from '../types';
import { COURSE_LIBS_UPDATED_EVENT, loadCourseLibs, type CourseLibRow } from '../stores/courseLibs';

type Props = {
  activePanel: PanelId;
  onNavigate: (id: PanelId) => void;
  activeCourseLibId: string;
  onActiveCourseLibChange: (id: string) => void;
};

const ICONS: Record<string, JSX.Element> = {
  dashboard: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  catalog: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 6h18M3 12h18M3 18h18"/><rect x="3" y="3" width="3" height="18" rx="1" fill="currentColor" stroke="none" opacity={0.3}/></svg>),
  resources: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>),
  'audio-reading': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>),
  questions: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 12h6M9 16h6M7 8h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>),
  multilang: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>),
  medialib: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><polygon points="10 12 15 15 15 9 10 12"/></svg>),
  'ai-roles': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  'ai-capabilities': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l2.2 4.6 5 .7-3.6 3.5.9 4.9L12 13.8 7.5 15.7l.9-4.9L4.8 7.3l5-.7L12 2z"/><path d="M4 21h16"/></svg>),
  'ai-free': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>),
  'ai-scene': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>),
  'ai-eval': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2a3 3 0 003 3V5a3 3 0 01-6 0V5a3 3 0 013-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>),
  'ai-api': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>),
  culture: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>),
  library: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>),
  hsk: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  users: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  premium: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  notify: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>),
  qtype: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><path d="M17.5 13v9M13 17.5h9"/></svg>),
  logs: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>),
  sysconfig: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
};

export function Sidebar({ activePanel, onNavigate, activeCourseLibId, onActiveCourseLibChange }: Props) {
  const [role, setRole] = useState<'admin' | 'editor'>('admin');
  const [courseLibs, setCourseLibs] = useState<CourseLibRow[]>(() => loadCourseLibs());
  const isAdmin = role === 'admin';
  useEffect(() => {
    const sync = () => {
      const latest = loadCourseLibs();
      setCourseLibs(latest);
      if (latest.length && !latest.some((row) => row.id === activeCourseLibId)) {
        onActiveCourseLibChange(latest[0].id);
      }
    };
    window.addEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [activeCourseLibId, onActiveCourseLibChange]);

  const nav = (id: PanelId, label: string, badge?: { text: string; className?: string }, extraClass?: string) => (
    <div
      key={id}
      className={`nav-item ${activePanel === id ? 'active' : ''} ${extraClass ?? ''}`}
      onClick={() => onNavigate(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(id)}
    >
      {ICONS[id] ?? ICONS['dashboard']}
      {label}
      {badge && <span className={`nav-badge ${badge.className ?? ''}`}>{badge.text}</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">汉</div>
          <div>
            <div className="logo-text">NSK C-LingoAIOS</div>
            <div className="logo-sub">UNIFIED ADMIN v1.0</div>
          </div>
        </div>
      </div>

      <div className="role-switcher">
        <span className="role-label">角色：</span>
        <select
          className="role-select"
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
        >
          <option value="admin">管理员</option>
          <option value="editor">课研</option>
        </select>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">概览</div>
          {nav('dashboard', '数据仪表盘')}
          {nav('course-config', '课程库配置')}
        </div>

        <div className="nav-section">
          <div className="nav-label nav-label-row">
            <span>课程库</span>
          </div>
          <div className="course-lib-list course-tree">
            {courseLibs.map((lib) => (
              <div key={lib.id} className="course-tree-node">
                <div
                  className={`course-lib-item ${activeCourseLibId === lib.id ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onActiveCourseLibChange(lib.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onActiveCourseLibChange(lib.id)}
                >
                  <span className="course-lib-dot">{activeCourseLibId === lib.id ? '▼' : '▶'}</span>
                  <span className="course-lib-name">{lib.name}</span>
                </div>
                {activeCourseLibId === lib.id && (
                  <div className="course-lib-children">
                    {lib.modules.catalog && nav('catalog', '目录管理', undefined, 'course-child-item')}
                    {lib.modules.resources && nav('resources', '学习资源', { text: '77' }, 'course-child-item')}
                    {lib.modules['audio-reading'] && nav('audio-reading', '有声阅读配置', undefined, 'course-child-item')}
                    {lib.modules.questions && nav('questions', '题库管理', { text: '54' }, 'course-child-item')}
                    {lib.modules.medialib && nav('medialib', '资源库', undefined, 'course-child-item')}
                    {lib.modules['ai-capabilities'] && nav('ai-capabilities', '课程AI配置', undefined, 'course-child-item')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-label">AI 配置</div>
          {nav('ai-roles', 'AI 角色配置')}
          {nav('ai-free', '自由对话训练')}
          {nav('ai-scene', '场景训练管理')}
        </div>

        <div className="nav-section">
          <div className="nav-label">内容运营</div>
          {nav('culture', '文化内容')}
          {nav('library', '图书馆管理')}
          {nav('hsk', 'HSK 考试配置')}
        </div>

        <div className="nav-section">
          <div className="nav-label">用户 & 运营</div>
          {nav('users', '用户管理', { text: '2.4k', className: 'ok' })}
          {nav('premium', 'Premium 管理')}
          {nav('notify', '通知推送', { text: '3', className: 'warn' })}
        </div>

        {isAdmin && (
          <div className="nav-section" id="admin-section">
            <div className="nav-label">系统管理</div>
            {nav('qtype', '题型模板配置')}
            {nav('logs', '操作日志')}
            {nav('sysconfig', '系统设置')}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar" id="user-avatar">Adm</div>
          <div>
            <div className="user-name" id="user-name">群哥</div>
            <div className="user-role" id="user-role">管理员</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
