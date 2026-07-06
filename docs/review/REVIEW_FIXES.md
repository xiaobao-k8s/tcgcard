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
