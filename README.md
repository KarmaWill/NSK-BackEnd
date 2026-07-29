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

### Java MVP 本地联调

阶段 8 起，考试与测评相关的前端 service 默认通过 Vite 代理访问 Java 后端：

Java 后端已拆分到兄弟仓库 `../Clingo-Backend/`。本仓库只承载管理台前端；Java 构建、DDL、OpenSpec 和 HSK 测试数据工具均以后端仓库为准。

- `/admin/**` -> `clingo-admin`：`http://localhost:8081`
- `/api/exams/**` -> `clingo-api`：`http://localhost:8082`
- `/files/**` -> `clingo-admin` 文件预览：`http://localhost:8081`
- 其他 legacy `/api/**` 仍走旧后端：`http://localhost:3000`

启动 Java 服务时设置的 `CLINGO_DEV_API_KEY`，前端用同值传入：

```bash
VITE_CLINGO_DEV_KEY=dev-local-key npm run dev
```

`dev-local-key` 只用于 Vite 开发模式的本地联调。生产构建不会读取或发送
`VITE_CLINGO_DEV_KEY`，也不会把固定密钥注入浏览器前端。

### 客户内网生产模式

客户生产环境由内网和网关控制服务访问时，管理台使用可信内网模式，不显示自身登录页，也不向 Java 服务发送开发密钥：

```bash
npm run build
```

可信内网模式和网关路径已经固化在 `.env.production`。前端与网关同源部署时无需配置 API base URL；如果由不同域名承载，再通过 `VITE_CLINGO_ADMIN_API_BASE_URL` 和 `VITE_CLINGO_EXAM_API_BASE_URL` 指向客户网关。两个 Java 服务的 `application-prod.yml` 已默认关闭应用层鉴权，生产启动时启用 `prod` profile 即可。

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
