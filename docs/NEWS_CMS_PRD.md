# C-Lingo 官网 · 新闻 CMS 后台配置 — 产品需求（PRD）

> 版本：v0.1  
> 日期：2026-05-31  
> 适用渠道：`hsk_web`（C-Lingo 官网）  
> 后台入口：NSK-BackEnd → 侧栏「C-Lingo 官网」→ **新闻配置**  
> 关联项目：`C-Lingo官网`（消费端）、`c-lingo-cms-backend`（API）

---

## 1. 背景与目标

### 1.1 背景

C-Lingo 官网新闻目前分布在 **四层 UI**（源码：`C-Lingo官网/index.html`）：

| 官网位置 | DOM / 路由 | 布局要点 |
|---------|------------|----------|
| 首页预览 | `#home-news-grid` | 3 列卡片：封面图 + 日期/分类 + 标题 + 摘要 |
| 新闻列表页 | `#page-news` | 顶部 Hero + **1 条 Featured 大图** + 下方 3 列卡片网格 |
| 新闻详情页 | `#page-news-article*` | 返回按钮、Hero（日期 + 标题）、头图、正文（h2 / 段落 / 列表 / 引用 / 插图） |
| 导航 | `goTo('news')` / `goTo(slug)` | 单页应用内切换，依赖每条新闻的 `slug` |

### 1.2 现状（MVP，2026-05-31）

| 层级 | 状态 |
|------|------|
| **API** | `CmsNews` 表 + `/api/cms/news` CRUD 已上线 |
| **后台** | `NewsConfig.tsx` 支持基础新建/编辑/发布/删除 |
| **官网** | **仅首页** `#home-news-grid` 通过 `js/clingo-cms.js` 动态加载；列表页 Featured、详情正文仍为静态 HTML |

当前后台字段：`title`、`summary`、`body`、`imageUrl`、`category`、`slug`、`sortOrder`、`status`、`publishedAt`。

### 1.3 目标

运营在 NSK-BackEnd 完成 **「创建 → 预览 → 发布 → 官网全链路展示」**，无需开发人员修改 `index.html`。

### 1.4 非目标（本期不做）

- 多语言正文版本（第一版界面与内容均为英文，与全站规则一致）
- 评论、SEO A/B 测试、个性化推荐
- 与平板 App（`tablet_app`）共用新闻流

---

## 2. 用户与场景

| 角色 | 典型场景 |
|------|----------|
| 运营 / 市场 | 发布 Press Release、活动报道、品牌故事 |
| 管理员 | 审核、上下线、调整首页/列表置顶与 Featured |
| 研发（联调） | 确认字段与官网组件一一对应，验收 API 契约 |

---

## 3. 官网布局 → 数据字段映射（UI 契约）

### 3.1 卡片层（首页 + 列表页网格共用）

对应官网 CSS 类：`.news-card`

| 官网展示 | 建议字段 | 规则 |
|---------|---------|------|
| 封面图 | `coverImageUrl` | 必填；支持媒体库上传或 URL；建议比例 16:9 |
| 日期行 `May 23, 2026 · Press Release` | `publishedAt` + `category` | 英文日期格式；分类见 §3.5 |
| 标题 `h4` | `cardTitle` | 必填；卡片/列表用；建议 ≤120 字符 |
| 摘要 `p` | `summary` | 必填；2–3 行；建议 ≤280 字符 |
| 点击跳转 | `slug` | 必填、同产品下唯一；如 `news-article-vietnam` → `goTo(slug)` |

> **与现 API 差异：** 现用单一 `title`。建议拆分为 `cardTitle`（卡片短标题）与 `heroTitle`（详情页 H1，可更长、可不同）。

### 3.2 列表页 Featured 头条（`.featured-article`）

官网列表页独有：**1 条大图 + 角标 + Read More**。

| 官网展示 | 建议字段 | 规则 |
|---------|---------|------|
| 是否 Featured | `displaySlots` 含 `FEATURED` | 同一 `productId` 下**同时仅 1 条** Featured |
| Featured 角标 | `featuredBadge` | 如 `Launch Event`；可选 |
| Featured 封面 | `coverImageUrl` 或 `featuredImageUrl` | 可复用卡片图或使用更宽大图 |
| Read More | 同 `slug` | 跳转详情 |

Featured 与首页 3 卡、列表网格**独立配置**，避免排序冲突。

### 3.3 详情页（`.article-hero` + `.article-content`）

| 官网展示 | 建议字段 | 规则 |
|---------|---------|------|
| Hero 标题 `h1` | `heroTitle` | 默认同 `cardTitle`，可覆盖（例：卡片短、详情长） |
| Hero 日期行 | `publishedAt` + `category` | 同卡片 |
| 头图 `.article-lead-img` | `heroImageUrl` | 默认同 `coverImageUrl` |
| 正文 | `body` | 富文本或 Markdown；支持 h2、p、ul、figure、blockquote |
| 文内插图 | 正文内嵌 | P2 可考虑 `gallery[]` |

**特殊交互（官网已有）：**  
部分头图使用 `launch-reveal-img`，支持悬停切换双图：

- `coverImageUrl` — 默认图（`data-src-before`）
- `coverImageHoverUrl` — 悬停图（`data-src-after`，可选）

### 3.4 展示范围（出现在哪些页面）

| 枚举值 | 含义 |
|--------|------|
| `HOME_GRID` | 首页 `#home-news-grid`（前端取前 3 条，按 `sortOrder`） |
| `NEWS_LIST` | 新闻列表页 `#page-news` 下方网格 |
| `FEATURED` | 列表页顶部 Featured 大图区 |
| （组合） | 一条新闻可同时勾选多个 slot |

现 API 仅有 `sortOrder`，**需扩展 `displaySlots: string[]`**（或等价位标志）。

### 3.5 分类（category）建议枚举

与官网静态内容对齐，支持下拉 + 自定义：

| 值 | 官网示例 |
|----|----------|
| Press Release | May 23, 2026 · Press Release |
| Event Report | Education Vietnam 2026 |
| Brand Story | Clarity. Confidence. Connection. |
| Team Spotlight | February 2026 · Team Spotlight |

---

## 4. 后台功能需求（NSK-BackEnd · 新闻配置）

### 4.1 信息架构

```
新闻配置（hsk_web）
├── 新闻列表（默认 Tab）
├── 新建 / 编辑（侧栏抽屉或独立路由）
└── 列表页设置（P1：Hero 标题/副标题文案）
```

### 4.2 新闻列表页（P0）

**表格列：** 封面缩略图、卡片标题、分类、状态、发布日期、展示位（Home / Featured / List）、排序权重

**筛选：** 状态（草稿 / 已发布）、分类、标题关键词

**行操作：**

| 操作 | 说明 |
|------|------|
| 编辑 | 打开编辑表单 |
| 发布 / 下线 | 切换 `status` |
| 删除 | 二次确认 |
| 预览 | P1：模拟卡片 / Featured / 详情 |
| 排序 | 上移/下移或拖拽（更新 `sortOrder`） |

**业务规则：**

- 设置新 Featured 时，若已有 Featured，提示「将替换当前 Featured：XXX」
- 首页网格仅展示 `HOME_GRID` + `PUBLISHED`，最多取 3 条
- 草稿不对官网公开接口可见

### 4.3 编辑表单

#### P0（必须）

| 字段 | 控件 | 校验 |
|------|------|------|
| 卡片标题 `cardTitle` | 单行输入 | 必填 |
| 摘要 `summary` | 多行文本 | 必填 |
| 分类 `category` | 下拉 + 自定义 | 建议必填 |
| 发布日期 `publishedAt` | 日期选择 | 发布时必填 |
| Slug | 自动生成 + 可编辑 | 必填、唯一 |
| 封面图 `coverImageUrl` | URL 或媒体库 | 必填 |
| 展示范围 `displaySlots` | 多选 checkbox | 至少选一项 |
| 状态 | 草稿 / 已发布 | — |

#### P1（增强）

| 字段 | 控件 |
|------|------|
| 详情标题 `heroTitle` | 单行；默认同卡片标题 |
| 正文 `body` | 富文本（h2、列表、引用、插图） |
| Featured 角标 `featuredBadge` | 仅勾选 Featured 时显示 |
| Hover 第二图 `coverImageHoverUrl` | 可选 |
| 详情头图 `heroImageUrl` | 默认同封面 |

#### P2（后续）

- 定时发布 `scheduledPublishAt`
- 列表页 Hero 文案（`News & Updates` 标题与副标题）独立配置
- 多语言字段（与全站 i18n 策略统一）

### 4.4 预览（P1，强烈建议）

| 预览类型 | 说明 |
|---------|------|
| 卡片预览 | 模拟 `.news-card` 在首页宽度下的效果 |
| Featured 预览 | 模拟列表页大图 + 角标 |
| 详情预览 | 模拟 `article-hero` + 正文区 |
| 线上预览（可选） | `?previewNews={id}&token=...` 仅管理员可见草稿 |

### 4.5 与媒体库联动（P1）

- 封面 / 头图从「资源库 medialib」选取，避免手填 `assets/...` 相对路径
- 上传后写入 CDN / 静态资源 URL 至 API
- 图片 alt 文本字段 `imageAlt`（无障碍与 SEO）

---

## 5. API 需求（c-lingo-cms-backend 扩展）

在现有 `/api/cms/news` 基础上扩展。

### 5.1 数据模型建议

```text
CmsNews {
  // 现有
  id, productId, summary, body, category, slug, linkUrl,
  sortOrder, status, publishedAt, createdAt, updatedAt

  // 建议新增 / 调整
  cardTitle      String      // 原 title 迁移
  heroTitle      String?     // 详情 H1
  coverImageUrl  String?     // 原 imageUrl 语义明确化
  coverImageHoverUrl String?
  heroImageUrl   String?
  featuredBadge  String?
  imageAlt       String?
  displaySlots   String[]    // HOME_GRID | NEWS_LIST | FEATURED
  bodyFormat     String      // html | markdown，默认 html
}
```

### 5.2 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cms/news?productCode=hsk_web` | 公开：仅 `PUBLISHED` |
| GET | `/api/cms/news?productCode=hsk_web&admin=1` | 管理员：含草稿 |
| GET | `/api/cms/news?slot=HOME_GRID&limit=3` | 首页 3 卡 |
| GET | `/api/cms/news?featured=1` | 列表 Featured |
| GET | `/api/cms/news/by-slug/{slug}?productCode=hsk_web` | 详情页（P1） |
| POST | `/api/cms/news` | 创建（管理员） |
| PATCH | `/api/cms/news/{id}` | 更新（管理员） |
| DELETE | `/api/cms/news/{id}` | 删除（管理员） |

### 5.3 服务端校验

- 同一 `productId` 下 `slug` 唯一
- 同时最多 **1 条** `displaySlots` 含 `FEATURED` 的已发布新闻
- `HOME_GRID` 已发布条目建议上限 6 条（前端只渲染 3）
- 发布时：`cardTitle`、`summary`、`coverImageUrl`、`slug` 不可为空

---

## 6. 官网消费端需求（C-Lingo官网）

| 页面 | P0 | P1 |
|------|----|----|
| 首页 `#home-news-grid` | ✅ 已实现（基础） | 按 `slot=HOME_GRID` 过滤；尊重 `sortOrder` |
| 列表 `#page-news` Featured + 网格 | 动态渲染 | Hero 文案可配置 |
| 详情 `#page-news-article*` | — | 按 `slug` 调 API 渲染 `heroTitle` + `body` |
| 路由 | `goTo(slug)` | 通用 slug 路由，逐步移除静态 article 页 |

**降级策略：** API 请求失败时保留现有静态 HTML 内容，不白屏（`clingo-cms.js` 已实现思路，列表/详情需同样处理）。

**脚本依赖链：** `api-config.js` → `clingo-api.js` → `clingo-cms.js`

---

## 7. 验收标准（Acceptance Criteria）

### AC1 · 首页

- [ ] 后台发布 3 条并勾选「首页展示（HOME_GRID）」→ 官网首页 News 区块显示 3 张卡片，顺序与 `sortOrder` 一致
- [ ] 下线（改为草稿或取消 HOME_GRID）后，首页不再显示该条

### AC2 · 新闻列表页

- [ ] 设置 1 条 Featured → `#page-news` 大图区展示该条，角标与摘要正确
- [ ] 网格展示其余 `NEWS_LIST` 已发布条目
- [ ] 同时只能有 1 条 Featured；替换时旧 Featured 自动取消或提示确认

### AC3 · 详情页（P1）

- [ ] 点击卡片进入详情，`heroTitle` 与 `body` 与后台编辑一致
- [ ] 「← Back to News」返回列表正常
- [ ] 支持 h2、段落、列表、引用等基础排版

### AC4 · 运营效率

- [ ] 新建一条新闻从创建到发布 ≤ 5 分钟（含选图）
- [ ] 全程无需修改 `index.html` 或重新部署静态文案

### AC5 · 权限与安全

- [ ] 仅 `ADMIN` 可写 CMS
- [ ] 公开 GET 仅返回 `status=PUBLISHED`
- [ ] 草稿预览 URL（若有）需 token 校验

---

## 8. 分期与优先级

| 阶段 | 范围 | 预估 | 完成度（2026-05-31） |
|------|------|------|----------------------|
| **P0** | 字段补全（cardTitle/heroTitle/displaySlots/featuredBadge）+ 列表页 Featured/网格动态化 + 后台表单与排序 | 1–2 周 | ~30%（仅首页 3 卡 + 基础 CRUD） |
| **P1** | 富文本正文 + 详情页 API 化 + 预览 + 媒体库选图 | 1–2 周 | 未开始 |
| **P2** | 定时发布、SEO 字段、多语言、列表 Hero 文案配置 | 待定 | 未开始 |

### P0 任务拆分（建议研发顺序）

1. **API**：扩展 `CmsNews` schema + migration + 查询参数 `slot` / `featured` / `by-slug`
2. **后台**：`NewsConfig` 表单增加展示位、Featured 角标、双标题；列表支持排序
3. **官网**：`clingo-cms.js` 渲染 `#page-news` Featured + 网格；首页改走 `slot=HOME_GRID`
4. **联调**：按 §7 验收；更新 `CLINGO_STACK_MEMO.md` §8 映射表

---

## 9. 与现有代码的对照

| 组件 | 路径 | 本 PRD 关系 |
|------|------|-------------|
| 后台面板 | `src/panels/NewsConfig.tsx` | P0 迭代主文件 |
| API 客户端 | `src/lib/api.ts` → `listCmsNews` 等 | 随 API 扩展类型与方法 |
| 官网渲染 | `C-Lingo官网/js/clingo-cms.js` | 扩展列表/详情渲染 |
| 数据模型 | `c-lingo-cms-backend/prisma/schema.prisma` → `CmsNews` | 字段扩展 |
| 全栈备忘 | `c-lingo-cms-backend/CLINGO_STACK_MEMO.md` | 打通状态同步更新 |

---

## 10. 一句话 Brief（给研发）

> 以官网 `index.html` 中 **`.news-card` / `.featured-article` / `.article-content`** 三类组件为 UI 契约，扩展 `CmsNews` 与 `NewsConfig`，使运营可配置「首页 3 卡 + 列表 Featured + 详情正文」，通过 `slug` 驱动 `goTo()`；发布后对 `c-lingo.vercel.app` 可见，无需改 HTML。

---

## 附录 A · 官网静态示例对照

| slug | 卡片标题（示例） | 用途 |
|------|-----------------|------|
| `news-article` | C-Lingo AIOS Launch… | 列表 Featured + 首页第 1 卡 |
| `news-article-vietnam` | Education Vietnam 2026 | 网格卡 |
| `news-article-values` | Clarity. Confidence. Connection. | 网格卡 |
| `news-article-interview` | Beyond the Classroom… | 仅列表页（首页静态未含） |

Seed 数据见 `c-lingo-cms-backend/prisma/seed.js`（已写入 3 条 PUBLISHED 示例）。

---

## 附录 B · 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-05-31 | 初稿：基于官网布局反推后台 CMS 需求 |
