import { Toggle } from '../components/Toggle';

export function SysConfig() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">系统设置</div>
          <div className="page-subtitle">用户权限、系统配置、数据备份与版本信息</div>
        </div>
      </div>
      <div className="grid-2">
      <div className="card">
        <div className="card-header"><div className="card-title">系统基础配置</div></div>
        <div className="card-body">
          <div className="form-group mb-16">
            <label>产品名称</label>
            <input type="text" defaultValue="NSK Horizon OS — 字灵大陆" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>默认界面语言</label>
              <select defaultValue="bilingual"><option value="bilingual">中文 / EN 双语</option><option value="en">仅英文</option></select>
            </div>
            <div className="form-group">
              <label>默认屏幕尺寸</label>
              <select defaultValue="1024"><option value="1024">1024×768</option><option value="960">960×540</option><option value="1920">1920×1125</option></select>
            </div>
          </div>
          <div className="form-group mb-16">
            <label>下载中心基础 URL</label>
            <input type="text" placeholder="https://cdn.nsk.com/packs/" />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">OCR 相机功能</div></div>
            <Toggle defaultOn />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">每日增益 (/daily-gains)</div></div>
            <Toggle defaultOn />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">学习报告 (/study-report)</div></div>
            <Toggle defaultOn />
          </div>
          <div className="toggle-row">
            <div><div className="toggle-label">维护模式</div><div className="toggle-desc">开启后用户看到维护页面</div></div>
            <Toggle defaultOn={false} />
          </div>
          <hr className="divider" />
          <button type="button" className="btn btn-primary">💾 保存系统配置</button>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div className="card-title">📦 版本信息</div></div>
        <div className="card-body">
          <table>
            <tbody>
              <tr><td className="text-muted" style={{ width: 140 }}>产品版本</td><td className="font-mono font-bold">v1.0.0</td></tr>
              <tr><td className="text-muted">打包日期</td><td className="font-mono">2026-01-27</td></tr>
              <tr><td className="text-muted">前端框架</td><td className="font-mono">React 18.3.1 + TypeScript</td></tr>
              <tr><td className="text-muted">构建工具</td><td className="font-mono">Vite 7.3.1</td></tr>
              <tr><td className="text-muted">路由</td><td className="font-mono">React Router 6.20.0</td></tr>
              <tr><td className="text-muted">状态管理</td><td className="font-mono">Redux + Zustand</td></tr>
              <tr><td className="text-muted">UI 库</td><td className="font-mono">MUI v5.14.20</td></tr>
              <tr><td className="text-muted">JS Bundle</td><td className="font-mono">738 KB</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
