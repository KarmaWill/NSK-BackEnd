export function Logs() {
  const rows = [
    { time: '2025-01-15 14:32', user: '张晓明', role: '管理者', action: 'PUBLISH', obj: '题目 M0300001', summary: 'N10101 · T00 听音选图 · 知识点: 米饭' },
    { time: '2025-01-15 14:05', user: '李小红', role: '教研', action: 'CREATE', obj: '资源 M0200010', summary: 'N10201 · 学习卡片 · 字 · 水 shuǐ' },
    { time: '2025-01-15 13:48', user: '李小红', role: '教研', action: 'UPDATE', obj: '目录 N10200', summary: '修改 ChineseTarget 字段 · FM-Unit2.png' },
    { time: '2025-01-15 11:20', user: '张晓明', role: '管理者', action: 'PUBLISH', obj: '题目 M0500001', summary: 'N10101 · T02 词意选择1 · 知识点: 米饭' },
    { time: '2025-01-14 17:30', user: '李小红', role: '教研', action: 'CREATE', obj: '题目 M0700007', summary: 'N10602 · T03 听力选择 · 这是她的妈妈' },
    { time: '2025-01-14 15:10', user: '张晓明', role: '管理者', action: 'REJECT', obj: '资源 M0200015', summary: '驳回：图片尺寸不符规范，需替换' },
  ];
  const actionClass: Record<string, string> = {
    PUBLISH: 'log-action-publish',
    CREATE: 'log-action-create',
    UPDATE: 'log-action-update',
    REJECT: 'log-action-reject',
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">操作日志</div>
          <div className="page-subtitle">记录所有创建、修改、发布、删除操作</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary">导出日志</button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作人</th>
              <th>角色</th>
              <th>操作类型</th>
              <th>对象</th>
              <th>内容摘要</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="td-mono" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{r.time}</td>
                <td>{r.user}</td>
                <td>
                  <span className="badge badge-muted">{r.role}</span>
                </td>
                <td>
                  <span className={actionClass[r.action] ?? ''}>{r.action}</span>
                </td>
                <td className="td-mono" style={{ fontSize: 11 }}>{r.obj}</td>
                <td style={{ fontSize: 12, color: 'var(--ink-light)' }}>{r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">共 1,248 条记录</span>
          <button type="button" className="page-btn active">1</button>
          <button type="button" className="page-btn">2</button>
          <button type="button" className="page-btn">›</button>
        </div>
      </div>
    </>
  );
}
