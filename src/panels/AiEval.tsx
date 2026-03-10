import { Toggle } from '../components/Toggle';

export function AiEval() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">发音评测设置</div>
          <div className="page-subtitle">配置语音引擎、评分维度权重与阈值</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">发音评测参数</div></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label>评测引擎</label>
                <select defaultValue="web">
                  <option value="web">Web Speech API (原生)</option>
                  <option value="azure">Azure Cognitive Services</option>
                  <option value="google">Google Cloud Speech</option>
                  <option value="xunfei">科大讯飞</option>
                </select>
              </div>
              <div className="form-group">
                <label>语言模型</label>
                <select defaultValue="zh-CN">
                  <option value="zh-CN">zh-CN (普通话)</option>
                  <option value="zh-TW">zh-TW (繁体)</option>
                  <option value="zh-HK">zh-HK (粤语)</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, marginTop: 6 }}>评分维度权重</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '声调准确度', val: 40 },
                { label: '声母准确度', val: 30 },
                { label: '韵母准确度', val: 20 },
                { label: '流利度', val: 10 },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-8" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.95rem', width: 100 }}>{label}</span>
                  <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${val}%` }} /></div>
                  <input type="number" defaultValue={val} min={0} max={100} style={{ width: 60, padding: '8px 10px', fontSize: '0.95rem' }} />
                  <span className="text-muted text-sm">%</span>
                </div>
              ))}
            </div>

            <hr className="divider" />
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>评分阈值</div>
            <div className="form-row">
              <div className="form-group"><label>优秀 (Excellent) ≥</label><input type="number" defaultValue={90} /></div>
              <div className="form-group"><label>良好 (Good) ≥</label><input type="number" defaultValue={80} /></div>
              <div className="form-group"><label>及格 (Pass) ≥</label><input type="number" defaultValue={60} /></div>
              <div className="form-group"><label>最大录音时长 (秒)</label><input type="number" defaultValue={30} /></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">语法纠错配置</div></div>
          <div className="card-body">
            <div className="form-group mb-16">
              <label>纠错触发方式</label>
              <select defaultValue="realtime">
                <option value="realtime">实时纠错（输入完成后）</option>
                <option value="on-demand">按需纠错（用户主动请求）</option>
                <option value="submit">提交后纠错</option>
              </select>
            </div>

            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>纠错检测项</div>
            <div className="toggle-row">
              <div><div className="toggle-label">量词错误</div><div className="toggle-desc">一杯/一个/一只等量词搭配检测</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">词序错误</div><div className="toggle-desc">主谓宾语序检测</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">声调标注建议</div><div className="toggle-desc">在纠错时附上拼音声调</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">例句展示</div><div className="toggle-desc">纠错时提供1-2个正确例句</div></div>
              <Toggle defaultOn />
            </div>
            <div className="toggle-row">
              <div><div className="toggle-label">文化背景解释</div><div className="toggle-desc">涉及文化差异时附加说明</div></div>
              <Toggle defaultOn={false} />
            </div>

            <hr className="divider" />
            <div className="form-group">
              <label>纠错 AI 模型温度 (Temperature)</label>
              <input type="number" defaultValue={0.3} step={0.1} min={0} max={1} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <button type="button" className="btn btn-primary">💾 保存评测配置</button>
      </div>
    </>
  );
}
