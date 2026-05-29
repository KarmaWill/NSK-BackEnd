export function OpsBanner() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Banner 配置</div>
          <div className="page-subtitle">C-Lingo 官网 · 首页与活动位 Banner 管理</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary">+ 新建 Banner</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Banner 列表</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ margin: 0 }}>
            在此配置官网首页、活动页等运营 Banner 的展示顺序、跳转链接与上下线时间。
          </p>
        </div>
      </div>
    </>
  );
}
