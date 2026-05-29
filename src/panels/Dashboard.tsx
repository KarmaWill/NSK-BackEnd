import type { PanelId } from '../types';

type Props = { onNavigate: (id: PanelId) => void };

const stats = [
  { label: '活跃用户', value: '2,418', delta: '+12.4%', accent: 'emerald', caption: '近 7 日增长' },
  { label: '课程完成', value: '18,702', delta: '+8.6%', accent: 'blue', caption: '累计完成次数' },
  { label: 'AI 对话', value: '94,301', delta: '+23.6%', accent: 'violet', caption: '本月训练轮次' },
  { label: 'Premium', value: '342', delta: '+5.1%', accent: 'amber', caption: '付费用户' },
];

const bars = [58, 72, 51, 88, 67, 82, 100];
const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];

const contentRows = [
  { module: '课程目录节点', count: '26', status: '已发布', tone: 'published' },
  { module: '学习资源', count: '77', status: '已发布', tone: 'published' },
  { module: '题库题目', count: '54', status: '3 待审核', tone: 'review' },
  { module: '多语言条目', count: '157', status: '12 待翻译', tone: 'draft' },
  { module: 'AI 场景', count: '6', status: '已启用', tone: 'published' },
];

export function Dashboard({ onNavigate }: Props) {
  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-eyebrow">NSK Horizon OS</div>
          <h1>数据仪表盘</h1>
          <p>字灵大陆 · 综合运营概览</p>
          <div className="dashboard-hero-tags">
            <span>Learning Ops</span>
            <span>AI Training</span>
            <span>Premium Growth</span>
          </div>
        </div>
        <div className="dashboard-hero-panel">
          <div className="dashboard-hero-metric">
            <span>今日健康度</span>
            <strong>92</strong>
          </div>
          <div className="dashboard-orbit">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="page-actions dashboard-actions">
          <button type="button" className="btn btn-secondary">导出报告</button>
          <button type="button" className="btn btn-primary">刷新数据</button>
        </div>
      </section>

      <section className="dashboard-stat-grid">
        {stats.map((item) => (
          <div className={`dashboard-stat-card ${item.accent}`} key={item.label}>
            <div className="dashboard-stat-top">
              <span>{item.label}</span>
              <b>{item.delta}</b>
            </div>
            <div className="dashboard-stat-value">{item.value}</div>
            <div className="dashboard-stat-caption">{item.caption}</div>
          </div>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card dashboard-card-large">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">对话量趋势</div>
              <div className="dashboard-card-subtitle">AI 对话 + 发音评测 · 近 7 日</div>
            </div>
            <span className="dashboard-live-chip">Live</span>
          </div>
          <div className="dashboard-chart">
            {bars.map((height, index) => (
              <div className="dashboard-chart-col" key={weekLabels[index]}>
                <div className="dashboard-chart-track">
                  <span style={{ height: `${height}%` }} />
                </div>
                <b>{weekLabels[index]}</b>
              </div>
            ))}
          </div>
          <div className="dashboard-inline-metrics">
            <div>
              <span>发音评测均分</span>
              <strong>87.3</strong>
              <div className="dashboard-progress"><i style={{ width: '87%' }} /></div>
            </div>
            <div>
              <span>语法纠错触发</span>
              <strong>12,094</strong>
              <em>+9.7% 本周</em>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">内容健康度</div>
              <div className="dashboard-card-subtitle">发布、审核与翻译状态</div>
            </div>
          </div>
          <div className="dashboard-health-ring">
            <div>
              <strong>84%</strong>
              <span>Ready</span>
            </div>
          </div>
          <div className="dashboard-health-list">
            <div><span>已发布内容</span><b>72%</b></div>
            <div><span>待审核题目</span><b>3</b></div>
            <div><span>待翻译条目</span><b>12</b></div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">内容概况</div>
              <div className="dashboard-card-subtitle">关键模块资产状态</div>
            </div>
          </div>
          <div className="dashboard-table-wrap">
            <table>
              <tbody>
                {contentRows.map((row) => (
                  <tr key={row.module}>
                    <td>{row.module}</td>
                    <td><span className="td-mono">{row.count}</span></td>
                    <td><span className={`status-dot ${row.tone}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dashboard-card-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => onNavigate('catalog')}>目录管理</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('ai-roles')}>AI 角色</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('resources')}>学习资源</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onNavigate('questions')}>题库</button>
          </div>
        </div>

        <div className="dashboard-card dashboard-card-dark">
          <div className="dashboard-card-header">
            <div>
              <div className="dashboard-card-title">快速操作</div>
              <div className="dashboard-card-subtitle">高频任务入口</div>
            </div>
          </div>
          <div className="dashboard-action-grid">
            <button type="button" onClick={() => onNavigate('ai-roles')}>配置 AI 角色<span>口语老师设定</span></button>
            <button type="button" onClick={() => onNavigate('catalog')}>目录管理<span>课程主线维护</span></button>
            <button type="button" onClick={() => onNavigate('users')}>查看用户<span>学习数据追踪</span></button>
            <button type="button" onClick={() => onNavigate('hsk')}>HSK 配置<span>考试资源配置</span></button>
            <button type="button" onClick={() => onNavigate('ai-api')}>API 设置<span>模型与接口</span></button>
          </div>
        </div>
      </section>
    </div>
  );
}
