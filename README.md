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
