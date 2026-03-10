import { Toggle } from '../components/Toggle';

const items = [
  { label: '每日学习提醒', desc: '在设定时间推送学习提醒' },
  { label: '连续学习奖励通知', desc: '用户达成连续学习里程碑时发送奖励通知' },
  { label: '新课程上线通知', desc: '有新单元发布时通知所有用户' },
  { label: 'Premium 到期提醒', desc: '' },
];

export function Notify() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">通知推送</div>
          <div className="page-subtitle">配置各类学习通知的开关</div>
        </div>
      </div>
      <div className="card">
      <div className="card-header"><div className="card-title">通知推送配置</div></div>
      <div className="card-body">
        {items.map((item, i) => (
          <div key={item.label} className="toggle-row">
            <div><div className="toggle-label">{item.label}</div>{item.desc && <div className="toggle-desc">{item.desc}</div>}</div>
            <Toggle defaultOn={i < 3} />
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
