import type { PanelId } from '../types';

type Props = { onNavigate: (id: PanelId) => void };

export function Dashboard({ onNavigate }: Props) {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">数据仪表盘</div>
          <div className="page-subtitle">NSK Horizon OS · 字灵大陆 · 综合运营概览</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary">导出报告</button>
          <button type="button" className="btn btn-primary">刷新数据</button>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon grey">👥</div>
          <div><div className="stat-val">2,418</div><div className="stat-label">活跃用户</div><div className="stat-delta delta-up">↑ 12.4%</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📚</div>
          <div><div className="stat-val">18,702</div><div className="stat-label">课程完成次数</div><div className="stat-delta delta-up">↑ 8.6%</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🤖</div>
          <div><div className="stat-val">94,301</div><div className="stat-label">AI 对话轮次</div><div className="stat-delta delta-up">↑ 23.6%</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber">⭐</div>
          <div><div className="stat-val">342</div><div className="stat-label">Premium 用户</div><div className="stat-delta delta-up">↑ 5.1%</div></div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">对话量趋势（7日）</div>
            <span className="chart-legend">AI 对话 + 评测</span>
          </div>
          <div className="card-body">
            <div className="mini-bars">
              <div className="mini-bar hi" style={{ height: '58%' }} />
              <div className="mini-bar hi" style={{ height: '72%' }} />
              <div className="mini-bar hi" style={{ height: '51%' }} />
              <div className="mini-bar hi" style={{ height: '88%' }} />
              <div className="mini-bar hi" style={{ height: '67%' }} />
              <div className="mini-bar hi" style={{ height: '82%' }} />
              <div className="mini-bar" style={{ height: '100%', background: 'var(--ink)', opacity: 1 }} />
            </div>
            <div className="chart-labels">
              <span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span>
              <span className="chart-labels-today">今日</span>
            </div>
            <hr className="divider" />
            <div className="stat-inline-row">
              <div className="stat-inline-box">
                <div className="stat-inline-label">发音评测均分</div>
                <div className="stat-inline-val">87.3</div>
                <div className="stat-inline-bar"><div className="stat-inline-fill" style={{ width: '87%' }} /></div>
              </div>
              <div className="stat-inline-box">
                <div className="stat-inline-label">语法纠错触发</div>
                <div className="stat-inline-val">12,094</div>
                <div className="stat-inline-delta">↑ 9.7% 本周</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">内容概况</div></div>
          <div className="card-body">
            <table>
              <thead><tr><th>模块</th><th>数量</th><th>状态</th></tr></thead>
              <tbody>
                <tr><td>课程目录节点</td><td><span className="td-mono" style={{ fontWeight: 500 }}>26</span></td><td><span className="status-dot published">已发布</span></td></tr>
                <tr><td>学习资源</td><td><span className="td-mono" style={{ fontWeight: 500 }}>77</span></td><td><span className="status-dot published">已发布</span></td></tr>
                <tr><td>题库题目</td><td><span className="td-mono" style={{ fontWeight: 500 }}>54</span></td><td><span className="status-dot review">3 待审核</span></td></tr>
                <tr><td>多语言条目</td><td><span className="td-mono" style={{ fontWeight: 500 }}>157</span></td><td><span className="status-dot draft">12 待翻译</span></td></tr>
                <tr><td>AI 场景</td><td><span className="td-mono" style={{ fontWeight: 500 }}>6</span></td><td><span className="status-dot published">已启用</span></td></tr>
              </tbody>
            </table>
            <hr className="divider" />
            <div className="btn-group">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('catalog')}>目录管理</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('ai-roles')}>AI 角色</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('resources')}>学习资源</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('questions')}>题库</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">快速操作</div></div>
        <div className="card-body">
          <div className="btn-group">
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('ai-roles')}>配置 AI 角色</button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('catalog')}>目录管理</button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('users')}>查看用户</button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('hsk')}>HSK 配置</button>
            <button type="button" className="btn btn-secondary" onClick={() => onNavigate('ai-api')}>API 设置</button>
          </div>
        </div>
      </div>
    </>
  );
}
