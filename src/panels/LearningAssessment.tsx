type Props = {
  title: string;
  subtitle: string;
};

export function LearningAssessment({ title, subtitle }: Props) {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-subtitle">{subtitle}</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary">保存配置</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">测评配置</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ margin: 0 }}>
            在此配置 C-Lingo 官网学习测评入口、题目说明与结果展示规则。
          </p>
        </div>
      </div>
    </>
  );
}
