import { useState, useMemo, useCallback } from 'react'
import { catalogData, resourceData, questionData, langData, type CatalogNode } from './cms-data'
import {
  PageCatalog,
  PageResources,
  PageQuestions,
  PageMultilang,
  PageQtype,
  PageLogs,
  PageSettings,
} from './CMSPages'
import { Modals } from './CMSModals'

const PAGE_NAMES = ['catalog', 'resources', 'questions', 'multilang', 'qtype', 'logs', 'settings'] as const
type PageName = (typeof PAGE_NAMES)[number]

const PAGE_MAP: Record<PageName, [string, string]> = {
  catalog: ['内容管理', '目录管理'],
  resources: ['内容管理', '学习资源'],
  questions: ['内容管理', '题库管理'],
  multilang: ['内容管理', '多语言译文'],
  qtype: ['系统管理', '题型模板配置'],
  logs: ['系统管理', '操作日志'],
  settings: ['系统管理', '系统设置'],
}

type Role = 'admin' | 'editor'
type ModalId = 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null
type ToastType = 'success' | 'error' | 'info'

function CMSApp() {
  const [page, setPage] = useState<PageName>('catalog')
  const [role, setRole] = useState<Role>('admin')
  const [selectedNode, setSelectedNode] = useState<CatalogNode | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['N00000', 'N10000', 'N10100']))
  const [modal, setModal] = useState<ModalId>(null)
  const [toast, setToast] = useState<{ msg: string; type: ToastType; show: boolean }>({ msg: '', type: 'info', show: false })
  const [resFilter, setResFilter] = useState<{ dir: string; type: string; word: string; hsk: string }>({ dir: '', type: '', word: '', hsk: '' })
  const [selectedQType, setSelectedQType] = useState('T00')

  const showToast = useCallback((msg: string, type: ToastType = 'info') => {
    setToast({ msg, type, show: true })
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000)
  }, [])

  const openModal = useCallback((id: ModalId) => setModal(id), [])
  const closeModal = useCallback(() => setModal(null), [])

  const switchRole = useCallback(
    (r: Role) => {
      setRole(r)
      showToast(`已切换角色：${r === 'admin' ? '管理者' : '教研'}`, 'info')
    },
    [showToast]
  )

  const filteredResources = useMemo(() => {
    return resourceData.filter((r) => {
      if (resFilter.dir && r.dir !== resFilter.dir) return false
      if (resFilter.type && r.type !== resFilter.type) return false
      if (resFilter.word && r.word !== resFilter.word) return false
      if (resFilter.hsk && r.hsk !== resFilter.hsk) return false
      return true
    })
  }, [resFilter])

  const isAdmin = role === 'admin'
  const breadcrumb = PAGE_MAP[page]

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">汉</div>
            <div>
              <div className="logo-text">NSK Chinese</div>
              <div className="logo-sub">CMS Admin v1.0</div>
            </div>
          </div>
        </div>
        <div className="role-switcher">
          <span className="role-label">角色：</span>
          <select className="role-select" value={role} onChange={(e) => switchRole(e.target.value as Role)}>
            <option value="admin">管理者</option>
            <option value="editor">教研</option>
          </select>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">内容管理</div>
            <div className={`nav-item ${page === 'catalog' ? 'active' : ''}`} onClick={() => setPage('catalog')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M3 6h18M3 12h18M3 18h18" />
                <rect x="3" y="3" width="3" height="18" rx="1" fill="currentColor" stroke="none" opacity={0.3} />
              </svg>
              目录管理
            </div>
            <div className={`nav-item ${page === 'resources' ? 'active' : ''}`} onClick={() => setPage('resources')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M3 9h6M3 15h6" />
              </svg>
              学习资源
              <span className="nav-badge">77</span>
            </div>
            <div className={`nav-item ${page === 'questions' ? 'active' : ''}`} onClick={() => setPage('questions')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M9 12h6M9 16h6M7 8h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
              </svg>
              题库管理
              <span className="nav-badge">54</span>
            </div>
            <div className={`nav-item ${page === 'multilang' ? 'active' : ''}`} onClick={() => setPage('multilang')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
              </svg>
              多语言译文
              <span className="nav-badge">157</span>
            </div>
          </div>
          {isAdmin && (
            <div className="nav-section" id="admin-section">
              <div className="nav-label">系统管理</div>
              <div className={`nav-item ${page === 'qtype' ? 'active' : ''}`} onClick={() => setPage('qtype')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="2" y="2" width="9" height="9" rx="1.5" />
                  <rect x="13" y="2" width="9" height="9" rx="1.5" />
                  <rect x="2" y="13" width="9" height="9" rx="1.5" />
                  <path d="M17.5 13v9M13 17.5h9" />
                </svg>
                题型模板配置
              </div>
              <div className={`nav-item ${page === 'logs' ? 'active' : ''}`} onClick={() => setPage('logs')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </svg>
                操作日志
              </div>
              <div className={`nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                系统设置
              </div>
            </div>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar" id="user-avatar">
              {isAdmin ? '管' : '研'}
            </div>
            <div>
              <div className="user-name" id="user-name">
                {isAdmin ? '张晓明' : '李小红'}
              </div>
              <div className="user-role" id="user-role">{isAdmin ? '管理者' : '教研'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <div className="breadcrumb" id="breadcrumb">
            <span>NSK Chinese</span>
            <span className="breadcrumb-sep">›</span>
            <span>{breadcrumb[0]}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-curr">{breadcrumb[1]}</span>
          </div>
          <div className="header-right">
            <div className="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="搜索..." />
            </div>
          </div>
        </header>

        <div className="content">
          <PageCatalog
            page={page}
            catalogData={catalogData}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            expandedIds={expandedIds}
            setExpandedIds={setExpandedIds}
            isAdmin={isAdmin}
            showToast={showToast}
            openModal={openModal}
          />
          <PageResources
            page={page}
            filteredResources={filteredResources}
            resFilter={resFilter}
            setResFilter={setResFilter}
            showToast={showToast}
            openModal={openModal}
          />
          <PageQuestions page={page} questionData={questionData} showToast={showToast} openModal={openModal} />
          <PageMultilang page={page} langData={langData} showToast={showToast} openModal={openModal} />
          <PageQtype page={page} showToast={showToast} />
          <PageLogs page={page} showToast={showToast} />
          <PageSettings page={page} showToast={showToast} />
        </div>
      </div>

      {/* Modals */}
      <Modals
        modal={modal}
        closeModal={closeModal}
        showToast={showToast}
        openModal={openModal}
        selectedQType={selectedQType}
        setSelectedQType={setSelectedQType}
      />
      {/* Toast */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.type}`} id="toast">
        {toast.show && (toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '·')} {toast.msg}
      </div>
    </div>
  )
}

export default CMSApp
