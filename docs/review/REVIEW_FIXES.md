# 审查修复记录: P2 级别问题

> 修复日期: 2026-07-06
> 修复人: developer-agent
> 参考报告: `docs/review/REVIEW_REPORT.md`

---

## 修复清单

### P2 #1: `loadCards()` 重复读盘，模块级缓存

**文件**: `src/lib/cards.ts`

**问题**: `filterCards()`、`getAttributes()`、`getRarities()`、`getCardById()` 各自调用 `loadCards()`，每次都重新读取文件系统。

**修复**: 在模块顶层调用 `loadCards()` 原始逻辑一次，将结果存入 `cardsCache` 常量。`loadCards()` 导出函数改为返回缓存结果。所有下游函数自动复用同一份数据。

```typescript
// 模块顶层缓存
const cardsCache = loadCardsRaw();
export function loadCards(): Card[] {
  return cardsCache;
}
```

**影响**: SSG 构建时仅读取一次磁盘，所有页面和数据函数共享同一份卡片数据。

---

### P2 #3: `build-data.ts` 与 `cards.ts` 数据加载逻辑重复

**文件**: `scripts/build-data.ts`

**问题**: 构建脚本 `loadAllCards()` 函数与 `src/lib/cards.ts` 的 `loadCards()` 代码重复率约 80%（相同目录遍历、YAML 解析逻辑）。

**修复**: 删除脚本中重复的 `loadAllCards()` 函数和 `CardData` 接口定义，改为从 `src/lib/cards.ts` import `loadCards()` 使用。

**修复前**: ~40 行重复代码
**修复后**: ~25 行，直接 import 复用

---

### P2 #4: emoji 映射硬编码且重复

**文件**:
- 新建: `src/lib/attribute-emoji.ts`
- 修改: `src/app/page.tsx`
- 修改: `src/app/[cardId]/page.tsx`

**问题**: 属性→emoji 映射以三元表达式链形式硬编码在两个页面文件中，代码重复且不易维护。

**修复**:
1. 创建 `src/lib/attribute-emoji.ts`，导出：
   - `ATTRIBUTE_EMOJI`: 属性名到 emoji 的映射常量
   - `DEFAULT_ATTRIBUTE_EMOJI`: 默认 emoji（"✨"）
   - `getAttributeEmoji(attribute: string): string`: 便捷函数
2. `src/app/page.tsx` import `getAttributeEmoji`，替换内联三元链
3. `src/app/[cardId]/page.tsx` 同上

**新增属性**: 只需在 `ATTRIBUTE_EMOJI` 对象中添加键值对，无需修改页面代码。

---

## 验证

- [x] `pnpm tsc --noEmit` 通过
- [x] `pnpm build` 成功（8 pages 生成，3 张卡片 SSG 路由正常）
- [x] 构建产物正确

---

## 未修复的 P2 问题

| 编号 | 描述 | 原因 | 计划 |
|------|------|------|------|
| P2 #2 | 缺失架构文档中列出的组件 | 属于 T3-T4 范围 | 后续任务实现 |

---

## 新增修复 (T3+T4 Review P2 问题)

> 修复日期: 2026-07-07
> 修复人: developer-agent

### P2 #1: `ATTRIBUTE_EMOJI` 映射不完整

**文件**: `src/lib/attribute-emoji.ts`

**问题**: 仅定义了 3 个属性（火/草/水），其余 15 个属性回退到 ✨。

**修复**: 补全所有 18 个 Pokemon 属性 emoji 映射：
- 已有: 火🔥、草🌿、水💧
- 新增: 雷⚡、超能力🔮、格斗🥊、毒☠️、地面🌍、岩石🪨、虫🐛、幽灵👻、钢⚙️、飞行🐦、冰❄️、龙🐉、一般⭐、妖精🎀、恶🌑

---

### P2 #2: 光栅翻转缺少移动端交互

**文件**: `src/components/LenticularFlip.tsx`

**问题**: 仅 CSS hover 触发翻转，移动端无 hover 概念。

**修复**:
- 添加 `useState` 管理翻转状态 `isFlipped`
- 添加 `touchstart`/`touchend`/`touchcancel` 事件监听
- 水平滑动 >50px 触发翻转，再次滑动翻回
- 底部文案更新为"悬停或滑动查看光栅翻转效果"

---

### P2 #3: attribute gradient 映射重复

**文件**:
- 新建: `src/lib/attribute-gradient.ts`
- 修改: `src/components/CardCircle.tsx`
- 修改: `src/components/LenticularFlip.tsx`
- 修改: `src/components/EvolutionChain.tsx`

**问题**: `getGradient` (CardCircle)、`getGradient` (LenticularFlip)、`getMiniGradient` (EvolutionChain) 包含相同的 15 个属性到 Tailwind 渐变类的映射。

**修复**:
1. 创建 `src/lib/attribute-gradient.ts`，包含 `light`/`medium`/`dark` 三种色阶变体
2. CardCircle 使用 `getAttributeGradient(attr, 'medium')`
3. LenticularFlip 使用 `getAttributeGradient(attr, 'dark')`
4. EvolutionChain 使用 `getAttributeGradient(attr, 'light')`
5. 删除三个组件中各自的 `getGradient`/`getMiniGradient` 本地函数

---

### P2 #4: 缺少 `not-found.tsx`

**文件**: `src/app/not-found.tsx`

**问题**: 详情页调用 `notFound()` 时无自定义 404 页面。

**修复**:
- 创建 `'use client'` 自定义 404 页面
- 奇多橙主题风格：大号 404 + emoji + 品牌配色
- 提供"返回图鉴首页"和"返回上一页"两个操作按钮
- 文案适配： "卡片没有找到"

---

## 未修复的 P2 问题

| 编号 | 描述 | 原因 | 计划 |
|------|------|------|------|
| (原 P2 #2) | 缺失架构文档中列出的组件 | 属于 T3-T4 范围 | 已实现 |

---

## 新增修复 (T6 + T8 问题)

> 修复日期: 2026-07-07
> 修复人: developer-agent

### T6: `w-18 h-18` 不是有效的 Tailwind 类

**文件**: `src/app/rarity/page.tsx`

**问题**: `CardGrid` 中 `rare` 分支使用 `w-18 h-18`，Tailwind 默认没有 18 这个步长（步长为 4 的倍数：16、20）。

**修复**: 改为 `w-16 h-16 text-2xl`。

### T6: `RARITY_ORDER` 重复定义

**文件**: `src/app/rarity/page.tsx`、`src/lib/cards.ts`

**问题**: `RARITY_ORDER` 常量同时在页面文件和库文件中定义，且页面未使用库文件的导出。

**修复**:
1. 将 `src/lib/cards.ts` 中的 `RARITY_ORDER` 改为 `export const`。
2. 删除 `src/app/rarity/page.tsx` 中的重复定义，改为从 `@/lib/cards` import。

### T8: `basePath` 被注释掉

**文件**: `next.config.mjs`

**问题**: GitHub Pages 部署需要 `basePath` 配置，但被注释掉。

**修复**: 取消注释 `basePath: '/tcgcard'`。

### 验证

- [x] `pnpm tsc --noEmit` 通过
- [x] `pnpm build` 成功（11 pages，3 SSG 路由正常生成）
- [x] Tailwind 类正确（`w-16 h-16` 替代 `w-18 h-18`）
- [x] `basePath` 配置为 `/tcgcard`

---

## 二次 Review（review-agent 验收）

> 验收日期: 2026-07-06
> 验收人: review-agent

### P2 #1: `loadCards()` 模块缓存 -- 通过

- `src/lib/cards.ts` 中新增 `loadCardsRaw()` 函数包含原始磁盘读取逻辑
- 模块顶层 `const cardsCache = loadCardsRaw()` 在模块加载时执行一次
- 导出的 `loadCards()` 返回 `cardsCache`，不再读盘
- 所有调用方 (`getCardById`, `filterCards`, `getAttributes`, `getRarities`, `generateStaticParams`) 自动共享同一份数据
- 实现方式符合原始 review 建议

### P2 #3: `build-data.ts` 代码去重 -- 通过

- `scripts/build-data.ts` 已删除原有重复的 `loadAllCards()` 和 `CardData` 接口
- 改为 `import { loadCards } from '../src/lib/cards'`，在 `main()` 中直接调用
- 消除了约 80% 的代码重复，符合原始 review 建议

### P2 #4: emoji 提取 -- 通过

- 新建 `src/lib/attribute-emoji.ts`，导出 `ATTRIBUTE_EMOJI`、`DEFAULT_ATTRIBUTE_EMOJI`、`getAttributeEmoji()`
- `src/app/page.tsx` 第 2 行 import `getAttributeEmoji`，第 35 行使用 `{getAttributeEmoji(card.attribute)}` 替换了三元链
- `src/app/[cardId]/page.tsx` 第 2 行 import `getAttributeEmoji`，第 33 行同样使用
- 两处硬编码三元表达式已完全消除，符合原始 review 建议

### 构建验证

- [x] `pnpm tsc --noEmit` 通过（无输出即无错误）
- [x] `pnpm build` 成功（8 pages，3 SSG 路由正常生成）
- [x] 未引入新类型错误或运行时问题

### 结论

**三项 P2 修复均已通过验收。** 修复实现与原始 review 建议一致，无引入新问题。可继续后续任务。
