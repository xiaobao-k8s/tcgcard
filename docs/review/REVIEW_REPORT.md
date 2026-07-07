# 审查报告: T1 + T2 实现

> 审查范围: T1 (项目初始化) + T2 (数据层搭建)
> 审查日期: 2026-07-06
> 审查人: review-agent

---

## 总体评价: **通过（含改进建议）**

T1 + T2 实现基本符合架构文档和任务要求，项目结构清晰，类型定义完整，功能验收标准已达成。未发现阻塞性问题，但有若干值得改进的点。

---

## 1. 正确性

### 通过项
- [x] Next.js 14 + App Router + TypeScript 项目结构正确
- [x] SSG 静态导出配置正确 (`output: "export"`)
- [x] Tailwind CSS 4 使用 CSS `@theme` 指令配置（非旧版 config 文件方式）
- [x] YAML 数据加载函数 `loadCards()` 能正确读取 `data/gen{1,2}/*.yaml`
- [x] `getCardById()` 按 ID 查询正确
- [x] `filterCards()` 支持代际/属性/稀有度/搜索词筛选
- [x] `getAttributes()` / `getRarities()` 正确提取唯一值
- [x] 示例 YAML 数据结构与 `Card` 接口一致
- [x] 首页展示所有卡片 + 详情页展示单卡数据

### 问题

**P2 - [MED] `filterCards` 和 `getAttributes` 等函数每次都重新读取文件系统**

`src/lib/cards.ts` 中 `loadCards()` 被 `filterCards()`、`getAttributes()`、`getRarities()` 分别调用，每次都会重新 `fs.readdirSync` + `fs.readFileSync`。在 SSG 构建时影响有限（数据量小），但代码逻辑上有重复。

建议：在模块顶层缓存一次 `loadCards()` 结果，或使用 memoization。

```typescript
// 当前（重复读取）
export function getAttributes(): string[] {
  const cards = loadCards(); // 每次调用都读磁盘
  ...
}
```

**P3 - [LOW] `generateStaticParams` 在 Next.js 14 App Router 中 params 类型定义不够精确**

`src/app/[cardId]/page.tsx` 第 5-7 行的 `PageProps` 中 `params` 类型为 `{ cardId: string }`。Next.js 14 中 `params` 是一个 Promise，但代码直接解构使用。在当前版本中可能正常工作，但在 Next.js 15 中将报错。

建议：如果后续考虑升级 Next.js 15，需要改为 `await params`。当前版本可接受。

---

## 2. 架构一致性

### 通过项
- [x] 目录结构与架构文档一致：`src/app/`, `src/components/`, `src/lib/`, `data/`, `scripts/`
- [x] 色彩系统与架构文档中定义的一致（`globals.css` 中的 `@theme` 值完全匹配）
- [x] 数据类型 `Card`、`CardBack` 与架构文档定义一致

### 问题

**P2 - [MED] 缺失架构文档中列出的组件**

架构文档中列出的组件在 `src/components/` 下尚未创建：
- `CardCircle.tsx` (架构要求，首页用圆形卡片展示)
- `CardDetail.tsx` (架构要求，详情页组件)
- `LenticularFlip.tsx` (架构要求，光栅翻转动画)
- `EvolutionChain.tsx` (架构要求，进化链导航)
- `RarityBadge.tsx` (架构要求，稀有度标签)
- `FilterBar.tsx` (架构要求，筛选栏)

当前首页和详情页的逻辑直接写在 `page.tsx` 中，没有拆分到独立组件。这在 T1+T2 阶段可以接受（最小可用），但 T3+T4 实现时需要补齐。

**P2 - [MED] 缺失架构文档中的页面**

架构文档中定义的页面：
- `src/app/evolution/page.tsx` - 未创建
- `src/app/rarity/page.tsx` - 未创建
- `src/app/battle-rules/page.tsx` - 未创建

这些属于 T5-T7 的范围，不影响 T1+T2 验收。

**P3 - [LOW] `src/lib/cards.ts` 中重复了 `scripts/build-data.ts` 的数据加载逻辑**

两个文件各自实现了一套 YAML 读取逻辑，代码重复率约 80%。建议将公共逻辑提取到 `src/lib/cards.ts`，构建脚本 import 使用。

---

## 3. 类型安全

### 通过项
- [x] TypeScript 严格模式启用 (`"strict": true`)
- [x] `Card`、`CardBack`、`CardFilters`、`Rarity`、`EffectType`、`CharacterType`、`Generation` 类型完整
- [x] `yaml.load()` 返回值正确断言为 `Card` 类型
- [x] 可选字段 (`dp_speed`, `image_frame_c`, `evolves_from`, `character_type`) 标记正确

### 问题

**P3 - [LOW] `yaml.load()` 无运行时类型校验**

`src/lib/cards.ts` 第 25 行：`const data = yaml.load(content) as Card;`。`as Card` 是强制类型断言，如果 YAML 文件缺少必需字段，会在运行时产生类型不安全的对象。

建议：添加运行时校验（如 `zod` 或手动字段检查），至少在开发环境下 warn 缺失字段。

---

## 4. 代码质量

### 通过项
- [x] 代码结构清晰，函数职责单一
- [x] JSDoc 注释完整
- [x] 使用了 Next.js `Link` 组件做客户端导航
- [x] 详情页正确使用 `notFound()` 处理 404

### 问题

**P2 - [MED] 首页属性 emoji 映射硬编码在 JSX 中**

`src/app/page.tsx` 第 33 行和详情页第 32 行都使用了内联的三元表达式链做 emoji 映射：

```tsx
{card.attribute === "火" ? "🔥" : card.attribute === "草" ? "🌿" : ...}
```

同样的逻辑出现在两处。建议提取为 `src/lib/attribute-emoji.ts` 或常量映射。

**P3 - [LOW] 首页稀有度颜色判断链较长**

`src/app/page.tsx` 第 44-52 行使用了四重三元表达式决定稀有度颜色样式。建议提取为 `getRarityStyle(rarity: Rarity)` 函数。

---

## 5. 安全性

### 通过项
- [x] 无用户输入渲染，不存在 XSS 风险
- [x] YAML 解析在构建时执行，无运行时注入风险
- [x] `fs.readFileSync` 读取的是本地固定目录，无路径遍历风险
- [x] 无外部 API 调用

### 问题

未发现安全问题。

---

## 6. 可维护性

### 通过项
- [x] 目录结构清晰，`src/lib/` 存放数据逻辑，`src/app/` 存放页面
- [x] 新增卡片只需添加 YAML 文件，无需修改代码
- [x] `package.json` 脚本清晰：`dev`, `build`, `build:data`, `start`, `lint`
- [x] `.gitignore` 合理排除了构建产物和开发临时文件

### 问题

**P3 - [LOW] 缺少数据校验和错误提示**

如果 YAML 文件格式错误，`yaml.load()` 会抛异常但没有有意义的错误信息。建议在 `loadCards()` 中捕获异常并输出文件名。

---

## 7. 性能

### 通过项
- [x] SSG 构建时数据加载一次，无运行时开销
- [x] 首页使用 `grid` 布局，无过度嵌套
- [x] 图片路径使用本地文件，无外部资源加载

### 问题

**P3 - [LOW] 当卡片数量增加时（T9 要求 149 张），每次筛选都重新 loadCards() 会重复读盘**

如 1.正确性问题中所述，`filterCards` 每次都调用 `loadCards()`。当前 3 张卡片无影响，但数据量增大后应考虑缓存。

---

## 8. YAML 数据审查

### 通过项
- [x] 三个示例 YAML 文件结构一致，字段完整
- [x] `evolves_to` 使用 ID 字符串数组，与类型定义一致
- [x] 稀有度使用小写字母，与 `Rarity` 类型一致
- [x] `evolution_stage` 为数值类型，与类型定义一致

### 问题

**P3 - [LOW] xfd-001 的 `evolves_to` 引用了不存在的 xfd-002**

`data/gen1/xfd-001.yaml` 中 `evolves_to: [xfd-002]`，但 `xfd-002.yaml` 不存在。这在 T2 阶段可接受（示例数据），但后续需要补全进化链。

---

## 改进建议汇总

| 优先级 | 编号 | 描述 | 文件 |
|--------|------|------|------|
| P2 | #1 | `loadCards()` 重复读盘，建议模块级缓存 | `src/lib/cards.ts` |
| P2 | #2 | 缺失架构文档中列出的组件 | `src/components/` (T3-T4) |
| P2 | #3 | `build-data.ts` 与 `cards.ts` 数据加载逻辑重复 | `scripts/build-data.ts` |
| P2 | #4 | emoji 映射硬编码且重复 | `src/app/page.tsx`, `[cardId]/page.tsx` |
| P3 | #5 | `yaml.load()` 强制类型断言无运行时校验 | `src/lib/cards.ts` |
| P3 | #6 | `PageProps` params 类型 Next.js 15 不兼容 | `src/app/[cardId]/page.tsx` |
| P3 | #7 | 稀有度颜色判断链可提取为函数 | `src/app/page.tsx` |
| P3 | #8 | YAML 加载异常无文件名提示 | `src/lib/cards.ts` |
| P3 | #9 | xfd-001 引用不存在的 xfd-002 | `data/gen1/xfd-001.yaml` |

---

## 验收结论

**T1 (项目初始化): 通过**
- Next.js 14 + TypeScript + Tailwind CSS 4 配置正确
- 目录结构符合架构文档
- SSG 静态导出配置完成
- 奇多橙主题色已配置
- `pnpm build` 能成功生成静态页面

**T2 (数据层搭建): 通过（含改进建议）**
- `Card`, `CardBack`, `CardFilters` 等类型定义完整
- `loadCards()`, `getCardById()`, `filterCards()` 函数正确实现
- 示例 YAML 数据 3 张，覆盖 common/legendary 稀有度、gen1/gen2
- 筛选功能支持代际/属性/稀有度/搜索词
- 构建脚本 `scripts/build-data.ts` 可用

**建议进入 T3 前完成**: 改进建议 #1（模块缓存）和 #4（emoji 提取），成本极低但能改善后续开发体验。

---

# 审查报告: T5 + T6 + T7 + T8 实现

> 审查范围: T5 (进化链页面) + T6 (稀有度榜单) + T7 (对战规则页面) + T8 (部署配置)
> 审查日期: 2026-07-06
> 审查人: review-agent

---

## 总体评价: **通过（含改进建议，T8 有阻塞性问题）**

T5、T6、T7 页面实现质量良好，符合任务要求，视觉风格与奇多橙主题一致，复用了 `getAttributeEmoji`、`getAttributeGradient`、`RarityBadge` 等共享组件。T8 部署配置存在一个阻塞性问题（`basePath` 未配置），必须在部署到 GitHub Pages 前修复。

---

## 1. T5: 进化链页面 (`src/app/evolution/page.tsx`)

### 需求对照 (per TASKS.md)
- [x] 展示完整进化链（如迷你龙→哈克龙→快龙）
- [x] 按属性/世代分区
- [x] 点击精灵跳转详情

### 发现

| # | 类型 | 优先级 | 描述 |
|---|------|--------|------|
| T5-1 | 功能限制 | P2-MED | `getEvolutionChains` 函数（`src/lib/cards.ts` 第 92 行）只跟踪 `evolves_to[0]`。如果一张卡有分支进化（如伊布的多条进化线），只会显示第一条分支。页面会静默丢失数据，不会报错。 |
| T5-2 | 代码质量 | P3-LOW | `EvolutionGroup` 内 `chains.map((chain, idx) => (<EvolutionLine key={idx} ... />))` 使用数组索引作为 key。虽然进化链从 YAML 数据推导是确定性的，但使用稳定 key（如 `chain[0].id`）是更好的做法。 |
| T5-3 | 视觉一致性 | P3-LOW | footer 文字与其他页面不一致：进化链页用 `"进化链图鉴"`，首页用 `"怀旧零食风宝可梦图鉴"`。建议统一或提取为共享 Footer 组件。 |
| T5-4 | 视觉一致性 | P3-LOW | `max-w-5xl` 与首页 `max-w-6xl` 不同。对于进化链较窄的布局是合理的，但应记录或提取为共享常量。 |

### 正面评价
- 良好复用 `getAttributeGradient` 和 `getAttributeEmoji` 共享库。
- 基于稀有度的进化节点边框/发光样式视觉效果出色。
- 空状态处理优雅，有友好的 fallback 文案。
- `hover:scale-105` / `hover:scale-110` 过渡与 CardCircle 行为一致。

---

## 2. T6: 稀有度榜单页面 (`src/app/rarity/page.tsx`)

### 需求对照 (per TASKS.md)
- [x] 传说级卡片大尺寸置顶
- [x] 显示稀有度星级和描述
- [x] 显示当年交换行情

### 发现

| # | 类型 | 优先级 | 描述 |
|---|------|--------|------|
| T6-1 | **Bug** | **P2-MED** | **`w-18 h-18` 不是 Tailwind v4 默认类**。Tailwind 默认间距步进从 `16` 直接跳到 `20`，没有 `18`。第 162-163 行的 `w-18 h-18` 会渲染为零宽高，普通稀有度卡片将显示为不可见或破损的圆圈。应改为 `w-16 h-16`。 |
| T6-2 | 代码重复 | P2-MED | `RARITY_ORDER` 数组在 `rarity/page.tsx`（第 8 行）和 `src/lib/cards.ts`（第 152 行）两处重复定义。应从单一来源导出（如 `src/lib/cards.ts`）。 |
| T6-3 | 代码重复 | P3-LOW | `TradeInfo` 组件（第 202-238 行）硬编码了交换行情描述，这些文本已存在于 `RarityBadge.tsx` 的 `RARITY_INFO.tradeInfo` 中。同一数据在两个位置维护。 |
| T6-4 | 代码质量 | P3-LOW | 第 67-70 行的内联条件颜色类（`text-legendary-glow` / `text-rare-glow` 等）与 `RarityBadge` 中的 `RARITY_INFO.colorClasses` 逻辑重复。应复用已有组件数据。 |
| T6-5 | 视觉一致性 | P3-LOW | Footer 文字为 `"稀有度榜单"`，与其他页面不统一。同 T5-3。 |

### 正面评价
- `LegendaryGrid` 1/2/3 列响应式布局设计出色。
- 传说级大 emoji 圆圈创造了强烈的视觉层次。
- 交换行情脚注增添了怀旧价值，与项目主题高度契合。

---

## 3. T7: 对战规则页面 (`src/app/battle-rules/page.tsx`)

### 需求对照 (per TASKS.md)
- [x] 展示一代/二代对战规则
- [x] 动画示意对战流程
- [x] 附带 DP 数值案例

### 发现

| # | 类型 | 优先级 | 描述 |
|---|------|--------|------|
| T7-1 | 代码质量 | P3-LOW | 纯静态内容页面，无数据层依赖或类型问题。结构清晰，分节明确。 |
| T7-2 | 视觉一致性 | P3-LOW | `max-w-4xl` 与其他页面不同。对于文字密集型页面是合理的，但应记录。 |
| T7-3 | 无障碍 | P3-LOW | `BattleArrow` 使用 `animate-pulse` 持续动画。对于装饰性目的没问题，但前庭障碍用户可能感到不适。考虑添加 `@media (prefers-reduced-motion: reduce)` 处理。 |

### 正面评价
- 对战流程 emoji 步骤 + 箭头可视化清晰直观。
- 一代 vs 二代对比表格格式精美。
- 使用实际 DP 数值的案例让规则具体、有教育意义。
- 子组件（`BattleStep`、`RuleItem`、`ComparisonRow`）干净可复用。

---

## 4. T8: 部署配置

### 发现

| # | 类型 | 优先级 | 描述 |
|---|------|--------|------|
| T8-1 | **Bug** | **P1-HIGH** | **`basePath` 在 `next.config.mjs` 第 7 行被注释掉了。** 如果部署到 `https://<username>.github.io/tcgcard/`，所有路由将断裂：Next.js 会生成 `/evolution` 而不是 `/tcgcard/evolution`。这是 GitHub Pages 部署的**阻塞性问题**。 |
| T8-2 | 配置 | P2-MED | GitHub Actions 工作流未通过环境变量或动态方式配置 `basePath`。部署到 GitHub Pages 时构建必须知道正确的 `basePath`。要么取消注释并硬编码 `basePath: "/tcgcard"`，要么在 workflow 中设置 `NEXT_PUBLIC_BASE_PATH` 并在 config 中读取。 |
| T8-3 | 配置 | P3-LOW | 未生成 `404.html` 用于 GitHub Pages。由于是完全静态导出且路由已预渲染，对未知路径的 404 处理不是关键问题。但如果直接访问路由（如分享链接），GitHub Pages 会返回 404。考虑添加 `public/404.html` 重定向到 `/tcgcard/`。 |
| T8-4 | 配置 | P3-LOW | `vercel.json` 和 GitHub Pages 部署同时存在。如果 GitHub Pages 是主平台，`vercel.json` 是无效配置。无害但应文档化哪个平台是主要的。 |

### 正面评价
- `output: "export"` 正确配置用于静态站点生成。
- `images.unoptimized: true` 对 SSG 是恰当的（无 Next.js 图片优化服务器）。
- GitHub Actions 工作流使用正确版本（Node 20, pnpm 10, actions/deploy-pages@v4）。
- `concurrency` 组防止冲突部署。
- OIDC 令牌权限（`id-token: write`）正确配置用于 GitHub Pages。

---

## 5. 跨页面关注点

### 5.1 视觉一致性

| 方面 | 首页 | 进化链 | 稀有度 | 对战规则 |
|------|------|--------|--------|----------|
| `max-w` | `6xl` | `5xl` | `5xl` | `4xl` |
| Header 渐变 | 是 | 是 | 是 | 是 |
| Footer 文字 | "怀旧零食风" | "进化链图鉴" | "稀有度榜单" | "DP 对战规则" |
| 面包屑 | 无 | 有 | 有 | 有 |

不同的 `max-w` 值是可辩护的（内容密度不同），但不一致的 footer 文字说明缺少共享的 `Footer` 组件。

### 5.2 组件复用

| 共享工具 | 使用于 |
|----------|--------|
| `getAttributeEmoji` | evolution, rarity |
| `getAttributeGradient` | evolution, rarity |
| `RarityBadge` | rarity |
| `getCardsByRarity` | rarity |
| `getEvolutionChainsGrouped` | evolution |

良好复用了现有库，未发现重复造轮子。

### 5.3 TypeScript 安全

所有页面都正确类型化，未发现 `any` 使用。Props 接口是内联的，但对于页面级组件来说已足够。

---

## 6. 改进建议汇总（按优先级排序）

| 优先级 | 编号 | 描述 | 文件 |
|--------|------|------|------|
| **P1** | T8-1 | **修复 `basePath` 用于 GitHub Pages** -- 阻塞性问题 | `next.config.mjs` |
| P2 | T6-1 | 修复 `w-18 h-18` -- 不是有效 Tailwind 类 | `src/app/rarity/page.tsx:162` |
| P2 | T6-2 | 去重 `RARITY_ORDER` 数组 | `src/app/rarity/page.tsx`, `src/lib/cards.ts` |
| P2 | T8-2 | 工作流应设置 `basePath` 环境变量 | `.github/workflows/deploy.yml` |
| P2 | T5-1 | 文档化进化链只跟踪第一条分支的限制 | `src/lib/cards.ts` |
| P3 | T6-3 | 去重 TradeInfo 数据 | `src/app/rarity/page.tsx`, `src/components/RarityBadge.tsx` |
| P3 | T6-4 | 复用 RarityBadge 的颜色数据 | `src/app/rarity/page.tsx:67-70` |
| P3 | T7-3 | 添加 `prefers-reduced-motion` 处理 | `src/app/battle-rules/page.tsx` |
| P3 | 跨页面 | 创建共享 Footer 组件 | 所有页面 |

---

## 7. 验收结论

**T5 (进化链页面): 通过（含改进建议）**
- 进化链按属性/世代分组展示正确
- 点击跳转详情页工作正常
- 视觉风格与主题一致
- 空状态处理得当

**T6 (稀有度榜单): 通过（含改进建议）**
- 传说级大尺寸置顶展示正确
- 稀有度分档展示完整
- 交换行情描述增添怀旧价值
- **需修复 `w-18 h-18` 无效 Tailwind 类**

**T7 (对战规则页面): 通过**
- 一代/二代规则对比清晰
- 对战流程可视化直观
- DP 数值案例有教育意义
- 纯静态内容页，无数据层风险

**T8 (部署配置): 需修复后通过**
- `output: "export"` 正确
- GitHub Actions 工作流结构正确
- **`basePath` 必须取消注释并设为 `/tcgcard`（或动态配置）**，否则 GitHub Pages 部署后所有路由将断裂
