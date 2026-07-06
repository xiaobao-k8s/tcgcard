# 开发日志

## T1 + T2: 项目初始化 + 数据层搭建 (2026-07-06)

### 实现内容

**T1: 项目初始化**
- 使用 `pnpm create next-app@14` 创建 Next.js 14 项目（App Router + TypeScript + src dir）
- 升级 Tailwind CSS 到 v4（从默认 v3.4.1 升级）
  - 移除 `tailwind.config.ts`
  - 使用 CSS `@theme` 指令配置主题色
  - PostCSS 插件从 `tailwindcss` 改为 `@tailwindcss/postcss`
- 配置 Next.js 静态导出 (`output: "export"`)
- 建立目录结构：`src/app/`, `src/components/`, `src/lib/`, `data/`, `public/cards/`, `scripts/`
- 更新 `.gitignore` 排除构建输出和开发临时文件
- 配置奇多橙主题色（`#f97316`）及暖色系配色方案

**T2: 数据层搭建**
- `src/lib/types.ts` — 定义 `Card`, `CardBack`, `CardFilters`, `Rarity`, `EffectType`, `CharacterType`, `Generation` 类型
- `src/lib/cards.ts` — 实现以下函数：
  - `loadCards()` — 读取 `data/gen{1,2}/*.yaml` 并解析
  - `getCardById(id)` — 按 ID 查询单卡
  - `filterCards(filters)` — 按代际/属性/稀有度/搜索词筛选
  - `getAttributes()` — 获取所有唯一属性
  - `getRarities()` — 获取所有唯一稀有度
- `data/gen1/xfd-001.yaml` — 小火龙示例卡片
- `data/gen1/xfd-004.yaml` — 喷火龙示例卡片（传说稀有度）
- `data/gen2/ybd-001.yaml` — 妙蛙种子示例卡片
- `scripts/build-data.ts` — YAML → JSON 构建脚本（可选，供客户端读取）
- `src/app/page.tsx` — 首页，展示所有收录卡片
- `src/app/[cardId]/page.tsx` — 单卡详情页，含面包屑、DP 数据展示

### 技术要点
- 包管理：pnpm 11.7
- Node.js v24
- Tailwind CSS 4 使用 CSS `@import "tailwindcss"` + `@theme` 语法
- 数据文件用 YAML 格式，服务端运行时读取（SSG 构建时执行）
- TypeScript 严格模式，类型检查通过

### 验收状态
- [x] `pnpm install` 成功
- [x] TypeScript 类型检查通过 (`pnpm tsc --noEmit`)
- [x] `pnpm build` 成功，生成 8 个静态页面（首页 + not-found + 3 张卡片详情）
- [ ] `pnpm dev` 待本地验证
