import React from 'react'
import type { CatalogNode, ResourceRow, QuestionRow, LangRow } from './cms-data'

const PAGE_NAMES = ['catalog', 'resources', 'questions', 'multilang', 'qtype', 'logs', 'settings'] as const
type PageName = (typeof PAGE_NAMES)[number]

// ─── Tree ─────────────────────────────────────────────────────────────────
export function CatalogTree({
  nodes,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
}: {
  nodes: CatalogNode[]
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (node: CatalogNode) => void
}) {
  return (
    <>
      {nodes.map((node) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedIds.has(node.id)
        const isLeaf = node.leaf === 1
        const isSelected = selectedId === node.id
        const paddingLeft = 12 + depth * 16
        return (
          <div className="tree-node" key={node.id}>
            <div
              className={`tree-node-row ${isSelected ? 'selected' : ''}`}
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={() => onSelect(node)}
            >
              <span
                className={`tree-toggle ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (hasChildren) onToggle(node.id)
                }}
              >
                {hasChildren ? '▶' : ''}
              </span>
              {isLeaf && <span className="tree-dot" />}
              <span className="tree-label">
                {node.name}
                {node.cn && <span className="cn">{node.cn}</span>}
                {node.en && <span className="en">{node.en}</span>}
              </span>
              {isLeaf && (node.res != null || node.q != null) && (
                <span className="tree-count">
                  {node.res ?? 0}资 {node.q ?? 0}题
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="tree-children">
                <CatalogTree
                  nodes={node.children!}
                  depth={depth + 1}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onSelect={onSelect}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ─── Page: Catalog ─────────────────────────────────────────────────────────
export function PageCatalog({
  page,
  catalogData,
  selectedNode,
  setSelectedNode,
  expandedIds,
  setExpandedIds,
  isAdmin,
  showToast,
  openModal,
}: {
  page: PageName
  catalogData: CatalogNode[]
  selectedNode: CatalogNode | null
  setSelectedNode: (n: CatalogNode | null) => void
  expandedIds: Set<string>
  setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  isAdmin: boolean
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  openModal: (id: 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null) => void
}) {
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const expandAll = () => {
    const all: string[] = []
    const collect = (nodes: CatalogNode[]) => {
      nodes.forEach((n) => {
        all.push(n.id)
        if (n.children?.length) collect(n.children)
      })
    }
    collect(catalogData)
    setExpandedIds(new Set(all))
    showToast('已展开全部节点', 'info')
  }
  const detailNode = selectedNode || (catalogData[0]?.children?.[0]?.children?.[0] as CatalogNode | undefined)
  if (page !== 'catalog') return null
  return (
    <div className={`page ${page === 'catalog' ? 'active' : ''}`} id="page-catalog">
      <div className="page-header">
        <div>
          <div className="page-title">目录管理</div>
          <div className="page-subtitle">NSK Chinese A1 · 1个Level · 6个Unit · 18个Lesson</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => showToast('导出 Excel 功能开发中', 'info')}>
            导出
          </button>
          <button className="btn btn-primary" onClick={() => openModal('modal-add-node')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新增节点
          </button>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M3 5h18M3 10h18M3 15h18M3 20h18" />
            </svg>
          </div>
          <div>
            <div className="stat-val">1</div>
            <div className="stat-label">Level 数量</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <div className="stat-val">6</div>
            <div className="stat-label">Unit 数量</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8" />
            </svg>
          </div>
          <div>
            <div className="stat-val">18</div>
            <div className="stat-label">Lesson 数量</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h6M3 15h6" />
            </svg>
          </div>
          <div>
            <div className="stat-val">77</div>
            <div className="stat-label">关联资源</div>
          </div>
        </div>
      </div>
      <div className="tree-container">
        <div className="tree-panel">
          <div className="tree-header">
            目录树
            <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={expandAll}>
              展开全部
            </button>
          </div>
          <div className="tree-body" id="catalog-tree">
            <CatalogTree
              nodes={catalogData}
              depth={0}
              selectedId={detailNode?.id ?? null}
              expandedIds={expandedIds}
              onToggle={toggleExpand}
              onSelect={setSelectedNode}
            />
          </div>
        </div>
        <div className="detail-panel">
          <div className="detail-header">
            <div>
              <div className="detail-title" id="detail-title">
                {detailNode ? `${detailNode.name} · ${detailNode.cn || ''}` : '—'}
              </div>
              <div className="detail-id" id="detail-id">
                NameId: {detailNode?.id ?? '—'} &nbsp;·&nbsp; Leaf: {detailNode?.leaf ?? 0}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => showToast('已保存草稿', 'success')}>
                保存
              </button>
              {isAdmin && (
                <button className="btn btn-primary" id="publish-btn" onClick={() => showToast('已发布', 'success')}>
                  发布
                </button>
              )}
            </div>
          </div>
          <div className="detail-body">
            <div className="form-row" style={{ marginBottom: 4 }}>
              <div className="form-group">
                <label className="form-label">NameId *</label>
                <input className="form-input" defaultValue={detailNode?.id ?? 'N10100'} style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
              </div>
              <div className="form-group">
                <label className="form-label">ParentId</label>
                <input className="form-input" defaultValue="N10000" style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">NameCn</label>
                <input className="form-input" defaultValue={detailNode?.name ?? '第一单元'} />
              </div>
              <div className="form-group">
                <label className="form-label">ChineseName</label>
                <input className="form-input" defaultValue={detailNode?.cn ?? '日常主食'} style={{ fontFamily: 'Noto Serif SC' }} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">EnglishName</label>
                <input className="form-input" defaultValue={detailNode?.en ?? 'Main Foods'} />
              </div>
              <div className="form-group">
                <label className="form-label">Leaf</label>
                <select className="form-input form-select" defaultValue={detailNode?.leaf ?? 0}>
                  <option value={0}>0 — 容器节点（Level / Unit）</option>
                  <option value={1}>1 — 叶节点（Lesson，末端，挂载资源与题目）</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">ChineseTarget</label>
              <textarea className="form-input" rows={2} defaultValue="说出米饭、饺子等中式主食" />
            </div>
            <div className="form-group">
              <label className="form-label">EnglishTarget</label>
              <textarea className="form-input" rows={2} defaultValue="Name Chinese foods like rice and dumplings" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Cover 封面图</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, background: 'var(--stone)', borderRadius: 8, border: '1px solid var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    🍱
                  </div>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => showToast('图片上传功能开发中', 'info')}>
                    更换
                  </button>
                </div>
                <div className="form-hint">FM-Unit1.png</div>
              </div>
              <div className="form-group">
                <label className="form-label">EnglishNameLanguageID</label>
                <input className="form-input" defaultValue="L000003" style={{ fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
              </div>
            </div>
            <div className="section-title">关联内容</div>
            <div>
              <span className="resource-chip" onClick={() => showToast('筛选: N10100', 'info')}>
                📄 学习资源 · 4条
              </span>
              <span className="resource-chip" onClick={() => showToast('筛选: N10100', 'info')}>
                ❓ 题目 · 21道
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page: Resources ───────────────────────────────────────────────────────
export function PageResources({
  page,
  filteredResources,
  resFilter,
  setResFilter,
  showToast,
  openModal,
}: {
  page: PageName
  filteredResources: ResourceRow[]
  resFilter: { dir: string; type: string; word: string; hsk: string }
  setResFilter: React.Dispatch<React.SetStateAction<{ dir: string; type: string; word: string; hsk: string }>>
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  openModal: (id: 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null) => void
}) {
  const setTag = (group: 'type' | 'word', val: string) => {
    setResFilter((prev) => ({ ...prev, [group]: val }))
  }
  if (page !== 'resources') return null
  return (
    <div className={`page ${page === 'resources' ? 'active' : ''}`} id="page-resources">
      <div className="page-header">
        <div>
          <div className="page-title">学习资源管理</div>
          <div className="page-subtitle">共 77 条资源 · 包含有声阅读与学习卡片</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => showToast('批量导入 Excel 中...', 'info')}>
            批量导入
          </button>
          <button className="btn btn-primary" onClick={() => openModal('modal-add-resource')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新增资源
          </button>
        </div>
      </div>
      <div className="filter-bar">
        <select
          className="filter-select"
          value={resFilter.dir}
          onChange={(e) => setResFilter((p) => ({ ...p, dir: e.target.value }))}
        >
          <option value="">全部目录</option>
          <option value="N10100">N10100 · 日常主食</option>
          <option value="N10101">N10101 · 米饭</option>
          <option value="N10102">N10102 · 饺子</option>
          <option value="N10200">N10200 · 日常饮品</option>
          <option value="N10201">N10201 · 水</option>
        </select>
        <span className={`filter-tag ${resFilter.type === '' ? 'active' : ''}`} onClick={() => setTag('type', '')}>
          全部
        </span>
        <span className={`filter-tag ${resFilter.type === '有声阅读' ? 'active' : ''}`} onClick={() => setTag('type', '有声阅读')}>
          有声阅读
        </span>
        <span className={`filter-tag ${resFilter.type === '学习卡片' ? 'active' : ''}`} onClick={() => setTag('type', '学习卡片')}>
          学习卡片
        </span>
        <span className="filter-sep" />
        <span className={`filter-tag ${resFilter.word === '' ? 'active' : ''}`} onClick={() => setTag('word', '')}>
          全部词性
        </span>
        <span className={`filter-tag ${resFilter.word === '字' ? 'active' : ''}`} onClick={() => setTag('word', '字')}>
          字
        </span>
        <span className={`filter-tag ${resFilter.word === '词' ? 'active' : ''}`} onClick={() => setTag('word', '词')}>
          词
        </span>
        <span className={`filter-tag ${resFilter.word === '句' ? 'active' : ''}`} onClick={() => setTag('word', '句')}>
          句
        </span>
        <span className="filter-sep" />
        <select
          className="filter-select"
          value={resFilter.hsk}
          onChange={(e) => setResFilter((p) => ({ ...p, hsk: e.target.value }))}
        >
          <option value="">全部 HSK</option>
          <option value="0">0（未收录）</option>
          <option value="HSK 1">HSK 1</option>
          <option value="HSK 4">HSK 4</option>
        </select>
        <span style={{ fontSize: 12, color: 'var(--ink-light)' }}>{filteredResources.length ? `显示 ${filteredResources.length} 条` : '— 无结果'}</span>
      </div>
      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">{filteredResources.length ? `显示 ${filteredResources.length} 条，共 77 条` : '暂无匹配数据'}</span>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => showToast('已导出 Excel', 'success')}>
            导出
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>目录ID</th>
              <th>资源类别</th>
              <th>资源ID</th>
              <th>词条属性</th>
              <th>原文</th>
              <th>拼音</th>
              <th>译文</th>
              <th>声音编号</th>
              <th>图片</th>
              <th>词性</th>
              <th>HSK</th>
              <th>多语言ID</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.length === 0 ? (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: 40, color: 'var(--ink-light)', fontSize: 13 }}>
                  暂无匹配数据
                </td>
              </tr>
            ) : (
              filteredResources.map((r) => (
                <tr key={r.id + r.dir}>
                  <td className="td-mono">{r.dir}</td>
                  <td>
                    <span className="badge badge-type">{r.type}</span>
                  </td>
                  <td className="td-mono">{r.id}</td>
                  <td>
                    {r.word ? (
                      <span className={`badge ${r.word === '字' ? 'badge-zi' : r.word === '词' ? 'badge-ci' : 'badge-ju'}`}>{r.word}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="td-cn" style={{ fontSize: r.cn.length <= 2 ? 18 : 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.cn}>
                    {r.cn}
                  </td>
                  <td style={{ fontSize: '11.5px', color: 'var(--ink-light)', fontStyle: 'italic' }}>{r.py}</td>
                  <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }} title={r.en}>
                    {r.en}
                  </td>
                  <td className="td-mono" style={{ fontSize: '10.5px' }}>{r.audio}</td>
                  <td className="td-mono" style={{ fontSize: '10.5px' }}>{r.img || '—'}</td>
                  <td style={{ fontSize: '11.5px' }}>{r.pos || '—'}</td>
                  <td>{r.hsk ? <span className="badge" style={{ background: '#f2f5f8', color: '#63758a', fontSize: 10 }}>{r.hsk}</span> : '—'}</td>
                  <td className="td-mono" style={{ fontSize: '10.5px' }}>{r.lang}</td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => openModal('modal-add-resource')}>
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页，共 8 页</span>
          <div className="page-btn">‹</div>
          <div className="page-btn active">1</div>
          <div className="page-btn">2</div>
          <div className="page-btn">…</div>
          <div className="page-btn">8</div>
          <div className="page-btn">›</div>
        </div>
      </div>
    </div>
  )
}

const statusMap: Record<string, string> = { published: '已发布', draft: '草稿', review: '待审核' }
export function PageQuestions({
  page,
  questionData,
  showToast,
  openModal,
}: {
  page: PageName
  questionData: QuestionRow[]
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  openModal: (id: 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null) => void
}) {
  if (page !== 'questions') return null
  return (
    <div className={`page ${page === 'questions' ? 'active' : ''}`} id="page-questions">
      <div className="page-header">
        <div>
          <div className="page-title">题库管理</div>
          <div className="page-subtitle">共 54 道题目（题组）· 含 T00–T05 六种题型</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal('modal-add-question')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            新增题目
          </button>
        </div>
      </div>
      <div className="filter-bar">
        <select className="filter-select"><option>全部目录</option><option>N10101 · 米饭</option><option>N10102 · 饺子</option></select>
        <select className="filter-select"><option>全部题型</option><option>T00 听音选图</option><option>T01 汉字填空</option></select>
        <span className="filter-tag active">全部难度</span>
        <span className="filter-tag">★ 一星</span>
        <span className="filter-tag">★★ 二星</span>
        <span className="filter-sep" />
        <span className="filter-tag">全部状态</span>
        <span className="filter-tag">草稿</span>
        <span className="filter-tag">待审核</span>
        <span className="filter-tag">已发布</span>
      </div>
      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 54 道题目</span>
          <span style={{ flex: 1 }} />
        </div>
        <table>
          <thead>
            <tr>
              <th>序号</th><th>目录ID</th><th>题型</th><th>题型编码</th><th>资源ID</th><th>难度</th><th>知识点</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {questionData.map((q, i) => (
              <tr key={q.res + i}>
                <td className="td-mono" style={{ fontSize: 11 }}>{String(i + 1).padStart(3, '0')}</td>
                <td className="td-mono">{q.dir}</td>
                <td style={{ fontWeight: 500, fontSize: 13 }}>{q.type}</td>
                <td className="td-mono" style={{ fontSize: '10.5px', color: 'var(--ink-light)' }}>{q.code}</td>
                <td className="td-mono">{q.res}</td>
                <td style={{ color: '#78716c' }}>{q.diff}</td>
                <td className="td-cn">{q.kp}</td>
                <td><span className={`status-dot ${q.status}`}>{statusMap[q.status]}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => openModal('modal-preview-q')}>配置</button>
                    <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => openModal('modal-add-question')}>编辑</button>
                    {q.status === 'draft' && <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px', color: '#5c7a68' }} onClick={() => showToast('已提交审核', 'success')}>提交</button>}
                    {q.status === 'review' && <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px', color: '#5c7a68' }} onClick={() => showToast('审核通过，已发布', 'success')}>审核通过</button>}
                    {q.status === 'published' && <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => showToast('已撤回至草稿', 'info')}>撤回</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页，共 6 页</span>
          <div className="page-btn">‹</div>
          <div className="page-btn active">1</div>
          <div className="page-btn">›</div>
        </div>
      </div>
    </div>
  )
}

export function PageMultilang({
  page,
  langData,
  showToast,
  openModal,
}: {
  page: PageName
  langData: LangRow[]
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  openModal: (id: 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null) => void
}) {
  if (page !== 'multilang') return null
  return (
    <div className={`page ${page === 'multilang' ? 'active' : ''}`} id="page-multilang">
      <div className="page-header">
        <div>
          <div className="page-title">多语言译文管理</div>
          <div className="page-subtitle">共 157 条 · 支持泰语、越南语、韩语、日语</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => showToast('批量导入 Excel...', 'info')}>批量导入</button>
          <button className="btn btn-primary" onClick={() => openModal('modal-add-lang')}>+ 新增条目</button>
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-bar" style={{ width: 280 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="text" placeholder="搜索 ID 或文本..." />
        </div>
        <span className="filter-tag active">全部</span>
        <span className="filter-tag">🇹🇭 泰语</span>
        <span className="filter-tag">🇻🇳 越南语</span>
        <span className="filter-tag">🇰🇷 韩语</span>
        <span className="filter-tag">🇯🇵 日语</span>
        <span className="filter-tag" onClick={() => showToast('已过滤：仅显示缺少翻译的条目', 'info')}>⚠ 待翻译</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>中文原文</th>
              <th><span className="lang-badge lang-th">TH</span>泰语</th>
              <th><span className="lang-badge lang-vi">VI</span>越南语</th>
              <th><span className="lang-badge lang-ko">KO</span>韩语</th>
              <th><span className="lang-badge lang-ja">JA</span>日语</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {langData.map((l) => (
              <tr key={l.id}>
                <td className="td-mono">{l.id}</td>
                <td style={{ fontFamily: 'Noto Serif SC', fontSize: 13 }}>{l.cn}</td>
                <td>{l.th ? <span style={{ fontSize: 12 }}>{l.th}</span> : <span style={{ fontSize: 11, color: '#9c6065' }}>⚠ 待翻译</span>}</td>
                <td>{l.vi ? <span style={{ fontSize: 12 }}>{l.vi}</span> : <span style={{ fontSize: 11, color: '#9c6065' }}>⚠ 待翻译</span>}</td>
                <td>{l.ko ? <span style={{ fontSize: 12 }}>{l.ko}</span> : <span style={{ fontSize: 11, color: '#9c6065' }}>⚠ 待翻译</span>}</td>
                <td>{l.ja ? <span style={{ fontSize: 12 }}>{l.ja}</span> : <span style={{ fontSize: 11, color: '#9c6065' }}>⚠ 待翻译</span>}</td>
                <td><button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => openModal('modal-add-lang')}>编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页，共 16 页</span>
          <div className="page-btn">‹</div>
          <div className="page-btn active">1</div>
          <div className="page-btn">›</div>
        </div>
      </div>
    </div>
  )
}

export function PageQtype({ page, showToast }: { page: PageName; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  if (page !== 'qtype') return null
  const cards = [
    { code: 'T00', name: '听音选图', sub: 'LISTEN_SELECT_IMAGE', star: '★', comp: ['音频播放器（声音编号）', '图片网格 2×2（4选1）', '正确答案标记', '解析文本（含多语言ID）'] },
    { code: 'T01', name: '汉字填空', sub: 'PICTURE_FILL_IN', star: '★', comp: ['题干图片展示', '汉字选项按钮组（含拼音）', '正确汉字标记', '解析文本（含多语言ID）'] },
    { code: 'T02', name: '词意选择1', sub: 'PICTURE_SELECT_TEXT', star: '★★', comp: ['题干：图+音频+汉字+拼音', '英文选项列表（4选1）', '选项多语言ID关联', '解析文本（含多语言ID）'] },
    { code: 'T03', name: '听力选择', sub: 'LISTEN_SELECT_SENTENCE', star: '★★', comp: ['音频播放器（声音编号）', '中文句子选项列表（4选1）', '正确句子标记', '解析文本（含多语言ID）'] },
    { code: 'T05', name: '语义选择', sub: 'GRAMMAR_SELECT', star: '★★', comp: ['英文题干（多语言ID）', '中文句子选项（4选1）', '正确句子标记', '解析文本（含多语言ID）'] },
  ]
  return (
    <div className={`page ${page === 'qtype' ? 'active' : ''}`} id="page-qtype">
      <div className="page-header">
        <div>
          <div className="page-title">题型模板配置中心</div>
          <div className="page-subtitle">管理者专用 · 配置新题型无需开发介入，JSON Schema 驱动动态表单</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => showToast('拖拽组件配置新题型（开发中）', 'info')}>+ 新增题型</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {cards.map((c) => (
          <div key={c.code} className="qtype-card">
            <div className="qtype-card-header">
              <div>
                <div className="td-mono" style={{ fontSize: '10.5px', marginBottom: 4 }}>{c.code} · {c.star}</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-light)', marginTop: 3 }}>{c.sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => showToast('JSON Schema 已复制', 'success')}>JSON</button>
                <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}>编辑</button>
              </div>
            </div>
            <div className="qtype-card-body">
              <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 10, fontWeight: 500, letterSpacing: '.4px', textTransform: 'uppercase' }}>组件配置</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: '12.5px' }}>
                {c.comp.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="component-dot" style={{ background: ['#63758a', '#5c7a68', '#8c7b62', '#a1a1aa'][i % 4] }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="qtype-card" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220, cursor: 'pointer' }} onClick={() => showToast('拖拽组件配置新题型（开发中）', 'info')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28} style={{ color: '#a1a1aa', marginBottom: 8 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          <div style={{ fontSize: 13, color: 'var(--ink-light)', fontWeight: 500 }}>新增题型模板</div>
          <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>拖拽组件，JSON 驱动</div>
        </div>
      </div>
    </div>
  )
}

export function PageLogs({ page, showToast }: { page: PageName; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  if (page !== 'logs') return null
  const rows = [
    { time: '2025-01-15 14:32', user: '张晓明', role: '管理者', action: 'PUBLISH', obj: '题目 M0300001', summary: 'N10101 · T00 听音选图 · 知识点: 米饭' },
    { time: '2025-01-15 14:05', user: '李小红', role: '教研', action: 'CREATE', obj: '资源 M0200010', summary: 'N10201 · 学习卡片 · 字 · 水 shuǐ' },
    { time: '2025-01-15 13:48', user: '李小红', role: '教研', action: 'UPDATE', obj: '目录 N10200', summary: '修改 ChineseTarget 字段 · FM-Unit2.png' },
    { time: '2025-01-15 11:20', user: '张晓明', role: '管理者', action: 'PUBLISH', obj: '题目 M0500001', summary: 'N10101 · T02 词意选择1 · 知识点: 米饭' },
    { time: '2025-01-14 17:30', user: '李小红', role: '教研', action: 'CREATE', obj: '题目 M0700007', summary: 'N10602 · T03 听力选择 · 这是她的妈妈' },
    { time: '2025-01-14 15:10', user: '张晓明', role: '管理者', action: 'REJECT', obj: '资源 M0200015', summary: '驳回：图片尺寸不符规范，需替换' },
  ]
  const actionClass: Record<string, string> = { PUBLISH: 'log-action-publish', CREATE: 'log-action-create', UPDATE: 'log-action-update', REJECT: 'log-action-reject' }
  return (
    <div className={`page ${page === 'logs' ? 'active' : ''}`} id="page-logs">
      <div className="page-header">
        <div>
          <div className="page-title">操作日志</div>
          <div className="page-subtitle">记录所有创建、修改、发布、删除操作</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => showToast('日志导出中...', 'info')}>导出日志</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>时间</th><th>操作人</th><th>角色</th><th>操作类型</th><th>对象</th><th>内容摘要</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="td-mono" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{r.time}</td>
                <td>{r.user}</td>
                <td><span className="badge" style={{ background: r.role === '管理者' ? '#f2f5f8' : '#f0f4f2', color: r.role === '管理者' ? '#63758a' : '#5c7a68' }}>{r.role}</span></td>
                <td><span className={actionClass[r.action] || ''}>{r.action}</span></td>
                <td className="td-mono" style={{ fontSize: 11 }}>{r.obj}</td>
                <td style={{ fontSize: 12, color: 'var(--ink-light)' }}>{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">共 1,248 条记录</span>
          <div className="page-btn active">1</div>
          <div className="page-btn">2</div>
          <div className="page-btn">›</div>
        </div>
      </div>
    </div>
  )
}

export function PageSettings({ page, showToast }: { page: PageName; showToast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  if (page !== 'settings') return null
  return (
    <div className={`page ${page === 'settings' ? 'active' : ''}`} id="page-settings">
      <div className="page-header">
        <div>
          <div className="page-title">系统设置</div>
          <div className="page-subtitle">用户管理、数据备份与安全配置</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="settings-section">
            <div className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={16}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              用户管理
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>用户名</th><th>角色</th><th>状态</th><th></th></tr></thead>
                <tbody>
                  <tr>
                    <td>张晓明</td>
                    <td><span className="badge" style={{ background: '#f2f5f8', color: '#63758a' }}>管理者</span></td>
                    <td><span className="status-dot published">启用</span></td>
                    <td><button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => showToast('用户设置已保存', 'success')}>编辑</button></td>
                  </tr>
                  <tr>
                    <td>李小红</td>
                    <td><span className="badge" style={{ background: '#f0f4f2', color: '#5c7a68' }}>教研</span></td>
                    <td><span className="status-dot published">启用</span></td>
                    <td><button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => showToast('用户设置已保存', 'success')}>编辑</button></td>
                  </tr>
                  <tr>
                    <td>王大力</td>
                    <td><span className="badge" style={{ background: '#f0f4f2', color: '#5c7a68' }}>教研</span></td>
                    <td><span className="status-dot draft">停用</span></td>
                    <td><button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: '11px' }}>编辑</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 12, width: '100%' }} onClick={() => showToast('邀请邮件已发送', 'success')}>+ 邀请新用户</button>
          </div>
        </div>
        <div>
          <div className="settings-section">
            <div className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={16}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              数据备份
            </div>
            <div className="setting-row">
              <div className="setting-info"><div className="setting-name">每日自动备份</div><div className="setting-desc">凌晨 2:00 全量备份 + 增量</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            <div className="setting-row">
              <div className="setting-info"><div className="setting-name">最近备份</div><div className="setting-desc">2025-01-15 02:00 · 238 MB</div></div>
              <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={() => showToast('备份文件下载中...', 'success')}>下载</button>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={() => showToast('手动备份已启动，预计 2 分钟完成', 'success')}>立即备份</button>
          </div>
          <div className="settings-section">
            <div className="settings-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={16}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              安全设置
            </div>
            <div className="setting-row">
              <div className="setting-info"><div className="setting-name">敏感词过滤</div><div className="setting-desc">发布前自动检测</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
            <div className="setting-row">
              <div className="setting-info"><div className="setting-name">HTTPS 强制跳转</div><div className="setting-desc">所有 HTTP 请求自动重定向</div></div>
              <label className="toggle"><input type="checkbox" defaultChecked /><div className="toggle-track" /><div className="toggle-thumb" /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
