# NSK-BackEnd 拼音规则（GB/T 16159）

> 版本：v1.0  
> 日期：2026-06-15  
> 适用：HSK 题目编辑后台、题库预览、R 系列/W 系列编辑器及含拼音字段的面板  
> 关联实现：`src/utils/pinyinUtils.ts`、`src/components/PinyinCountInput.tsx`、`src/components/PinyinRubyText.tsx`

---

## 1. 背景与目标

### 1.1 核心问题

旧逻辑常把拼音里的**空格**一律当作「一字一音节」分隔符（如 `péng you shì jiè`）。  
GB/T 16159-2012《汉语拼音正词法基本规则》要求：

- **词内连写**：`péngyou`、`shìjiè`
- **词间空格**：`péngyou shìjiè`

两种空格语义不同。若预览仍用 `pinyin.split(/\s+/)` 或逐字 ruby，会出现：

- 编辑器校验「音节数 / 汉字数」对不上
- 学员端预览把 `xiaoyu` 拆成 `xiao` / `yu` 两行，或整串拼音堆在句子下方

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 双模式兼容 | 词级连写（`xiaoyu jintian`）与字级分写（`xiao yu jin tian`）均可输入 |
| 存储不改写 | 编辑器 `value` 保持用户原始输入，仅在预览/校验时规范化 |
| 手动分词 | 中文词界由编辑者用**空格**标注，不做 NLP 自动分词 |
| 统一工具链 | 禁止在各组件重复实现拆分逻辑 |

### 1.3 数据流

```
编辑者输入（词级或字级拼音 + 可选中文空格分词）
        ↓
splitPinyinInput() / countHanWordSegments() / validatePinyinAlign()
        ↓
编辑器：PinyinCountInput（N 词 ✓ / N 音节 ✓）
预览：PinyinRubyText 或 buildPinyinRenderItems（word-ruby）
```

---

## 2. 黄金样例（验收标准）

### 2.1 词级对齐（推荐）

| 字段 | 内容 |
|------|------|
| 中文 | `小雨 今天 去 吃` |
| 拼音 | `xiaoyu jintian qu chi` |
| 编辑器 badge | `4 词 ✓` |
| 预览 | 4 组 **word-ruby**：`xiaoyu`↔小雨、`jintian`↔今天、`qu`↔去、`chi`↔吃 |

### 2.2 错误表现（必须避免）

- 预览显示整串 `xiaoyu jintian qu chi` 在句子下方（副标题式）
- 每个汉字上方单独一条拼音：`xiao` `yu` `jin` `tian`…（词被拆开）
- 编辑器显示 `7 音节 / 4 字 ✗`（把 `xiaoyu` 当成两个拼音词）

### 2.3 无中文空格时的兼容

中文连写 `小雨今天去吃` + 拼音 `xiaoyu jintian qu chi` 仍应通过 **音节数分组** 正确渲染（`splitPinyinWord('xiaoyu').length === 2` → 覆盖「小雨」）。

---

## 3. 编辑器规范

### 3.1 整句 / 段落拼音

使用 `PinyinCountInput`，**同时**传入：

```tsx
<PinyinCountInput
  value={pinyin}
  onChange={setPinyin}
  targetHanCount={countHanInText(text)}
  targetText={text}   // 有中文空格分词时必填
  placeholder="词级：xiaoyu jintian qu chi"
/>
```

- `targetText` 未传时，只能做「音节数 vs 汉字总数」校验，无法显示「N 词 ✓」
- 中文输入框 placeholder 应提示：**词间用空格分词**（如 `小雨 今天 去 吃`）

### 3.2 单词 / 选项拼音

使用 `PinyinInlineField` 或带 `isPinyinLike` 校验的 `<input>`，适用于单个词/选项，无需 `targetText`。

### 3.3 禁止

- 在 `onChange` 里自动改写用户拼音格式
- 仅用 `targetHanCount` 而不传 `targetText`（当句子含空格分词时）

---

## 4. 预览 / Ruby 渲染规范

### 4.1 禁止

```tsx
// ❌ 禁止：空格当音节
pinyin.split(/\s+/)

// ❌ 禁止：整串拼音当副标题
<span className="hsk-preview-r01-text-pinyin">{item.pinyin}</span>
```

### 4.2 必须

| 场景 | 组件 / 函数 |
|------|-------------|
| 句子级预览（R01/R02/R03 等） | `PinyinRubyText` |
| 含填空 token 的段落（R03/R05/R06） | `buildPinyinRenderItems` + `splitPinyinInput` |
| 解析区拼音预览 | `PinyinRubyText` |

### 4.3 对齐逻辑（与 `PinyinRubyText` 一致）

1. 若 `countHanWordSegments(text).segmentCount >= 2` **且** 与拼音空格词数相等 → **按中文词段与拼音词一一配对**
2. 否则 → 按 `splitPinyinWord` 得到的音节数，在汉字流上贪心分组
3. 多字词使用 **word-ruby** CSS：`hsk-preview-r05-word-ruby-wrap`（整词拼音在字组上方）

---

## 5. 必用工具（勿重复造轮子）

| 文件 | 导出 |
|------|------|
| `src/utils/pinyinUtils.ts` | `splitPinyinWord`, `splitPinyinInput`, `countHanInText`, `countHanWordSegments`, `validatePinyinAlign`, `isPinyinLike` |
| `src/components/PinyinCountInput.tsx` | `PinyinCountInput`, `PinyinInlineField`, `normalizePinyinToSyllables` |
| `src/components/PinyinRubyText.tsx` | `PinyinRubyText` |

---

## 6. 改完必查清单

- [ ] 样例 `小雨 今天 去 吃` + `xiaoyu jintian qu chi` → 4 组 word-ruby，非 7 组单字 ruby
- [ ] 编辑器 badge 为 `4 词 ✓`（非错误音节计数）
- [ ] 无中文空格 + 词级拼音仍能正确分组
- [ ] `rg 'pinyin\.split\(/\\s\+/\)' src/` 无用于 ruby 的新增用法（校验内拆词除外）
- [ ] 预览无裸 `{item.pinyin}` 整串展示（应走 `PinyinRubyText`）

---

## 7. 已知差距（维护时注意）

以下入口历史上易漏接，改动拼音相关功能时请一并检查：

| 位置 | 状态说明 |
|------|----------|
| `HskQuestionPreviewParts.tsx` · R01 | 部分仍用 `hsk-preview-r01-text-pinyin` 裸文本，应改为 `PinyinRubyText` |
| R02/R03 预览 | 已接 `PinyinRubyText` |
| R05/R06 `buildPinyinRenderItems` | 与 `PinyinRubyText` 为两套实现，词段模式需保持行为一致 |
| 各 `*Editor.tsx` | 确认 `PinyinCountInput` 均传 `targetText={...}` |

---

## 8. 给 AI 的一劳永逸 Prompt（复制即用）

将下方整段粘贴到新对话或 Cursor Rule，并在末尾填写本次改动范围。

---

```markdown
## NSK-BackEnd 拼音规则（GB/T 16159 · 必遵守）

### 背景
本项目拼音遵循 GB/T 16159：词内连写、词间空格。编辑者输入与学员端 ruby 预览必须一致。
禁止把拼音空格一律当作「一字一音节」。

### 数据约定（黄金样例）
- 中文：`小雨 今天 去 吃`（词间用空格，由编辑者手动分词，不做 NLP 自动分词）
- 拼音：`xiaoyu jintian qu chi`（词间空格；词内连写 xiaoyu=2 音节覆盖「小雨」）
- 预览：多字词显示 **word-ruby**（整词拼音在字组上方），禁止 xiao/yu/jin/tian 逐字拆开

### 编辑器
- 整句/段落拼音字段必须用 `<PinyinCountInput>`，且同时传入：
  - `targetHanCount={countHanInText(text)}`
  - `targetText={text}`  ← 有中文空格分词时必填，否则无法显示「N 词 ✓」
- placeholder 示例：`词级：xiaoyu jintian qu chi`
- 中文 placeholder 提示编辑者词间加空格
- 存储层保持用户原始输入，不在 onChange 里改写 value

### 预览 / Ruby 渲染
- 禁止：`pinyin.split(/\s+/)` 直接当逐字音节数组
- 禁止：在汉字下方单独显示整串拼音字符串（如 `hsk-preview-r01-text-pinyin` 裸文本）
- 必须：使用已有工具链之一
  - `PinyinRubyText`（R01/R02/R03 等句子级预览）
  - `buildPinyinRenderItems` + `splitPinyinInput`（R03/R05/R06 含填空 token）
- 对齐逻辑：
  1. 若 `countHanWordSegments(text).segmentCount >= 2` 且与拼音空格词数相等 → **按词段一一配对**
  2. 否则 → 按 `splitPinyinWord` 音节数在汉字流上贪心分组
- 多字词 CSS：`hsk-preview-r05-word-ruby-wrap`（整词拼音在上）

### 必用工具（不要重复造轮子）
- `src/utils/pinyinUtils.ts`：`splitPinyinWord`, `splitPinyinInput`, `countHanWordSegments`, `validatePinyinAlign`
- `src/components/PinyinCountInput.tsx`
- `src/components/PinyinRubyText.tsx`
- 详细说明见 `docs/PINYIN_GB_T_16159_RULES.md`

### 改完必查
1. 样例 `小雨 今天 去 吃` + `xiaoyu jintian qu chi` → 预览 4 组 word-ruby，不是 7 组单字 ruby
2. 编辑器 badge 显示 `4 词 ✓`（不是错误的「7 音节 / 4 字 ✗」）
3. 词内连写无中文空格时（如 `小雨今天去吃` + `xiaoyu jintian qu chi`）仍能通过音节数正确分组
4. grep 确认新代码无 `pinyin.split(/\s+/)` 用于 ruby（`validatePinyinAlign` 内拆词除外）

### 本次改动范围
[在这里填：例如 R01 预览、R03 编辑器、某 panel…]
```

---

## 9. 参考

- 原计划：`.cursor/plans/pinyin_gb_t_16159_adaptation_0230231a.plan.md`
- 音节表与贪心拆分：`src/utils/pinyinUtils.ts` · `SYLLABLE_BASES`
