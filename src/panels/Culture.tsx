const items = [
  { title: 'Homepage Hero Film', position: '官网首页首屏', duration: '00:45', publishAt: '2026-05-20', status: '已发布' },
  { title: 'AI Speaking Demo', position: 'AI 口语介绍区', duration: '00:32', publishAt: '2026-05-18', status: '已发布' },
  { title: 'HSK Learning Journey', position: '考试转化页', duration: '00:58', publishAt: '待定', status: '草稿' },
];

export function Culture() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">视频中心</div>
          <div className="page-subtitle">配置 C-Lingo 官网大视频、展示位置与上下线状态</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary btn-sm">+ 新建内容</button>
        </div>
      </div>
      <div className="card">
      <div className="card-header">
        <div className="card-title">官网视频配置</div>
        <button type="button" className="btn btn-primary btn-sm">+ 新建视频</button>
      </div>
      <div className="card-body">
        <table>
          <thead>
            <tr><th>视频标题</th><th>展示位置</th><th>时长</th><th>上线时间</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.title}>
                <td><b>{row.title}</b></td>
                <td>{row.position}</td>
                <td><span className="td-mono">{row.duration}</span></td>
                <td>{row.publishAt}</td>
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
