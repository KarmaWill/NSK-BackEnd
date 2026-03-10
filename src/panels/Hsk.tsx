import { useState } from 'react';
import { Toggle } from '../components/Toggle';

const levels = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'];

export function Hsk() {
  const [activeLevels, setActiveLevels] = useState<Set<number>>(new Set([0, 1]));

  const toggleLevel = (i: number) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">HSK 考试配置</div>
          <div className="page-subtitle">配置 HSK 级别范围、模拟考参数与拼音图表</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">HSK 模拟考配置</div></div>
          <div className="card-body">
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>启用 HSK 等级</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {levels.map((lvl, i) => (
                <div
                  key={lvl}
                  className={`level-btn ${activeLevels.has(i) ? 'active' : ''}`}
                  onClick={() => toggleLevel(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleLevel(i)}
                >
                  {lvl}
                </div>
              ))}
            </div>
            <div className="form-row">
              <div className="form-group"><label>模拟考时长（分钟）</label><input type="number" defaultValue={35} /></div>
              <div className="form-group"><label>题目总数</label><input type="number" defaultValue={40} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>及格分数线</label><input type="number" defaultValue={60} /></div>
              <div className="form-group"><label>优秀分数线</label><input type="number" defaultValue={85} /></div>
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">显示倒计时</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">答题板显示</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">Premium 专属</div><div className="toggle-desc">开启后仅Premium用户可参加模拟考</div></div>
              <Toggle defaultOn />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">拼音图表 & 汉字实验室</div></div>
          <div className="card-body">
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>拼音图表 (/pinyin-chart)</div>
            <div className="toggle-row">
              <div><div className="toggle-label">声调动效演示</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">点击朗读功能</div></div>
              <Toggle defaultOn />
            </div>
            <hr className="divider" />
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>汉字精练室 (Hanzi Lab) — Premium</div>
            <div className="toggle-row">
              <div><div className="toggle-label">字源溯源展示</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">书法临摹模式</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">笔顺动画</div></div>
              <Toggle defaultOn={false} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button type="button" className="btn btn-primary">💾 保存 HSK 配置</button>
      </div>
    </>
  );
}
