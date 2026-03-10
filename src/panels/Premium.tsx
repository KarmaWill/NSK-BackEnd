import { Toggle } from '../components/Toggle';

const features = [
  { key: 'PREMIUM_HSK', label: 'PREMIUM_HSK — HSK 模拟考试', desc: '启用后仅 Premium 用户可访问完整模拟考' },
  { key: 'PREMIUM_AI', label: 'PREMIUM_AI — 高级 AI 对话', desc: '无限制场景练习、AI 深度反馈、个性化学习计划' },
  { key: 'PREMIUM_DIGITAL_HUMAN', label: 'PREMIUM_DIGITAL_HUMAN — 数字人教师', desc: '启用 AI 数字人角色，提供沉浸式面对面对话体验' },
  { key: 'PREMIUM_HANZI', label: 'PREMIUM_HANZI — 汉字精练室', desc: '高级汉字学习：字源溯源、书法临摹、笔顺动画' },
];

export function Premium() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Premium 管理</div>
          <div className="page-subtitle">配置付费功能开关与定价</div>
        </div>
      </div>
      <div className="card">
      <div className="card-header"><div className="card-title">Premium 功能开关</div></div>
      <div className="card-body">
        {features.map((f) => (
          <div key={f.key} className="toggle-row">
            <div><div className="toggle-label">{f.label}</div><div className="toggle-desc">{f.desc}</div></div>
            <Toggle defaultOn />
          </div>
        ))}
        <hr className="divider" />
        <div className="form-row">
          <div className="form-group"><label>Premium 月费 (USD)</label><input type="number" defaultValue={9.99} /></div>
          <div className="form-group"><label>Premium 年费 (USD)</label><input type="number" defaultValue={79.99} /></div>
        </div>
        <button type="button" className="btn btn-primary">💾 保存 Premium 配置</button>
      </div>
    </div>
    </>
  );
}
