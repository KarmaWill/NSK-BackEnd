const books = [
  { title: 'HSK 1 Standard Course', level: 'L1', features: '听力/阅读/词汇', premium: false },
  { title: 'HSK 2 Standard Course', level: 'L2', features: '听力/阅读/词汇', premium: false },
  { title: 'Business Chinese for Traders', level: 'L4', features: '听力/阅读/AI练习', premium: true },
  { title: 'Daily Life in Beijing', level: 'L2', features: '阅读/文化', premium: false },
  { title: 'Pinyin Master', level: 'L1', features: '拼音/发音', premium: false },
];

export function Library() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">图书馆管理</div>
          <div className="page-subtitle">管理课程配套书籍与阅读材料</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary btn-sm">+ 上架书籍</button>
        </div>
      </div>
      <div className="card">
      <div className="card-header">
        <div className="card-title">书籍列表</div>
        <button type="button" className="btn btn-primary btn-sm">+ 上架书籍</button>
      </div>
      <div className="card-body">
        <table>
          <thead>
            <tr><th>书名</th><th>难度</th><th>功能</th><th>Premium</th><th>操作</th></tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.title}>
                <td><b>{b.title}</b></td>
                <td><span className={`badge ${b.level === 'L1' || b.level === 'L2' ? 'badge-green' : 'badge-amber'}`}>{b.level}</span></td>
                <td>{b.features}</td>
                <td>{b.premium ? <span className="badge badge-amber">Premium</span> : '—'}</td>
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
