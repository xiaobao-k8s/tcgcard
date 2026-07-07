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
