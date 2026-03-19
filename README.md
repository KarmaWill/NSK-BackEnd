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

### 局域网版本（同 WiFi 下手机 / 平板访问）

开发机与设备需在同一局域网；先执行一次 `npm install` 以安装 `cross-env`（Windows / Mac / Linux 通用）。

```bash
npm run dev:lan
```

- 使用环境变量 **`LAN=1`**，Vite 监听 **`0.0.0.0`**（与仅本机的 `npm run dev` 区分）。
- 终端会显示 **Local** 与 **Network**；本机用 `http://localhost:5173`，其它设备用 **`http://<本机局域网IP>:5173`**（端口以终端为准）。

预览构建产物也可用局域网：

```bash
npm run build
npm run preview:lan
```

若启动仍报错（如 `uv_interface_addresses`），多为本机 Node 读取网卡失败，可：

1. 用 `npm run dev` 仅本机开发；
2. 查本机 IP：`ifconfig`（Mac/Linux）或 `ipconfig`（Windows），若本机已用 `0.0.0.0` 监听，可直接在手机浏览器试 `http://<IP>:5173`。

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
