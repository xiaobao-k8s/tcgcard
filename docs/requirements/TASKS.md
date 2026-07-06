# 任务列表

> 基于设计文档和架构文档，拆解为实现任务

## T1: 项目初始化

**目标**: 创建 Next.js 项目，配置 Tailwind，建立基础目录结构

**交付物**:
- `package.json` (Next.js 14 + Tailwind 4 + TypeScript)
- `next.config.js` (SSG 配置)
- `tailwind.config.js` (奇多橙主题)
- 目录结构：`src/app/`, `src/components/`, `src/lib/`, `data/`, `public/cards/`
- `.gitignore` 更新

**验收标准**:
- `npm run dev` 能启动
- 访问 `http://localhost:3000` 显示空白页面
- Tailwind 样式生效

---

## T2: 数据层搭建

**目标**: 定义卡片数据类型，创建示例卡片 YAML，实现数据加载函数

**交付物**:
- `src/lib/types.ts` (Card, CardBack 类型定义)
- `data/gen1/xfd-001.yaml` (小火龙示例)
- `data/gen1/xfd-004.yaml` (喷火龙示例)
- `data/gen2/ybd-001.yaml` (妙蛙种子示例)
- `src/lib/cards.ts` (loadCards, getCardById 函数)
- `scripts/build-data.ts` (YAML → JSON 构建脚本)

**验收标准**:
- 能读取 YAML 文件
- 能按 ID 查询卡片
- 能按代际/属性/稀有度筛选

**依赖**: T1

---

## T3: 首页布局 + 导航

**目标**: 实现首页稀有度气泡网格 + 顶部导航栏

**交付物**:
- `src/app/page.tsx` (首页组件)
- `src/app/layout.tsx` (全局布局)
- `src/components/CardCircle.tsx` (圆形卡片组件)
- `src/components/FilterBar.tsx` (筛选栏)
- 顶部导航栏（Logo + 代际 Tab + 搜索）

**验收标准**:
- 首页显示所有卡片圆形缩略图
- 稀有卡圆圈更大，带发光效果
- 能按代际/属性/稀有度筛选
- 悬停显示 tooltip

**依赖**: T1, T2

---

## T4: 单卡详情页

**目标**: 实现单卡详情页，包含光栅翻转模拟

**交付物**:
- `src/app/[cardId]/page.tsx` (详情页)
- `src/components/CardDetail.tsx` (卡片详情组件)
- `src/components/LenticularFlip.tsx` (光栅翻转动画)
- `src/components/EvolutionChain.tsx` (进化链导航)
- `src/components/RarityBadge.tsx` (稀有度标签)

**验收标准**:
- 圆形卡片居中展示
- 鼠标悬停/倾斜时切换画面（CSS 3D）
- 显示进化链导航
- 显示背面 DP 数据
- 显示稀有度信息

**依赖**: T2, T3

---

## T5: 进化链页面

**目标**: 实现进化链展示页面

**交付物**:
- `src/app/evolution/page.tsx` (进化链页面)
- 按进化关系分组展示
- 点击跳转详情

**验收标准**:
- 能展示完整进化链（如 迷你龙→哈克龙→快龙）
- 按属性/世代分区
- 点击精灵跳转详情

**依赖**: T2

---

## T6: 稀有度榜单页面

**目标**: 实现稀有度排行页面

**交付物**:
- `src/app/rarity/page.tsx` (稀有度榜页面)
- 按稀有度分档展示
- 当年交换行情描述

**验收标准**:
- 传说级卡片大尺寸置顶
- 显示稀有度星级和描述
- 显示当年交换行情

**依赖**: T2

---

## T7: 对战规则页面

**目标**: 实现对战规则说明页面

**交付物**:
- `src/app/battle-rules/page.tsx` (对战规则页面)
- 规则说明 + 流程示意
- DP 数值案例

**验收标准**:
- 展示一代/二代对战规则
- 动画示意对战流程
- 附带 DP 数值案例

**依赖**: T1

---

## T8: 部署配置

**目标**: 配置 GitHub Pages / Vercel 部署

**交付物**:
- `next.config.js` 静态导出配置
- `.github/workflows/deploy.yml` (GitHub Actions)
- `vercel.json` (可选)

**验收标准**:
- `npm run build` 生成 `out/` 目录
- 部署到 GitHub Pages 可访问
- 所有页面正常加载

**依赖**: T3-T7

---

## T9: 补充卡片数据

**目标**: 补全所有 56+93 张卡片数据

**交付物**:
- `data/gen1/*.yaml` (56 张)
- `data/gen2/*.yaml` (93 张)

**验收标准**:
- 所有卡片数据完整
- 进化链关系正确
- 稀有度分档准确

**依赖**: T2

**说明**: 这是数据录入任务，可以分批完成。初版可先完成 10-20 张代表性卡片。

---

## 优先级排序

1. **P0 (必须)**: T1, T2, T3, T4 - 核心功能
2. **P1 (重要)**: T5, T6, T7 - 辅助页面
3. **P2 (可选)**: T8 - 部署
4. **P3 (后续)**: T9 - 数据补全

---

## 当前目标

**实现 T1 + T2**: 项目初始化 + 数据层搭建

完成后可运行 `npm run dev`，加载示例卡片数据。
