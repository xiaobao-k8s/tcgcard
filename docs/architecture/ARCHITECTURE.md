# 架构文档

> 基于设计文档 `docs/superpowers/specs/2026-07-06-cheetos-card-wiki-design.md`

## 技术栈

- **框架**: Next.js 14 (App Router)
- **部署**: 静态导出 (SSG)，部署到 GitHub Pages / Vercel
- **样式**: Tailwind CSS 4
- **数据格式**: YAML 文件存储卡片数据，构建时加载
- **包管理**: pnpm
- **Node 版本**: 18+

## 核心架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js SSG Build                         │
├─────────────────────────────────────────────────────────────┤
│  src/app/                    │  data/                       │
│  ├─ page.tsx (首页)          │  ├─ gen1/*.yaml              │
│  ├─ [cardId]/page.tsx (详情) │  ├─ gen2/*.yaml              │
│  ├─ evolution/page.tsx       │  └─ evolution-chains.yaml    │
│  ├─ rarity/page.tsx          │                              │
│  └─ battle-rules/page.tsx    │  public/cards/               │
│                              │  ├─ gen1/                    │
│  src/components/             │  └─ gen2/                    │
│  ├─ CardCircle.tsx           │                              │
│  ├─ CardDetail.tsx           │                              │
│  ├─ LenticularFlip.tsx       │                              │
│  ├─ EvolutionChain.tsx       │                              │
│  ├─ RarityBadge.tsx          │                              │
│  └─ FilterBar.tsx            │                              │
└─────────────────────────────────────────────────────────────┘
```

## 数据层

### 卡片数据结构

```typescript
// src/lib/types.ts
export interface Card {
  id: string;
  generation: 1 | 2;
  name: { zh: string; ja: string };
  number: string;
  attribute: string;
  rarity: 'common' | 'rare' | 'ultra-rare' | 'legendary';
  evolution_stage: number;
  evolves_from?: string | null;
  evolves_to?: string[];
  effect_type: 'evolution' | 'attack' | 'triple';
  image_front: string;
  image_frame_a: string;
  image_frame_b: string;
  image_frame_c?: string;
  back: CardBack;
}

export interface CardBack {
  skill: string;
  dp_attack: number;
  dp_defense: number;
  dp_speed?: number;
  height: string;
  weight: string;
  description: string;
  character_type?: 'pokemon' | 'trainer';
}
```

### 数据加载

- 构建时读取 `data/` 目录下的 YAML 文件
- 生成静态 JSON 供页面使用
- 新增卡片只需添加 YAML 文件

## 视觉系统

### 色彩系统

```css
:root {
  --color-primary: #f97316;        /* 奇多橙 */
  --color-bg-warm: #fffbeb;        /* 暖米黄背景 */
  --color-card-bg: #fef7ed;        /* 卡片容器 */
  --color-rare-glow: #ef4444;      /* 稀有发光 */
  --color-legendary-glow: #8b5cf6; /* 传说发光 */
  --color-text-primary: #78350f;   /* 深棕文字 */
  --color-text-secondary: #a16207; /* 浅棕文字 */
  --color-border: #fde68a;         /* 暖金边框 */
}
```

### 设计原则

- 圆形元素为主（呼应旋风卡）
- 稀有度越高视觉权重越大
- 暖色系 + 怀旧质感
- 光栅效果用 CSS 3D transform

## 页面结构

### 1. 首页 (page.tsx)

- 稀有度气泡网格布局
- 搜索栏 + 属性/代际/稀有度筛选
- 两代卡片 Tab 切换
- 悬停显示 tooltip

### 2. 单卡详情 ([cardId]/page.tsx)

- 面包屑导航
- 圆形卡片居中 + 光栅翻转模拟
- 进化链导航
- 背面 DP 数据展示
- 稀有度信息

### 3. 进化链 (evolution/page.tsx)

- 按进化关系分组
- 横排串联展示
- 按属性/世代分区

### 4. 稀有度榜 (rarity/page.tsx)

- 按稀有度分档
- 传说级大卡片置顶
- 当年交换行情描述

### 5. 对战规则 (battle-rules/page.tsx)

- 规则说明 + 流程动画
- DP 数值案例

## 非功能需求

- Lighthouse > 90
- 响应式（移动/平板/桌面）
- 语义化 HTML
- 仅中文（精灵名保留日文）
