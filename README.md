# 童年神奇卡片百科 🌀

> **童年没集齐的，来这里补全。**

一个怀旧向的**奇多神奇宝贝光栅 3D 变换卡**资料百科网站。收录 2001–2002 年大陆正版奇多粟米脆附赠的两代卡片：

- **第一代旋风圆卡**（56 张，2001 年）
- **第二代方形比斗卡**（93 张，2002 年）

在线体验：[https://xiaobao.github.io/tcgcard/](https://xiaobao.github.io/tcgcard/)

---

## ✨ 功能

| 页面 | 说明 |
|------|------|
| 🏠 卡片总览 | 稀有度气泡网格，支持属性/稀有度/搜索筛选 |
| 🔍 单卡详情 | 3D 光栅翻转动画、进化链导航、DP 对战数值 |
| ⛓️ 进化链 | 按属性/世代分组的进化关系图 |
| 💎 稀有度榜 | 从传说级到普通的分档展示 + 当年交换行情 |
| ⚔️ 对战规则 | 还原课间 DP 对战玩法 |

## 🎨 视觉风格

怀旧零食风设计：奇多橙 + 暖色系，圆形卡面，光栅质感。

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS 4
- **数据**: YAML 本地文件 (SSG)
- **部署**: GitHub Pages / Vercel
- **图片**: PokeAPI 官方立绘 + ChatGPT AI 生图

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:3001
```

## 📦 命令

| 命令 | 功能 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 静态导出到 `out/` |
| `pnpm validate` | 验证所有卡片数据 |
| `pnpm new-card` | 生成新卡片 YAML 模板 |
| `pnpm gen-prompts` | 生成 ChatGPT 生图提示词 |
| `pnpm import-images` | 导入 AI 生成图片 |
| `pnpm download-images` | 下载 PokeAPI 图片到本地 |

## 📊 数据结构

卡片数据在 `data/gen1/` 和 `data/gen2/` 目录下，每张卡片一个 YAML 文件：

```yaml
id: "xfd-001"
generation: 1
name:
  zh: "小火龙"
  ja: "ヒトカゲ"
number: "004"
attribute: "火"
rarity: "common"
# ... 更多字段见文档
```

## 🤝 贡献指南

### 数据贡献
1. Fork 仓库
2. 创建 YAML 文件到 `data/gen{1,2}/` (参考现有文件)
3. 运行 `pnpm run validate` 验证
4. 提交 PR

### 图片贡献
1. 运行 `pnpm run gen-prompts` 生成提示词
2. 用 ChatGPT 生成图片
3. 放入 `staging/` 目录
4. 运行 `pnpm run import-images` 导入
5. 详细指南见 `docs/contributing/`

## 📜 版权声明

- 神奇宝贝/宝可梦版权归 **Nintendo / Game Freak / The Pokémon Company** 所有
- 精灵立绘来自 [PokeAPI](https://pokeapi.co/)（CC 友好）
- 本项目为**非商业粉丝怀旧项目**，属于合理使用（Fair Use）
- AI 生成图片为原创设计，风格灵感来自 2000 年代日式动画
