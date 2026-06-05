import { useEffect, useState } from 'react';
import { listUsers, type ApiUserRow } from '../lib/api';

function formatDate(iso: string) {
  try {
    return iso.slice(0, 10);
  } catch {
    return iso;
  }
}

export function Users() {
  const [rows, setRows] = useState<ApiUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listUsers({
        q: q.trim() || undefined,
        role: roleFilter || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [roleFilter]);

  const userCount = rows.filter((r) => r.role === 'USER').length;
  const adminCount = rows.filter((r) => r.role === 'ADMIN').length;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">用户管理</div>
          <div className="page-subtitle">来自 API 的真实注册用户（含官网 account 注册）</div>
        </div>
      </div>
      <div className="stats-row stats-row-3" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-icon grey">👥</div>
          <div>
            <div className="stat-val">{userCount}</div>
            <div className="stat-label">普通用户</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">🛡</div>
          <div>
            <div className="stat-val">{adminCount}</div>
            <div className="stat-label">管理员</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💬</div>
          <div>
            <div className="stat-val">{rows.reduce((n, r) => n + r._count.feedbacks, 0)}</div>
            <div className="stat-label">反馈总数</div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">用户列表</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="form-input"
              style={{ width: 140 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">全部角色</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <input
              type="text"
              className="form-input"
              placeholder="搜索用户名..."
              style={{ width: 200 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
            <button type="button" className="btn btn-outline" onClick={load}>
              搜索
            </button>
          </div>
        </div>
        <div className="card-body">
          {loading && <p className="text-muted">加载中…</p>}
          {error && <p style={{ color: 'crimson' }}>{error}</p>}
          {!loading && !rows.length && <p className="text-muted">暂无用户</p>}
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>注册时间</th>
                <th>反馈数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.username}</b>
                  </td>
                  <td>
                    <span
                      className={`badge ${u.role === 'ADMIN' ? 'badge-amber' : 'badge-muted'}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="text-muted">{formatDate(u.createdAt)}</td>
                  <td>{u._count.feedbacks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
