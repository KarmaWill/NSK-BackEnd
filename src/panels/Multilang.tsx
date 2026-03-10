export function Multilang() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">多语言译文管理</div>
          <div className="page-subtitle">共 157 条 · 支持泰语、越南语、韩语、日语</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary">批量导入</button>
          <button type="button" className="btn btn-primary">+ 新增条目</button>
        </div>
      </div>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索 ID 或文本..."
          style={{ width: 280, padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '1rem' }}
        />
        <span className="filter-tag active">全部</span>
        <span className="filter-tag">🇹🇭 泰语</span>
        <span className="filter-tag">🇻🇳 越南语</span>
        <span className="filter-tag">🇰🇷 韩语</span>
        <span className="filter-tag">🇯🇵 日语</span>
        <span className="filter-tag">⚠ 待翻译</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>中文原文</th>
              <th><span className="lang-badge lang-th">TH</span>泰语</th>
              <th><span className="lang-badge lang-vi">VI</span>越南语</th>
              <th><span className="lang-badge lang-ko">KO</span>韩语</th>
              <th><span className="lang-badge lang-ja">JA</span>日语</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-mono">L000001</td>
              <td style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>NSK Chinese</td>
              <td className="text-muted">—</td>
              <td className="text-muted">—</td>
              <td className="text-muted">—</td>
              <td className="text-muted">—</td>
              <td><button type="button" className="btn btn-secondary btn-sm">编辑</button></td>
            </tr>
            <tr>
              <td className="font-mono">L000003</td>
              <td style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>Main Foods</td>
              <td>อาหารหลักประจำวัน</td>
              <td>Thức ăn chính</td>
              <td>주요 음식</td>
              <td>主要な食べ物</td>
              <td><button type="button" className="btn btn-secondary btn-sm">编辑</button></td>
            </tr>
            <tr>
              <td className="font-mono">L000004</td>
              <td style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>Rice</td>
              <td>ข้าว</td>
              <td>Gạo</td>
              <td>쌀</td>
              <td>米</td>
              <td><button type="button" className="btn btn-secondary btn-sm">编辑</button></td>
            </tr>
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页，共 16 页</span>
          <button type="button" className="page-btn">‹</button>
          <button type="button" className="page-btn active">1</button>
          <button type="button" className="page-btn">2</button>
          <button type="button" className="page-btn">›</button>
        </div>
      </div>
    </>
  );
}
