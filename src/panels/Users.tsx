const users = [
  { name: 'Alice W.', reg: '2026-01-10', days: 24, completed: '3/6', ai: 156, member: 'Premium' },
  { name: 'Bob K.', reg: '2026-01-15', days: 18, completed: '2/6', ai: 89, member: '免费' },
  { name: 'Carol M.', reg: '2026-01-20', days: 12, completed: '1/6', ai: 45, member: 'Premium' },
  { name: 'David L.', reg: '2026-01-22', days: 8, completed: '1/6', ai: 32, member: '免费' },
];

export function Users() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">用户管理</div>
          <div className="page-subtitle">查看与管理学习用户</div>
        </div>
      </div>
      <div className="stats-row stats-row-3" style={{ marginBottom: 16 }}>
        <div className="stat-card"><div className="stat-icon grey">👥</div><div><div className="stat-val">2,418</div><div className="stat-label">总注册用户</div></div></div>
        <div className="stat-card"><div className="stat-icon amber">⭐</div><div><div className="stat-val">342</div><div className="stat-label">Premium 用户</div></div></div>
        <div className="stat-card"><div className="stat-icon green">🔥</div><div><div className="stat-val">18</div><div className="stat-label">平均连续天数</div></div></div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">用户列表</div>
          <input type="text" className="form-input" placeholder="搜索用户..." style={{ width: 260 }} />
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr><th>用户</th><th>注册时间</th><th>学习天数</th><th>完成课程</th><th>AI对话次数</th><th>会员类型</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.name}>
                  <td><b>{u.name}</b></td>
                  <td className="text-muted">{u.reg}</td>
                  <td>🔥 {u.days}天</td>
                  <td>{u.completed}</td>
                  <td>{u.ai}</td>
                  <td><span className={`badge ${u.member === 'Premium' ? 'badge-amber' : 'badge-muted'}`}>{u.member}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
