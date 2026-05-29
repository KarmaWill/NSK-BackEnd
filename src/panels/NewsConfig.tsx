export function NewsConfig() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">新闻配置</div>
          <div className="page-subtitle">C-Lingo 官网 · 新闻与公告内容管理</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary">+ 新建新闻</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">新闻列表</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ margin: 0 }}>
            在此配置官网展示的新闻、公告与活动资讯。内容将同步至 C-Lingo 官网前台。
          </p>
        </div>
      </div>
    </>
  );
}
