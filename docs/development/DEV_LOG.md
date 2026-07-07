# 开发日志

## T9 Phase 1: 数据录入脚本 + 图片生成工作流 (2026-07-07)

### 实现内容

**`scripts/validate-cards.ts` — 数据验证脚本（12 项检查）**
1. YAML 语法正确性
2. 必填字段完整性（id, generation, name, attribute, rarity, dp_attack/defense 等）
3. 字段值合法性（属性/稀有度/效果类型/character_type 枚举）
4. ID 命名规范（xfd-XXX / ybd-XXX 格式）
5. 无重复 ID
6. 进化链引用完整性（evolves_to/evolves_from 引用必须存在）
7. 进化链反向一致性（A→B 则 B←A 必须成立）
8. evolution_stage 一致性
9. DP 数值范围合规（按稀有度+进化阶段）
10. dp_speed 世代规则（一代 null，二代必填）
11. source 字段存在且合法
12. 图片文件存在性检查（warn，不 error）

**`scripts/generate-template.ts` — 卡片模板生成器**
- 输入：`--id <card-id>` + `--gen <1|2>`
- 输出：`data/gen{1,2}/{card-id}.yaml`（预填基础字段）
- 预填：id, generation, name (空), number (空), rarity="common", evolution_stage=1, DP 默认中值, source="user-provided"
- 自动校验 ID 格式和前缀/世代匹配

**`scripts/gen-prompts.ts` — 批量生图提示词生成器**
- 扫描 data/ 目录找出缺图卡片
- 为每张卡片生成 ChatGPT 格式完整提示词（中文优先，英文备选）
- 输出：`prompts/batch-all.md`（汇总）+ `prompts/gen1/*.md` / `prompts/gen2/*.md`（单卡）
- 包含稀有度姿态模板、属性特效描述、光栅帧规则

**`scripts/import-images.ts` — 图片快速导入工具**
- 扫描 staging/ 目录图片（支持 png/jpg/webp）
- 4 级匹配策略：ID 直匹配 → 中文名 → 英文名映射 → 图鉴编号
- 校验：格式、文件大小（<200KB）、目标冲突
- 支持 `--dry-run` 预览模式
- 输出导入报告和进度统计

**`package.json` 新增 scripts：**
- `pnpm run validate` → `scripts/validate-cards.ts`
- `pnpm run new-card` → `scripts/generate-template.ts`
- `pnpm run gen-prompts` → `scripts/gen-prompts.ts`
- `pnpm run import-images` → `scripts/import-images.ts`

**目录结构：**
- `staging/.gitkeep` — 图片导入临时目录
- `public/cards/gen1/`, `public/cards/gen2/` — 正式图片目录
- `public/cards/placeholders/` — 占位图目录
- `prompts/` — 生图提示词输出目录（gitignored）

### 技术要点
- TypeScript + tsx 运行时
- js-yaml 解析 YAML 数据
- 纯 node:fs / node:path，无额外依赖
- validate 脚本使用 CheckResult 统一接口，支持错误/警告分级
- import-images 支持多种文件名推断策略，无需严格命名

### 验收状态
- [x] 4 个脚本文件创建完成
- [x] package.json scripts 添加
- [x] `pnpm run validate` 可执行，正确检测数据问题
- [x] `pnpm run new-card -- --id xfd-025 --gen 1` 可执行，模板生成正确
- [x] `pnpm run gen-prompts` 可执行，提示词文件生成正确
- [x] `pnpm run import-images` 可执行，空目录/匹配逻辑正常
- [ ] 完整数据录入后全量验证通过（待 Phase 2 补全数据后确认）

---

## T5 + T6 + T7 + T8: 进化链/稀有度/对战规则页面 + 部署配置 (2026-07-06)

### 实现内容

**T5: 进化链页面 (`src/app/evolution/page.tsx`)**
- 按进化关系分组展示，横排串联，箭头连接
- 按属性/世代分区（gen1/gen2 + 属性名分组）
- 传说/极稀有卡片带发光效果
- 点击精灵跳转详情页
- 无进化关系的单卡独立展示
- 辅助函数：`getEvolutionChains()`, `getEvolutionChainsGrouped()` 添加到 `src/lib/cards.ts`

**T6: 稀有度榜单页面 (`src/app/rarity/page.tsx`)**
- 按稀有度分档：传说级 → 极稀有 → 稀有 → 普通
- 传说级大尺寸卡片置顶（3 列大卡片网格，带紫色光晕）
- 其他稀有度用小气泡网格展示
- 每档附当年交换行情描述
- 辅助函数：`getCardsByRarity()` 添加到 `src/lib/cards.ts`

**T7: 对战规则页面 (`src/app/battle-rules/page.tsx`)**
- 对战流程示意（出卡 → 比攻击 → 比防御 → 三局两胜）
- 一代规则详解 + DP 数值案例
- 二代规则详解（新增速度属性）+ DP 数值案例
- 一代 vs 二代对比表格
- 拍卡玩法补充说明

**T8: 部署配置**
- `next.config.mjs` — 更新 `output: "export"` + `images.unoptimized` + GitHub Pages basePath 指引
- `.github/workflows/deploy.yml` — GitHub Actions 自动部署到 GitHub Pages
- `vercel.json` — Vercel 静态部署配置

### 技术要点
- Server Components 渲染，无需客户端 JS（evolution/rarity 页面）
- 复用现有组件：RarityBadge
- 复用 lib 函数：`getAttributeEmoji`, `getAttributeGradient`
- Tailwind CSS 4 自定义阴影/渐变
- TypeScript 严格模式，类型完整
- ESLint `react/no-unescaped-entities` 合规

### 验收状态
- [x] `pnpm tsc --noEmit` 通过
- [x] `pnpm build` 成功，生成 11 个静态页面（含 evolution, rarity, battle-rules）
- [x] 部署配置完整（GitHub Pages + Vercel）
- [ ] 本地浏览器验证 3 个新页面渲染

---

## T3 + T4: 首页布局优化 + 单卡详情页优化 (2026-07-06)

### 实现内容

**T3: 首页布局优化**

新建组件：
- `src/components/CardCircle.tsx` — 稀有度气泡网格卡片
  - 按稀有度缩放圆圈尺寸（legendary 最大，common 最小）
  - 稀有度越高发光效果越强（legendary 紫色光晕，ultra-rare 红色光晕，rare 橙色光晕）
  - 按属性映射渐变色背景
  - 悬停 tooltip 显示卡片名称和编号
  - 悬停放大动画 (scale-110)
- `src/components/FilterBar.tsx` — 筛选栏
  - 代际 Tab 切换（全部 / 一代·旋风卡 / 二代·比斗卡）
  - 搜索框（支持中文名、日文名、编号搜索）
  - 属性筛选 Chip（动态获取所有属性）
  - 稀有度筛选 Chip（带颜色区分：传说紫/极稀有红/稀有橙）
- `src/components/HomePage.tsx` — 首页客户端组件（处理筛选状态）

更新 `src/app/page.tsx`：
- 拆分为 Server Component (数据加载) + Client Component (交互)
- 顶部导航栏：Logo + 副标题 + 卡片数量徽章
- 嵌入 FilterBar 筛选栏
- 稀有度气泡网格（按稀有度排序，高稀有度在前）
- 清除筛选按钮
- 空结果提示

**T4: 单卡详情页优化**

新建组件：
- `src/components/LenticularFlip.tsx` — 光栅翻转动画
  - CSS 3D transform (`rotateY(180deg)`) 模拟光栅翻转
  - 正面显示基础形态，翻转后显示进化形态/大招
  - 光栅条纹叠加层 (repeating-linear-gradient)
  - 显示当前画面状态标签
  - 按属性映射渐变色
- `src/components/EvolutionChain.tsx` — 进化链导航
  - 横排展示进化链（圆形小卡片 + 箭头连接）
  - 当前卡片高亮（橙色光环）
  - 点击跳转到对应卡片详情
  - 只有 1 张卡片时不渲染
- `src/components/RarityBadge.tsx` — 稀有度标签
  - 星级显示（★/☆）
  - 稀有度等级标签（普通/稀有/极稀有/传说级）
  - 可选显示描述文案和当年交换行情
  - 稀有度越高发光效果越强
- `src/components/CardDetail.tsx` — 卡片详情组合组件
  - 集成 LenticularFlip、EvolutionChain、RarityBadge
  - 背面数据面板：编号/属性/代际、身高体重、DP 攻防速、技能、图鉴描述
  - 稀有度信息区（星级 + 描述 + 交换行情）

更新 `src/app/[cardId]/page.tsx`：
- 面包屑导航：图鉴 / 代际 / 属性 / 卡片名
- 进化链构建函数 `buildEvolutionChain`：从 `evolves_from` 向上遍历 + `evolves_to` 向下遍历
- 使用 CardDetail 组件替代原有简单展示

### 技术要点
- Server/Client Component 分离：`page.tsx` 为 Server Component 加载数据，`HomePage.tsx` 为 Client Component 处理交互
- CSS 3D Transform：`perspective` + `transform-style: preserve-3d` + `backface-visibility: hidden` + `rotateY(180deg)`
- Tailwind CSS 4 任意值语法：`shadow-[0_0_24px_8px_rgba(139,92,246,0.5)]`、`perspective-[1000px]`
- `useMemo` 缓存筛选和排序计算结果
- TypeScript 严格模式，所有组件 Props 类型定义完整

### 验收状态
- [x] `pnpm tsc --noEmit` 通过
- [x] `pnpm build` 成功，生成 8 个静态页面
- [x] 首页显示稀有度气泡网格（大小按稀有度缩放，带发光效果）
- [x] 详情页有光栅翻转效果（CSS 3D transform，悬停触发）
- [x] 进化链导航正常（横排展示，当前卡片高亮，点击跳转）
- [x] 筛选功能正常（代际/属性/稀有度/搜索）
- [x] 组件拆分完整：CardCircle, FilterBar, CardDetail, LenticularFlip, EvolutionChain, RarityBadge, HomePage

---

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
