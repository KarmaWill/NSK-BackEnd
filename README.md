# NSK Horizon OS — 后台管理系统

界面按照设计稿 NSK-C-Lingo-OS-后台管理系统，便于在该基础上优化。
React + TypeScript 实现，包含数据仪表盘、AI 配置、课程管理、内容管理、用户与运营、系统配置等模块。

## 技术栈

- React 18 + TypeScript
- Vite 6
- 纯 CSS（与设计 HTML 一致的变量与样式）

## 开发

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

### 局域网访问（手机/平板同 WiFi 访问后台）

```bash
npm run dev:lan
```

启动后终端会显示 **Local** 与 **Network** 地址，例如：

- 本机：http://localhost:5173  
- 局域网：http://192.168.x.x:5173（以终端实际显示为准）

在手机或平板上用浏览器打开 **Network** 中的地址即可访问。

若运行 `npm run dev:lan` 时出现报错（如 `uv_interface_addresses` 等），多为本机 Node 获取网卡信息失败，可：

1. 先用 `npm run dev` 正常启动，在本机终端执行 `ifconfig`（Mac/Linux）或 `ipconfig`（Windows）查看本机 IP；
2. 将 vite 改为监听局域网：在 `vite.config.ts` 里把 `server.host` 改为 `'0.0.0.0'`，再运行 `npm run dev`，然后用手机浏览器访问 `http://<你的本机IP>:5173`。

## 构建

```bash
npm run build
npm run preview   # 预览构建结果
```

## 结构说明

- `src/components/` — 侧栏、顶栏、开关等通用组件
- `src/panels/` — 各功能面板（Dashboard、AI 角色、场景、评测、API、课程、词汇、HSK、文化、图书馆、用户、Premium、通知、系统配置）
- `src/types.ts` — 面板 ID 与导航文案
- 左侧导航切换面板，顶栏显示当前页标题与面包屑；交互（开关、标签、角色选择等）已接好
