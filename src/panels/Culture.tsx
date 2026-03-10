const items = [
  { title: 'Beijing, China\'s Capital City', type: '视频', course: 'Unit 4', unlock: '完成Unit 4', status: '已发布' },
  { title: 'Culture Hub — Tips & Etiquette', type: '文章', course: '通用', unlock: '免费', status: '已发布' },
  { title: '文化奖励：中国新年', type: '交互', course: 'Unit 6', unlock: '完成Unit 6', status: '草稿' },
];

export function Culture() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">文化内容管理</div>
          <div className="page-subtitle">管理文化视频、文章与交互内容</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary btn-sm">+ 新建内容</button>
        </div>
      </div>
      <div className="card">
      <div className="card-header">
        <div className="card-title">内容列表</div>
        <button type="button" className="btn btn-primary btn-sm">+ 新建内容</button>
      </div>
      <div className="card-body">
        <table>
          <thead>
            <tr><th>标题</th><th>类型</th><th>关联课程</th><th>解锁条件</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.title}>
                <td><b>{row.title}</b></td>
                <td><span className={`badge ${row.type === '视频' ? 'badge-indigo' : row.type === '文章' ? 'badge-green' : 'badge-amber'}`}>{row.type}</span></td>
                <td>{row.course}</td>
                <td>{row.unlock}</td>
                <td><span className={`badge ${row.status === '已发布' ? 'badge-teal' : 'badge-amber'}`}>{row.status}</span></td>
                <td><button type="button" className="btn btn-secondary btn-sm">编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
