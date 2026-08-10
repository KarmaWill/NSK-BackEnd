# NSK-BackEnd — 后台管理前端

运营人员配置产品内容的管理台。包名 `nsk-horizon-admin`。

## 技术栈

React + Vite + TypeScript。客户已于 2026-07-13 确认这是本期管理台的代码基线,**不迁移到 Vue 3**,尽管外包规范文档里写的是 Vue。

## 启动

```bash
npm ci
npm run dev        # → http://localhost:5173/
npm run dev:lan    # 监听 0.0.0.0,供同网段设备访问
```

需要 Node 18+。

## 接口代理

`vite.config.ts` 的 dev/preview 都配了代理:

| 路径 | 目标 |
|---|---|
| `/admin`、`/files` | `http://localhost:8081`(Java 管理端 API) |
| `/api/exams` | `http://localhost:8082`(Java 平板端 API) |
| `/api`、`/uploads` | `http://localhost:3000`(旧 Node 后端) |

注意 `/api` 兜底仍指向 3000。如果发现某个接口行为诡异,先确认它命中的是哪条代理规则。

## 本地联调配置

根目录需要 `.env.local`(已存在,**不要提交**):

```dotenv
VITE_DEV_SKIP_AUTH=1
VITE_CLINGO_AUTH_HEADER=X-Clingo-Dev-Key
VITE_CLINGO_DEV_KEY=dev-local-key
```

页面报 `UNAUTHORIZED` 时:确认这个文件存在并重启 dev server。**不要关闭后端鉴权来绕过。**

页面显示「API 断开」时:先查 8081 健康检查,再查代理配置,不要先改前端代码。

## 测试与构建

```bash
npm run test:frontend-unit
npm run build      # tsc -b && vite build
```

## 一期业务约束

- 只管理 HSK1、HSK2,不出现 HSK3-6、快乐中文或自定义考试分类
- 单管理员模式,固定 `admin`,不建用户表、角色权限或数据隔离
- 题型固定 9 种:`L01` `L02` `L03` `R01` `R02` `R03` `R07` `W01` `W02`
- 官方模板只读;自定义模板只能从官方模板复制后编辑

## 两种计分模式(0724 新增)

| 模板类型 | 模式 | 规则 |
|---|---|---|
| 官方模板 | `equal_ratio` | 不显示单题分值;按「答对计分题数 ÷ 计分题总数 × 总分」,**只四舍五入一次** |
| 自定义模板 | `per_item` | 各 section「计分题量 × 单题分值」累加 |

示例题固定 0 分,不计入题量、分母和题号。题型卡片上显示的题量是**计分题数**,不含示例题。

## 发布语义

管理台发布试卷后立即对平板可见,后端自动维护内部考试实体和 delivery 包,**不需要第二次「发布考试」操作**。

## 数据安全

测试库里有客户的正式样题。需要写操作时用明确标记的临时测试数据,并在报告中记录;不要为了测试删除既有样题。
