import { useMemo, useState } from 'react';
import {
  DEFAULT_MODULES,
  MODULE_OPTIONS,
  REQUIRED_MODULES,
  loadCourseLibs,
  saveCourseLibs,
  type CourseLibRow,
  type CourseModuleConfig,
} from '../stores/courseLibs';

const nowStamp = () => new Date().toLocaleString('zh-CN', { hour12: false });

export function CourseLibConfig() {
  const BIZ_OPTIONS = ['体系课', '专题课', '冲刺课', '自定义'] as const;
  const [rows, setRows] = useState<CourseLibRow[]>(() => loadCourseLibs());
  const [createOpen, setCreateOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newBizAttr, setNewBizAttr] = useState('体系课');
  const [newBizAttrCustom, setNewBizAttrCustom] = useState('');
  const [newStatus, setNewStatus] = useState<'enabled' | 'disabled'>('enabled');
  const [newModules, setNewModules] = useState<CourseModuleConfig>({ ...DEFAULT_MODULES });
  const [configOpen, setConfigOpen] = useState(false);
  const [configTargetId, setConfigTargetId] = useState<string | null>(null);
  const [configCourseName, setConfigCourseName] = useState('');
  const [configBizAttr, setConfigBizAttr] = useState('体系课');
  const [configBizAttrCustom, setConfigBizAttrCustom] = useState('');
  const [configStatus, setConfigStatus] = useState<'enabled' | 'disabled'>('enabled');
  const [configModules, setConfigModules] = useState<CourseModuleConfig>({ ...DEFAULT_MODULES });
  const [deleteTarget, setDeleteTarget] = useState<CourseLibRow | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const configTarget = useMemo(
    () => (configTargetId ? rows.find((row) => row.id === configTargetId) ?? null : null),
    [configTargetId, rows],
  );

  const updateRows = (updater: (prev: CourseLibRow[]) => CourseLibRow[]) => {
    setRows((prev) => {
      const next = updater(prev);
      saveCourseLibs(next);
      return next;
    });
  };

  const resetNewForm = () => {
    setNewCourseName('');
    setNewCourseId('');
    setNewBizAttr('体系课');
    setNewBizAttrCustom('');
    setNewStatus('enabled');
    setNewModules({ ...DEFAULT_MODULES });
  };

  const resolvedBizAttr = (mode: string, custom: string) =>
    mode === '自定义' ? custom.trim() || '自定义' : mode;

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetNewForm();
  };

  const handleCreate = () => {
    const name = newCourseName.trim();
    const id = newCourseId.trim();
    if (!name || !id) return;
    if (rows.some((row) => row.id === id)) {
      window.alert('课程ID已存在');
      return;
    }
    if (rows.some((row) => row.name === name)) {
      window.alert('课程名称已存在');
      return;
    }
    const ts = nowStamp();
    updateRows((prev) => [
      ...prev,
      {
        id,
        name,
        bizAttr: resolvedBizAttr(newBizAttr, newBizAttrCustom),
        modules: { ...newModules },
        status: newStatus,
        createdAt: ts,
        updatedAt: ts,
      },
    ]);
    closeCreateModal();
  };

  const handleToggleStatus = (id: string) => {
    updateRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status: row.status === 'enabled' ? 'disabled' : 'enabled',
              updatedAt: nowStamp(),
            }
          : row,
      ),
    );
  };

  const startConfigure = (row: CourseLibRow) => {
    setConfigTargetId(row.id);
    setConfigCourseName(row.name);
    if (BIZ_OPTIONS.includes(row.bizAttr as (typeof BIZ_OPTIONS)[number])) {
      setConfigBizAttr(row.bizAttr);
      setConfigBizAttrCustom('');
    } else {
      setConfigBizAttr('自定义');
      setConfigBizAttrCustom(row.bizAttr);
    }
    setConfigStatus(row.status);
    setConfigModules({ ...row.modules });
    setConfigOpen(true);
  };

  const saveConfigure = () => {
    if (!configTargetId) return;
    updateRows((prev) =>
      prev.map((row) =>
        row.id === configTargetId
          ? {
              ...row,
              name: configCourseName.trim() || row.name,
              bizAttr: resolvedBizAttr(configBizAttr, configBizAttrCustom),
              status: configStatus,
              modules: { ...configModules },
              updatedAt: nowStamp(),
            }
          : row,
      ),
    );
    setConfigOpen(false);
    setConfigTargetId(null);
  };

  const closeConfig = () => {
    setConfigOpen(false);
    setConfigTargetId(null);
  };

  const requestDelete = (row: CourseLibRow) => {
    setDeleteTarget(row);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const closeDelete = () => {
    setDeleteTarget(null);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const confirmDelete = () => {
    if (!deleteTarget || rows.length <= 1) return;
    updateRows((prev) => prev.filter((row) => row.id !== deleteTarget.id));
    closeDelete();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">课程库配置</div>
          <div className="page-subtitle">课程库可组装包含目录；目录管理、学习资源、资源库为默认必选</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => setCreateOpen(true)}>
            + 新建课程库
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <div className="table-count">共 {rows.length} 个课程库</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 64 }}>序号</th>
              <th>课程ID</th>
              <th>课程名称</th>
              <th>业务属性</th>
              <th>包含目录</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td>{String(idx + 1).padStart(2, '0')}</td>
                <td className="td-mono">{row.id}</td>
                <td>{row.name}</td>
                <td>{row.bizAttr}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {MODULE_OPTIONS.filter((m) => row.modules[m.key]).map((m) => (
                      <span key={m.key} className="badge badge-draft">{m.label}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span>{row.status === 'enabled' ? '已启用' : '已停用'}</span>
                    <label className="toggle-wrap" style={{ verticalAlign: 'middle' }}>
                      <input type="checkbox" checked={row.status === 'enabled'} onChange={() => handleToggleStatus(row.id)} />
                      <span className="toggle-track" />
                      <span className="toggle-thumb" />
                    </label>
                  </div>
                </td>
                <td className="td-mono">{row.createdAt}</td>
                <td className="td-mono">{row.updatedAt}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startConfigure(row)}>配置</button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => requestDelete(row)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${createOpen ? 'open' : ''}`} onClick={closeCreateModal} role="dialog" aria-modal="true" aria-label="新建课程库">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860 }}>
          <div className="modal-header">
            <div className="modal-title">新建课程库</div>
            <button type="button" className="modal-close" onClick={closeCreateModal} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row" style={{ gridTemplateColumns: '160px 1fr 180px', marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">课程ID</label>
                <input className="form-input td-mono" value={newCourseId} onChange={(e) => setNewCourseId(e.target.value)} placeholder="CL-002" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">课程名称</label>
                <input className="form-input" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} placeholder="例如：NSK体系课程 A2" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">业务属性</label>
                <select className="form-input form-select" value={newBizAttr} onChange={(e) => setNewBizAttr(e.target.value)}>
                  <option value="体系课">体系课</option>
                  <option value="专题课">专题课</option>
                  <option value="冲刺课">冲刺课</option>
                  <option value="自定义">自定义</option>
                </select>
                {newBizAttr === '自定义' && (
                  <input
                    className="form-input"
                    style={{ marginTop: 8 }}
                    value={newBizAttrCustom}
                    onChange={(e) => setNewBizAttrCustom(e.target.value)}
                    placeholder="请输入自定义业务属性"
                  />
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">状态</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={newStatus === 'enabled'} onChange={() => setNewStatus((v) => (v === 'enabled' ? 'disabled' : 'enabled'))} />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
                <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>{newStatus === 'enabled' ? '已启用' : '已停用'}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">包含目录</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {MODULE_OPTIONS.map((option) => {
                  const required = REQUIRED_MODULES.includes(option.key);
                  const selected = newModules[option.key];
                  return (
                    <label
                      key={option.key}
                      className={`filter-tag ${selected ? 'active' : ''}`}
                      style={{ cursor: required ? 'not-allowed' : 'pointer', opacity: required ? 0.9 : 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={required}
                        onChange={(e) => setNewModules((prev) => ({ ...prev, [option.key]: e.target.checked }))}
                        style={{ marginRight: 6 }}
                      />
                      {option.label}
                      {required ? '（必选）' : ''}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeCreateModal}>取消</button>
            <button type="button" className="btn btn-primary" onClick={handleCreate}>新建课程库</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${configOpen && !!configTarget ? 'open' : ''}`} onClick={closeConfig} role="dialog" aria-modal="true" aria-label="课程库配置">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860 }}>
          <div className="modal-header">
            <div className="modal-title">课程库配置</div>
            <button type="button" className="modal-close" onClick={closeConfig} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row" style={{ gridTemplateColumns: '160px 1fr 180px', marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">课程ID</label>
                <input className="form-input td-mono" value={configTarget?.id ?? ''} readOnly />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">课程名称</label>
                <input className="form-input" value={configCourseName} onChange={(e) => setConfigCourseName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">业务属性</label>
                <select className="form-input form-select" value={configBizAttr} onChange={(e) => setConfigBizAttr(e.target.value)}>
                  <option value="体系课">体系课</option>
                  <option value="专题课">专题课</option>
                  <option value="冲刺课">冲刺课</option>
                  <option value="自定义">自定义</option>
                </select>
                {configBizAttr === '自定义' && (
                  <input
                    className="form-input"
                    style={{ marginTop: 8 }}
                    value={configBizAttrCustom}
                    onChange={(e) => setConfigBizAttrCustom(e.target.value)}
                    placeholder="请输入自定义业务属性"
                  />
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">状态</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label className="toggle-wrap">
                  <input type="checkbox" checked={configStatus === 'enabled'} onChange={() => setConfigStatus((v) => (v === 'enabled' ? 'disabled' : 'enabled'))} />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
                <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>{configStatus === 'enabled' ? '已启用' : '已停用'}</span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">包含目录</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {MODULE_OPTIONS.map((option) => {
                  const required = REQUIRED_MODULES.includes(option.key);
                  const selected = configModules[option.key];
                  return (
                    <label
                      key={option.key}
                      className={`filter-tag ${selected ? 'active' : ''}`}
                      style={{ cursor: required ? 'not-allowed' : 'pointer', opacity: required ? 0.9 : 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={required}
                        onChange={(e) => setConfigModules((prev) => ({ ...prev, [option.key]: e.target.checked }))}
                        style={{ marginRight: 6 }}
                      />
                      {option.label}
                      {required ? '（必选）' : ''}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeConfig}>取消</button>
            <button type="button" className="btn btn-primary" onClick={saveConfigure}>保存配置</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${deleteTarget ? 'open' : ''}`} onClick={closeDelete} role="dialog" aria-modal="true" aria-label="删除课程库">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
          <div className="modal-header">
            <div className="modal-title">删除课程库</div>
            <button type="button" className="modal-close" onClick={closeDelete} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            {!deleteTarget ? (
              <p style={{ margin: 0 }}>请选择要删除的课程库。</p>
            ) : rows.length <= 1 ? (
              <p style={{ margin: 0 }}>至少保留一个课程库，当前无法删除。</p>
            ) : deleteStep === 1 ? (
              <p style={{ margin: 0 }}>确认删除课程库「{deleteTarget.name}」？此操作将移除该课程库配置。</p>
            ) : (
              <>
                <p style={{ margin: '0 0 8px' }}>二次确认：请输入课程库名称 <b>{deleteTarget.name}</b> 以确认删除。</p>
                <input className="form-input" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} />
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeDelete}>取消</button>
            {deleteTarget && rows.length > 1 && deleteStep === 1 && (
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteStep(2)}>继续</button>
            )}
            {deleteTarget && rows.length > 1 && deleteStep === 2 && (
              <button type="button" className="btn btn-primary" disabled={deleteConfirmText !== deleteTarget.name} onClick={confirmDelete}>确认删除</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
