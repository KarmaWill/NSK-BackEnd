import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PanelId } from '../types';
import { COURSE_LIBS_UPDATED_EVENT, loadCourseLibs, type CourseLibRow } from '../stores/courseLibs';
import {
  getActiveProduct,
  setActiveProduct,
  PRODUCT_OPTIONS,
  type ProductCode,
} from '../lib/api';
import { ADMIN_PROFILE_UPDATED_EVENT, loadAdminProfile } from '../stores/adminProfile';
import {
  getDefaultExpandedGroupIds,
  getItemLabel,
  getNavBlocks,
  TABLET_HSK_GROUP,
  type NavGroupNode,
  type NavItemNode,
} from '../config/navTree';
import { FoxAvatar } from './FoxAvatar';
import { AdminProfileModal } from './AdminProfileModal';

type Props = {
  activePanel: PanelId;
  onNavigate: (id: PanelId) => void;
  activeCourseLibId: string;
  onActiveCourseLibChange: (id: string) => void;
  username: string;
};

function TreeExpandChevron({
  expanded,
  label,
  onToggle,
}: {
  expanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`tree-expand-chevron${expanded ? ' is-expanded' : ''}`}
      aria-expanded={expanded}
      aria-label={expanded ? `收起${label}` : `展开${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    />
  );
}

const ICONS: Record<string, JSX.Element> = {
  dashboard: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>),
  catalog: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 6h18M3 12h18M3 18h18"/><rect x="3" y="3" width="3" height="18" rx="1" fill="currentColor" stroke="none" opacity={0.3}/></svg>),
  resources: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6"/></svg>),
  'audio-reading': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>),
  'audio-reading-mgmt': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>),
  questions: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M9 12h6M9 16h6M7 8h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>),
  medialib: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/><polygon points="10 12 15 15 15 9 10 12"/></svg>),
  'ai-roles': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  'ai-capabilities': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l2.2 4.6 5 .7-3.6 3.5.9 4.9L12 13.8 7.5 15.7l.9-4.9L4.8 7.3l5-.7L12 2z"/><path d="M4 21h16"/></svg>),
  'ai-free': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>),
  'ai-scene': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>),
  culture: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>),
  'video-add': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>),
  'video-types': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>),
  library: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>),
  hsk: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  users: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>),
  premium: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  notify: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>),
  feedback: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M9 10h6M9 14h3"/></svg>),
  database: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>),
  qtype: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="2" width="9" height="9" rx="1.5"/><rect x="13" y="2" width="9" height="9" rx="1.5"/><rect x="2" y="13" width="9" height="9" rx="1.5"/><path d="M17.5 13v9M13 17.5h9"/></svg>),
  logs: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>),
  sysconfig: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>),
  'course-config': (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>),
  'course-lib': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l1.2 3.6H17l-3 2.2 1.1 3.5L12 9.8 8.9 11.3l1.1-3.5-3-2.2h3.8L12 2z" />
      <path d="M19 14l.8 2.4h2.5l-2 1.5.8 2.4-2.1-1.6-2.1 1.6.8-2.4-2-1.5h2.5L19 14z" />
    </svg>
  ),
};

export function Sidebar({ activePanel, onNavigate, activeCourseLibId, onActiveCourseLibChange, username }: Props) {
  const [role, setRole] = useState<'admin' | 'editor'>('admin');
  const [product, setProduct] = useState<ProductCode>(() => getActiveProduct());
  const [profile, setProfile] = useState(() => loadAdminProfile());
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [courseLibs, setCourseLibs] = useState<CourseLibRow[]>(() => loadCourseLibs());
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    getDefaultExpandedGroupIds(getActiveProduct()),
  );
  const [expandedCourseLibs, setExpandedCourseLibs] = useState<Record<string, boolean>>(() =>
    activeCourseLibId ? { [activeCourseLibId]: true } : {},
  );
  const roleLabel = role === 'admin' ? '管理员' : '课研';

  const navBlocks = useMemo(() => getNavBlocks(product, role), [product, role]);

  useEffect(() => {
    const onProduct = () => {
      const code = getActiveProduct();
      setProduct(code);
      setExpandedGroups(getDefaultExpandedGroupIds(code));
    };
    window.addEventListener('clingo-product-changed', onProduct);
    return () => window.removeEventListener('clingo-product-changed', onProduct);
  }, []);

  useEffect(() => {
    const syncProfile = () => setProfile(loadAdminProfile());
    window.addEventListener(ADMIN_PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener('storage', syncProfile);
    return () => {
      window.removeEventListener(ADMIN_PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener('storage', syncProfile);
    };
  }, []);

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

  useEffect(() => {
    if (!activeCourseLibId) return;
    setExpandedCourseLibs((prev) => ({ ...prev, [activeCourseLibId]: true }));
  }, [activeCourseLibId]);

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !(prev[groupId] ?? false) }));
  };

  const toggleCourseLibExpanded = (libId: string) => {
    setExpandedCourseLibs((prev) => ({ ...prev, [libId]: !(prev[libId] ?? false) }));
  };

  const selectCourseLib = (libId: string) => {
    onActiveCourseLibChange(libId);
    setExpandedCourseLibs((prev) => ({ ...prev, [libId]: true }));
  };

  const handleCourseLibRowClick = (libId: string) => {
    const expanded = expandedCourseLibs[libId] ?? false;
    if (expanded) {
      toggleCourseLibExpanded(libId);
    } else {
      selectCourseLib(libId);
    }
  };

  const handleGroupRowClick = (group: NavGroupNode) => {
    const expanded = expandedGroups[group.id] ?? group.defaultExpanded ?? false;
    const firstPanel = group.children.find((child): child is NavItemNode => child.type === 'item')?.panel;
    if (expanded) {
      toggleGroupExpanded(group.id);
    } else {
      setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      if (firstPanel) onNavigate(firstPanel);
    }
  };

  const nav = useCallback(
    (node: NavItemNode) => {
      const id = node.panel;
      const label = getItemLabel(node);
      return (
        <div
          key={id}
          className={`nav-item ${activePanel === id ? 'active' : ''} ${node.childClass ?? ''}`}
          onClick={() => onNavigate(id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onNavigate(id)}
        >
          {ICONS[id] ?? ICONS.hsk}
          {label}
          {node.badge && <span className={`nav-badge ${node.badge.className ?? ''}`}>{node.badge.text}</span>}
        </div>
      );
    },
    [activePanel, onNavigate],
  );

  const renderGroup = (group: NavGroupNode) => {
    const expanded = expandedGroups[group.id] ?? group.defaultExpanded ?? false;
    const isActive = group.activePanels.includes(activePanel);
    const iconKey = group.iconPanel ?? 'hsk';
    return (
      <div key={group.id} className="course-tree">
        <div className="course-tree-node">
          <div
            className={`nav-item tree-row ${isActive ? 'active' : ''}`}
            role="button"
            tabIndex={0}
            aria-expanded={expanded}
            onClick={() => handleGroupRowClick(group)}
            onKeyDown={(e) => e.key === 'Enter' && handleGroupRowClick(group)}
          >
            {ICONS[iconKey]}
            <span className="tree-row-label">{group.label}</span>
            <TreeExpandChevron
              expanded={expanded}
              label={group.label}
              onToggle={() => toggleGroupExpanded(group.id)}
            />
          </div>
          {expanded && <div className="course-lib-children">{group.children.map(nav)}</div>}
        </div>
      </div>
    );
  };

  const renderCourseLibs = () => (
    <div className="nav-section" key="tablet-course-libs">
      <div className="nav-label nav-label-row">
        <span>课程库</span>
      </div>
      {nav({ type: 'item', panel: 'course-config' })}
      <div className="course-lib-list course-tree">
        {courseLibs.map((lib) => {
          const isActive = activeCourseLibId === lib.id;
          const expanded = expandedCourseLibs[lib.id] ?? false;
          return (
          <div key={lib.id} className="course-tree-node">
            <div
              className={`course-lib-item tree-row ${isActive ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              onClick={() => handleCourseLibRowClick(lib.id)}
              onKeyDown={(e) => e.key === 'Enter' && handleCourseLibRowClick(lib.id)}
            >
              {ICONS['course-lib']}
              <span className="course-lib-name tree-row-label">{lib.name}</span>
              <TreeExpandChevron
                expanded={expanded}
                label={lib.name}
                onToggle={() => toggleCourseLibExpanded(lib.id)}
              />
            </div>
            {expanded && (
              <div className="course-lib-children">
                {lib.modules.catalog && nav({ type: 'item', panel: 'catalog', childClass: 'course-child-item' })}
                {lib.modules.resources && nav({ type: 'item', panel: 'resources', badge: { text: '77' }, childClass: 'course-child-item' })}
                {lib.modules['audio-reading'] && nav({ type: 'item', panel: 'audio-reading', childClass: 'course-child-item' })}
                {lib.modules.questions && nav({ type: 'item', panel: 'questions', badge: { text: '54' }, childClass: 'course-child-item' })}
                {lib.modules['ai-capabilities'] && nav({ type: 'item', panel: 'ai-capabilities', childClass: 'course-child-item' })}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );

  const renderTabletProfessionalExtras = () => renderGroup(TABLET_HSK_GROUP);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/sidebar-logo.png" alt="C-Lingo AIOS" className="sidebar-logo-img" />
      </div>

      <div className="product-switcher">
        <div className="product-switcher-label">产品渠道</div>
        <select
          className="product-select"
          value={product}
          title="当前配置的产品渠道"
          onChange={(e) => {
            const code = e.target.value as ProductCode;
            setProduct(code);
            setActiveProduct(code);
          }}
        >
          {PRODUCT_OPTIONS.map((p) => (
            <option key={p.code} value={p.code} title={p.label}>
              {p.shortLabel}
            </option>
          ))}
        </select>
      </div>

      <div className="role-switcher">
        <span className="role-label">角色：</span>
        <select className="role-select" value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}>
          <option value="admin">管理员</option>
          <option value="editor">课研</option>
        </select>
      </div>

      <nav className="sidebar-nav">
        {navBlocks.map((block) => {
          if (block.type === 'tablet-course-libs') {
            return renderCourseLibs();
          }
          const showTabletHsk =
            product === 'tablet_app' && block.type === 'section' && block.label === '专业内容管理';
          return (
            <div key={block.label} className="nav-section" id={block.label === '系统管理' ? 'admin-section' : undefined}>
              <div className="nav-label">{block.label}</div>
              {block.children.map((child) =>
                child.type === 'group' ? renderGroup(child) : nav(child),
              )}
              {showTabletHsk && renderTabletProfessionalExtras()}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          className="user-card"
          role="button"
          tabIndex={0}
          title="管理员账号与头像设置"
          onClick={() => setProfileModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setProfileModalOpen(true);
            }
          }}
        >
          <div className="user-avatar" id="user-avatar">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="user-avatar-img" />
            ) : (
              <FoxAvatar size={40} />
            )}
          </div>
          <div className="user-card-text">
            <div className="user-name" id="user-name">{profile.displayName}</div>
            <div className="user-role" id="user-role">{roleLabel}</div>
          </div>
        </div>
      </div>

      <AdminProfileModal
        open={profileModalOpen}
        username={username}
        roleLabel={roleLabel}
        onClose={() => setProfileModalOpen(false)}
      />
    </aside>
  );
}
