export function Qtype() {
  const cards = [
    { code: 'T00', name: '听音选图', sub: 'LISTEN_SELECT_IMAGE', star: '★' },
    { code: 'T01', name: '汉字填空', sub: 'PICTURE_FILL_IN', star: '★' },
    { code: 'T02', name: '词意选择1', sub: 'PICTURE_SELECT_TEXT', star: '★★' },
    { code: 'T03', name: '听力选择', sub: 'LISTEN_SELECT_SENTENCE', star: '★★' },
    { code: 'T05', name: '语义选择', sub: 'GRAMMAR_SELECT', star: '★★' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">题型模板配置中心</div>
          <div className="page-subtitle">管理者专用 · 配置新题型无需开发介入，JSON Schema 驱动动态表单</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary">+ 新增题型</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {cards.map((c) => (
          <div key={c.code} className="qtype-card">
            <div className="qtype-card-header">
              <div>
                <div className="td-mono" style={{ fontSize: '10.5px', marginBottom: 4 }}>{c.code} · {c.star}</div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink-light)', marginTop: 3 }}>{c.sub}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className="btn btn-secondary btn-sm">JSON</button>
                <button type="button" className="btn btn-ghost btn-sm">编辑</button>
              </div>
            </div>
            <div className="qtype-card-body">
              <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 10, fontWeight: 500, letterSpacing: '.4px', textTransform: 'uppercase' }}>组件配置</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: '12.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="component-dot" style={{ background: '#63758a' }} />音频/题干组件</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="component-dot" style={{ background: 'var(--teal)' }} />选项组件</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="component-dot" style={{ background: 'var(--amber)' }} />正确答案标记</div>
              </div>
            </div>
          </div>
        ))}
        <div
          className="qtype-card"
          style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 28, color: '#a1a1aa', marginBottom: 8 }}>+</span>
          <div style={{ fontSize: 13, color: 'var(--ink-light)', fontWeight: 500 }}>新增题型模板</div>
          <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>拖拽组件，JSON 驱动</div>
        </div>
      </div>
    </>
  );
}
