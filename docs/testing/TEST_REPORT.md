# T1 + T2 测试报告

> 测试日期: 2026-07-06
> 测试范围: T1 (项目初始化) + T2 (数据层搭建)

## 测试环境

- **Node.js**: 通过 (Next.js 14.2.35 正常编译运行)
- **包管理**: pnpm
- **框架**: Next.js 14.2.35 (App Router)
- **样式**: Tailwind CSS v4.3.2
- **TypeScript**: v5

## 测试 1: TypeScript 类型检查

**命令**: `pnpm tsc --noEmit`
**结果**: **通过** - 零错误

所有类型定义 (`src/lib/types.ts`) 与使用方 (`src/lib/cards.ts`, `src/app/page.tsx`, `src/app/[cardId]/page.tsx`) 类型匹配。

## 测试 2: Next.js 构建

**命令**: `pnpm build`
**结果**: **通过**

- Compiled successfully
- 生成静态页面 8/8
- 路由:
  - `/` - 首页 (Static, 96.2 kB)
  - `/xfd-001` - 小火龙详情页 (SSG)
  - `/xfd-004` - 喷火龙详情页 (SSG)
  - `/ybd-001` - 妙蛙种子详情页 (SSG)
  - `/_not-found` - 404 页面

输出目录 `out/` 包含完整静态文件，可部署到 GitHub Pages。

## 测试 3: Tailwind CSS

**验证方式**: 检查构建输出的 HTML 和 CSS
**结果**: **通过**

- Tailwind CSS v4.3.2 已编译到静态 CSS
- 奇多橙主题变量正确注入 (`--color-primary: #f97316` 等)
- 页面使用了 Tailwind 工具类 (flex, grid, rounded-full, bg-primary 等)

## 测试 4: 数据层 - YAML 文件读取

**验证方式**: 通过 `tsx` 执行 `loadCards()` 函数
**结果**: **通过**

| YAML 文件 | 解析结果 | 卡片名称 |
|-----------|----------|----------|
| `data/gen1/xfd-001.yaml` | 成功 | 小火龙 |
| `data/gen1/xfd-004.yaml` | 成功 | 喷火龙 |
| `data/gen2/ybd-001.yaml` | 成功 | 妙蛙种子 |

- `loadCards()` 返回 3 张卡片
- YAML 数据完整，所有字段正确解析

## 测试 5: getCardById() 按 ID 查询

**结果**: **通过**

| ID | 返回 | 正确性 |
|----|------|--------|
| `xfd-001` | 小火龙 (Card 对象) | 通过 |
| `xfd-004` | 喷火龙 (Card 对象) | 通过 |
| `ybd-001` | 妙蛙种子 (Card 对象) | 通过 |
| `nonexistent` | undefined | 通过 |

## 测试 6: filterCards() 筛选功能

### 6.1 按代际筛选

| 筛选条件 | 结果数 | 卡片 | 状态 |
|----------|--------|------|------|
| `{ generation: 1 }` | 2 | xfd-001, xfd-004 | 通过 |
| `{ generation: 2 }` | 1 | ybd-001 | 通过 |

### 6.2 按属性筛选

| 筛选条件 | 结果数 | 卡片 | 状态 |
|----------|--------|------|------|
| `{ attribute: '火' }` | 2 | xfd-001, xfd-004 | 通过 |
| `{ attribute: '草' }` | 1 | ybd-001 | 通过 |

### 6.3 按稀有度筛选

| 筛选条件 | 结果数 | 卡片 | 状态 |
|----------|--------|------|------|
| `{ rarity: 'common' }` | 2 | xfd-001, ybd-001 | 通过 |
| `{ rarity: 'legendary' }` | 1 | xfd-004 | 通过 |

### 6.4 组合筛选

| 筛选条件 | 结果数 | 状态 |
|----------|--------|------|
| `{ generation: 1, attribute: '火' }` | 2 | 通过 |

## 测试 7: 页面内容验证

### 7.1 首页 (`/`)

- 标题: "奇多卡片百科" - **正确**
- 包含三张卡片名称 (小火龙、喷火龙、妙蛙种子) - **正确**
- Tailwind CSS 样式类已应用 - **正确**
- 布局: grid, rounded-full, 卡片容器 - **正确**

### 7.2 详情页 (`/[cardId]`)

- `xfd-001.html` 包含 "小火龙" - **正确**
- `xfd-004.html` 包含 "喷火龙" - **正确**
- `ybd-001.html` 包含 "妙蛙种子" - **正确**
- 各详情页均包含 DP 数据 (attack, defense, speed) - **正确**
- 各详情页均包含背面数据 (skill, description) - **正确**

### 7.3 导航跳转

- 首页各卡片带有链接指向对应详情页 - **正确**
- 详情页带有返回首页的链接 - **正确**
- 生成的路由与 `getStaticPaths` 一致 - **正确**

## 测试 8: 目录结构

**预期结构** (来自 TASKS.md):
- `src/app/` - 存在
- `src/components/` - 存在 (空目录，T3 填充)
- `src/lib/` - 存在 (types.ts, cards.ts, attribute-emoji.ts)
- `data/` - 存在 (gen1/, gen2/)
- `public/cards/` - 存在 (空目录)
- `scripts/` - 存在 (build-data.ts)

**交付物检查**:
| 交付物 | 状态 |
|--------|------|
| `package.json` (Next.js 14 + Tailwind 4 + TypeScript) | 存在 |
| `next.config.mjs` (SSG 配置) | 存在 |
| Tailwind 奇多橙主题 | 存在 (globals.css) |
| `src/lib/types.ts` | 存在 |
| `data/gen1/xfd-001.yaml` | 存在 |
| `data/gen1/xfd-004.yaml` | 存在 |
| `data/gen2/ybd-001.yaml` | 存在 |
| `src/lib/cards.ts` | 存在 |
| `scripts/build-data.ts` | 存在 |
| `.gitignore` | 存在 |

## 总结

| 测试项 | 状态 |
|--------|------|
| TypeScript 类型检查 | 通过 |
| Next.js 构建 | 通过 |
| Tailwind CSS 生效 | 通过 |
| YAML 数据读取 | 通过 |
| getCardById() | 通过 |
| filterCards() - 代际 | 通过 |
| filterCards() - 属性 | 通过 |
| filterCards() - 稀有度 | 通过 |
| filterCards() - 组合 | 通过 |
| 首页内容 | 通过 |
| 详情页内容 | 通过 |
| 导航跳转 | 通过 |
| 目录结构 | 通过 |

### T1 验收结论: **通过**

- `pnpm dev` 可启动 (已验证 `pnpm build` 成功)
- 访问 `/` 显示 "奇多卡片百科" 首页，包含所有卡片
- Tailwind 样式生效，奇多橙主题变量正确

### T2 验收结论: **通过**

- 能读取 YAML 文件 (3 张示例卡片正确加载)
- 能按 ID 查询卡片 (getCardById 正常工作)
- 能按代际/属性/稀有度筛选 (filterCards 正常工作)
