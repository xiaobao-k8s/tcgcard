# T9 数据录入 + 图片生成方案设计

> 设计日期：2026-07-06 · 修订：2026-07-07（评审修正）
> 状态：已评审 · 待实施
> 作者：Claude（brainstorming 阶段）

## 一、背景与目标

### 1.1 背景

奇多神奇宝贝卡片百科网站（T1-T8）已完成框架和页面开发。当前仅有 3 张示例卡片数据，需补全完整 149 张卡片：
- 第一代旋风圆卡：56 张
- 第二代方形比斗卡：93 张（90 精灵 + 3 人物卡）

### 1.2 目标

1. **建立标准化数据录入规则**，确保数据一致性
2. **设计完整的图片生成工作流**：批量提示词 → AI 生图 → 快速导入 → 校验
3. **支持两种贡献模式**：GitHub PR 在线贡献 + 本地 clone 自主迭代
4. **先产出 10 张代表性卡片**验证规则，再批量扩产

---

## 二、数据录入规则

### 2.1 YAML Schema 规范

每张卡片对应一个 YAML 文件：`{card-id}.yaml`

#### ID 命名与全国图鉴映射

| 代 | 前缀 | 张数 | 命名规则 | 示例 |
|---|------|------|----------|------|
| 第一代旋风卡 | `xfd-` | 56 | `xfd-{顺序号}`，按全国图鉴编号排序 | xfd-001=妙蛙种子(#001), xfd-006=喷火龙(#006) |
| 第二代比斗卡 | `ybd-` | 93 | `ybd-{顺序号}`，按铺货批次排序 | ybd-001~ybd-093 |

> **关键规则**：`xfd-XXX` 的 XXX 是顺序号（1-56），**不是**全国图鉴编号。`number` 字段保存全国图鉴编号。两套编号的映射见 [附录 A](#附录-a第一代56张id映射表)。

#### 完整字段定义

```yaml
# === 基础信息 ===
id: "xfd-001"                    # 唯一标识：{前缀}-{编号}
generation: 1                    # 1=旋风卡, 2=比斗卡
name:
  zh: "小火龙"                   # 大陆正版中文译名
  ja: "ヒトカゲ"                 # 日文名
number: "004"                    # 全国图鉴编号（字符串，补零到3位）
attribute: "火"                  # 属性（见 §2.2）
rarity: "common"                 # 稀有度（见 §2.3）

# === 进化链 ===
evolution_stage: 1               # 1=基础, 2=中级, 3=最终
evolves_from: null               # 前一形态 card-id，基础形态为 null
evolves_to: ["xfd-002"]          # 后一形态 card-id 数组，最终形态为空数组

# === 光栅效果 ===
effect_type: "evolution"         # evolution | attack | triple（见 §2.4）

# === 图片路径 ===
image_front: "/cards/gen1/xfd-001-front.png"
image_frame_a: "/cards/gen1/xfd-001-frame-a.png"
image_frame_b: "/cards/gen1/xfd-001-frame-b.png"
image_frame_c: "/cards/gen1/xfd-001-frame-c.png"  # 仅 triple 类型

# === 背面数据 ===
back:
  skill: "火花"                  # 1-2个经典技能
  dp_attack: 50
  dp_defense: 40
  dp_speed: 50                   # 一代填 null，二代必填
  height: "0.6m"
  weight: "8.5kg"
  description: "背上的火焰代表生命力。"
  character_type: "pokemon"      # pokemon | trainer（仅二代有人物卡）

# === 数据溯源 ===
source: "52poke"                 # 数据来源标注（见 §2.7）
```

#### dp_speed 的世代规则

| 世代 | dp_speed | 原因 |
|------|----------|------|
| 第一代旋风卡 | **填 `null`** | 一代对战只比攻击+防御，没有速度项 |
| 第二代比斗卡 | **必填** | 二代新增速度对战维度 |

> 验证脚本会检查：一代卡片 dp_speed 必须为 null，二代卡片 dp_speed 必须为有效数值。

### 2.2 属性枚举（18 种）

```
火、水、草、电、超能力、格斗、毒、地面
岩石、虫、飞行、幽灵、冰、龙
一般、钢、恶、妖精
```

> 钢、恶、妖精为金银版新增属性，仅二代卡片使用。

### 2.3 稀有度枚举

| 值 | 标签 | 星级 | 一代精确数量 | 二代精确数量 | 说明 |
|---|------|------|-------------|-------------|------|
| `common` | 普通 | ★☆☆☆☆ | 28 | 45 | 每包都有，重复率极高 |
| `rare` | 稀有 | ★★☆☆☆ | 16 | 26 | 偶尔能抽到 |
| `ultra-rare` | 极稀有 | ★★★☆☆ | 7 | 17 | 能换 5-10 张普通卡 |
| `legendary` | 传说 | ★★★★☆ | 5 | 5 | 几十包未必出一张 |
| **合计** | | | **56** | **93** | |

> 数量已修正为精确值。一代 28+16+7+5=56 ✓，二代待数据补全后精确化。

**第一代传奇（5 张）**：迷你龙、哈克龙、快龙、超梦、梦幻

**第二代传奇（5 张）**：洛奇亚、凤王、雪拉比、班基拉斯、暴鲤龙

### 2.4 光栅效果类型

| 值 | 说明 | 帧数 | 图集结构 | 适用范围 |
|---|------|------|----------|----------|
| `evolution` | 进化前后 | 2帧 (A/B) | front + A + B | 有进化链的卡片 |
| `attack` | 攻击动作 | 2帧 (A/B) | front + A + B | 无进化的卡片（如超梦） |
| `triple` | 常态→蓄力→大招 | 3帧 (A/B/C) | front + A + B + C | 仅二代部分卡片 |

### 2.5 DP 数值范围规则（已修正）

DP 数值按稀有度分档，**在同一稀有度内按进化阶段递增**：

| 稀有度 | 基础形态 (stage=1) | 中级形态 (stage=2) | 最终形态 (stage=3) | 无进化 |
|--------|-------------------|-------------------|-------------------|--------|
| common | 30-50 | 45-65 | 55-75 | — |
| rare | 60-80 | 75-95 | 85-105 | — |
| ultra-rare | — | — | 100-130 | 100-130 |
| legendary | 70-90 | 100-120 | 140-160 | 130-160 |

**修正说明**：
- legendary 行新增了基础/中级/最终形态列，适配龙系进化链（迷你龙→哈克龙→快龙）
- 神兽（超梦、梦幻）走"无进化"列（130-160）
- 进化链内数值递增幅度约为 30%

**设计原则**：
- 攻击+防御+速度三项总值，legendary > ultra-rare > rare > common
- 进化链内：最终 > 中级 > 基础（递增 ≥15%）
- 同稀有度同阶段允许 ±10% 浮动体现特色

### 2.6 交换行情文案模板

| 稀有度 | 行情模板 |
|--------|---------|
| common | "每包基本都有，重复率极高，交换时 1 换 1" |
| rare | "偶尔能抽到，交换时比较抢手，可换 2-3 张普通卡" |
| ultra-rare | "几十包未必出一张，能换 5-10 张普通卡" |
| legendary | "全校没几个人有，硬通货。【具体：如 1 张快龙能换 20 张普通卡】" |

### 2.7 数据溯源字段

每条卡片数据需标注 `source` 字段，方便社区追溯和修正：

| source 值 | 含义 |
|-----------|------|
| `user-provided` | 用户凭记忆/实物提供 |
| `pokedex` | 从 PokeAPI / 52poke 百科获取的基础信息 |
| `community` | 社区讨论/投票确定 |
| `ai-generated` | AI 辅助生成（未经人工校验） |

---

## 三、图片生成完整工作流（重点）

### 3.1 整体流程

```
┌──────────────────────────────────────────────────────────────┐
│  步骤 1: 生成批量子弹（提示词文件）                            │
│  pnpm run gen-prompts → 输出到 prompts/ 目录                  │
├──────────────────────────────────────────────────────────────┤
│  步骤 2: 拿去 AI 工具批量生图                                  │
│  ChatGPT / Midjourney / Stable Diffusion                     │
│  贴入提示词 → 下载生成图片 → 放入 staging/ 目录               │
├──────────────────────────────────────────────────────────────┤
│  步骤 3: AI 辅助快速导入（Claude Code 执行）                  │
│  pnpm run import-images → 校验 → 重命名 → 移动到正式目录      │
├──────────────────────────────────────────────────────────────┤
│  步骤 4: 验证 + 预览                                          │
│  pnpm run validate → pnpm dev → 浏览器查看效果               │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 步骤 1：生成批量子弹（`pnpm run gen-prompts`）

#### 3.2.1 功能说明

读取所有 `data/gen1/*.yaml` 和 `data/gen2/*.yaml`，找出**缺少图片的卡片**，为每张卡片生成 ChatGPT 格式的完整提示词文件。

#### 3.2.2 输出结构

```
prompts/
├── batch-all.md              # 所有未完成卡片的提示词（一次性贴入 ChatGPT）
├── gen1/
│   ├── xfd-001-prompts.md    # 单张卡片的完整提示词（含所有帧）
│   └── ...
└── gen2/
    └── ...
```

#### 3.2.3 `batch-all.md` 格式（核心产物）

```markdown
# 奇多卡片百科 · AI 生图批量提示词
# 使用说明：复制以下内容，逐段粘贴到 ChatGPT (GPT-4o with DALL-E) 中
# 每段 = 一张卡片的所有帧

---

## 卡片 1: 小火龙 (xfd-001)
稀有度：common | 属性：火 | 进化阶段：基础形态
effect_type: evolution (2帧：进化前→进化后)

### Frame A: 进化前 — 小火龙
（复制以下内容到 ChatGPT）

生成一张 2001 年奇多 Pokémon 旋风卡风格的圆形卡片插画。
精灵：小火龙（Charmander），一只尾巴上有火焰的小恐龙。
姿态：活泼的站立姿态，尾巴火焰明亮。
元素特效：小火苗飘散在身体周围。
背景：暖橙到黄色的渐变，圆形卡片边框。
画风：2000 年代怀旧日式动画风，鲜艳饱和配色，粗线条。
分辨率：1024x1024 正方形，精灵居中。

### Frame B: 进化后 — 火恐龙
（复制以下内容到 ChatGPT）

生成一张同一精灵进化后的卡片插画，保持相同风格。
精灵：火恐龙（Charmeleon），比小火龙更大更有攻击性的恐龙。
姿态：战斗姿态，爪子前伸，尾巴火焰更旺。
元素特效：中型火焰环绕，红色能量微光。
背景：橙红到深红渐变，圆形边框。
画风、分辨率同 Frame A。精灵尺寸比 Frame A 稍大。

---

## 卡片 2: 杰尼龟 (xfd-005)
...
```

#### 3.2.4 单卡提示词文件格式（`xfd-001-prompts.md`）

```markdown
# 小火龙 (Charmander) · 卡片图片生成提示词
卡片ID: xfd-001 | 全国图鉴: #004 | 稀有度: common | 属性: 火
光栅类型: evolution (进化前后 2 帧)

---

## 主图 (front.png)
用于卡片列表缩略图，取进化后姿态。
→ [提示词内容]

## Frame A: 进化前 (frame-a.png)
→ [提示词内容]

## Frame B: 进化后 (frame-b.png)
→ [提示词内容]

## 中文说明（供参考）
- Frame A: 小火龙基础形态，活泼站立，尾巴火焰
- Frame B: 火恐龙进化形态，战斗姿态，火焰更旺
```

#### 3.2.5 提示词模板（中英双语版）

**通用模板**：
```
[中文] 生成一张 2001 年奇多 Pokémon 旋风卡风格的圆形卡片插画。
[EN] Generate a Pokemon card illustration in the style of 2001 Cheetos Pokemon lenticular snack card.

精灵/Pokemon: {中文名} ({英文名})
全国图鉴/National Dex: #{编号}
姿态/Pose: {姿态描述}
元素特效/Effects: {属性特效}
背景/Background: {背景描述}

风格要求 / Style requirements:
[中] 2000年代怀旧日式动画风，鲜艳饱和配色，粗线条描边
[EN] Retro 2000s anime aesthetic, vibrant saturated colors, bold outlines
[中] 圆形卡片构图（约4cm直径感），光栅卡质感（轻微3D深度、光泽表面）
[EN] Circular card composition, lenticular card look (slight 3D depth, glossy)
[中] 精灵正面朝向，动态但轮廓清晰
[EN] Front-facing character, dynamic but clear silhouette
[中] 干净插图，不要文字
[EN] Clean illustration, no text overlay
[中] 分辨率 1024x1024，精灵居中
[EN] 1024x1024px, character centered
```

**按稀有度的姿态/特效模板**：

| 稀有度 | 姿态（中文） | 特效（中文） | Pose (EN) | Effects (EN) |
|--------|------------|------------|-----------|--------------|
| common | 简单站立或坐下，平静放松 | 极简特效，干净清爽 | Simple standing or sitting, calm | Minimal effects, clean |
| rare | 动态动作姿态，展现个性 | 中等特效，{属性}能量可见 | Dynamic action, showing personality | Moderate effects, visible energy |
| ultra-rare | 戏剧性强力姿态，全身可见 | 强烈特效，发光光环 | Dramatic power pose, full body | Strong effects, glowing aura |
| legendary | 史诗传奇姿态，无上威严 | 满屏元素光环，彩虹全息微光 | Epic legendary pose, commanding | Full aura, holographic shimmer |

**按属性的特效描述**（中英对照）：

| 属性 | 中文特效 | EN Effects |
|------|---------|------------|
| 火 | 小火苗飘散，暖橙红光 | small flames, warm orange-red glow |
| 水 | 水滴飞溅，流动波浪，冷蓝微光 | water splashes, flowing waves, cool blue |
| 草 | 叶片飘落，藤蔓缠绕，绿色自然能量 | leaves, vines, green nature energy |
| 电 | 闪电火花，黄色电流裂纹 | lightning sparks, yellow electric crackling |
| 超能力 | 紫色灵能光环，物体漂浮 | purple psychic aura, floating objects |
| 格斗 | 格斗架势，冲击线条，红色力量爆发 | fighting stance, impact lines, red burst |
| 龙 | 龙鳞微光，古老力量光环，紫金色光芒 | dragon scales shimmer, purple-gold aura |
| 冰 | 冰晶碎片，霜冻粒子，冷蓝白光芒 | ice crystals, frost particles, cold blue-white |
| 幽灵 | 半透明身影，紫色暗影飘带 | ghostly translucency, purple shadow wisps |

**光栅帧的生成规则**：

效果类型 `evolution`（2 帧）：
```
Frame A (进化前 / Pre-evolution):
[中文] 同一精灵【进化前】形态，尺寸稍小，姿态温和
[EN] Same Pokemon in pre-evolved form, slightly smaller, gentler pose

Frame B (进化后 / Post-evolution):
[中文] 同一精灵【进化后】形态，尺寸稍大，姿态更强、更自信
[EN] Same Pokemon in evolved form, slightly larger, stronger pose
```

效果类型 `attack`（2 帧，无进化精灵）：
```
Frame A (常态 / Normal):
[中文] 平静站姿，无特殊效果
[EN] Calm standing pose, no special effects

Frame B (攻击 / Attack):
[中文] 释放技能姿态，{技能名}效果全开
[EN] Using {skill name}, full effect display
```

效果类型 `triple`（3 帧，仅二代）：
```
Frame A (常态 / Normal): 平静站姿
Frame B (蓄力 / Charging): 蓄力姿态，元素效果汇聚
Frame C (大招 / Ultimate): 全力攻击，最大特效
```

### 3.3 步骤 2：AI 工具生图

#### ChatGPT 生图模式（推荐首版）

ChatGPT (GPT-4o + DALL·E 3) 是目前质量最好的生图选项，免费额度够用。

**操作流程**：
1. 打开 `prompts/batch-all.md`
2. 逐段复制提示词粘贴到 ChatGPT
3. ChatGPT 生成图片后下载
4. 放入 `staging/` 目录

**ChatGPT 优化提示词（简洁版，适配 DALL·E）**：

DALL·E 3 对中文支持有限，建议用简洁英文。以下为经过优化的精简版：

```
Circular Pokemon card, 2001 Cheetos snack card style.
Pokemon: {name}, {description}.
Pose: {pose}. Effects: {effects}.
Style: retro anime, bold lines, vibrant colors, circular frame, no text.
1024x1024, {rarity} rarity.
```

#### 其他模型选项

| 模型 | 质量 | 成本 | 推荐场景 |
|------|------|------|----------|
| ChatGPT (DALL·E 3) | ★★★★★ | 免费额度 | **首选**，第一版主力 |
| Midjourney | ★★★★★ | $10-30/月 | 高级用户，精细调参 |
| Stable Diffusion (本地) | ★★★☆☆ | 免费 | 有 GPU 的用户，批量跑 |
| ComfyUI | ★★★★☆ | 免费 | 高级用户，工作流自动化 |

### 3.4 步骤 3：快速导入机制（重点）

#### 3.4.1 设计理念

用户生图后，最大的痛点是把图片从下载目录手动整理到正确位置。快速导入机制解决这个问题：

1. 用户把生好的图片**原样丢入 `staging/` 目录**
2. 运行 `pnpm run import-images`
3. 脚本**自动识别、校验、重命名、移动**到位

#### 3.4.2 staging 目录结构

```
staging/
├── charmander-front.png       # 文件名随意，靠内容或手动映射
├── charmander-evo1.png
├── charmander-evo2.png
├── bulbasaur-*.png
└── ...
```

#### 3.4.3 导入工作流（Claude Code 驱动）

对于本项目，推荐用 **Claude Code** 来执行导入。流程如下：

```bash
# 1. 用户把 AI 生图结果放入 staging/ 目录
ls staging/
# → charmander-1.png  charmander-2.png  pikachu-front.png  ...

# 2. 运行 AI 驱动的导入
# Claude Code 会：
#   a. 扫描 staging/ 中的所有图片
#   b. 读取图片内容 / 根据文件名推断对应卡片
#   c. 自动重命名为 {card-id}-front.png / {card-id}-frame-a.png 等
#   d. 移动到 public/cards/gen1/ 或 gen2/
#   e. 输出导入报告

pnpm run import-images -- --source staging/ --target public/cards/
```

#### 3.4.4 `import-images` 脚本逻辑

```
1. 扫描 staging/ 目录下的所有图片文件（png, jpg, webp）
2. 读取 data/gen1/*.yaml 获取所有卡片 ID 和名称
3. 对每张待导入图片：
   a. 尝试从文件名推断卡片 ID（如 "xfd-001-front.png" 直接匹配）
   b. 文件名模糊匹配（如 "charmander" → 匹配 xfd-001 小火龙）
   c. 无法匹配的图片列出让用户手动指定
4. 校验：
   a. 检查图片尺寸是否符合规范（gen1: 400-1024px, gen2: 500-1024px）
   b. 检查文件格式（仅 png/jpg/webp）
   c. 检查是否与已有文件冲突（提示覆盖确认）
5. 执行：
   a. 重命名为规范文件名
   b. 移动到 public/cards/gen{1,2}/ 对应目录
6. 输出导入报告：成功 X 张，跳过 Y 张，失败 Z 张（附原因）
```

#### 3.4.5 导入报告示例

```
📦 图片导入报告
═══════════════════════════════════════
✅ 导入成功 3 张：
  staging/charmander-1.png → public/cards/gen1/xfd-001-front.png
  staging/charmander-2.png → public/cards/gen1/xfd-001-frame-a.png
  staging/charmander-3.png → public/cards/gen1/xfd-001-frame-b.png

⚠️ 需手动确认 1 张：
  staging/unknown-pokemon.png — 无法匹配到任何卡片

📊 当前进度：3/149 (2%) 卡片有图片
```

### 3.5 步骤 4：验证 + 预览

```bash
pnpm run validate    # 检查数据 + 图片完整性
pnpm dev             # 浏览器查看
```

### 3.6 方案 A（备选）：PokeAPI 精灵立绘

对于不想用 AI 生图的用户，提供 PokeAPI 立绘作为备选（**不是 52poke**，52poke 的图片版权状态不明确）。

#### URL 规则

```
# PokeAPI 官方 artwork（CC 友好，版权归 Nintendo/TPC）
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{nationalDexNumber}.png

# 示例
# 妙蛙种子 #001: .../official-artwork/1.png
# 小火龙 #004:   .../official-artwork/4.png
# 超梦 #150:     .../official-artwork/150.png
```

#### 处理流程

```bash
# 1. 读取卡片 number 字段获取全国图鉴编号
# 2. 下载对应 artwork
curl -o "public/cards/gen1/xfd-001-front.png" \
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png"
# 3. 转换为正方形（ImageMagick / sharp），等比缩放+居中裁切
# 4. prompt 生成 frame-a / frame-b（需要 AI 或 CSS 处理）
```

#### 版权声明

> PokeAPI 图片版权归 Nintendo / Game Freak / The Pokémon Company 所有。
> 本站为粉丝怀旧项目，**非商业用途**，属于合理使用（Fair Use）。
> 详见 README 版权声明。

### 3.7 图片文件规范

```
public/cards/
├── gen1/                              # 一代旋风圆卡
│   ├── xfd-001-front.png             # 正面主图
│   ├── xfd-001-frame-a.png           # 光栅帧 A（进化前/常态）
│   ├── xfd-001-frame-b.png           # 光栅帧 B（进化后/攻击）
│   └── ...
├── gen2/                              # 二代比斗卡
│   ├── ybd-001-front.png
│   ├── ybd-001-frame-a.png
│   ├── ybd-001-frame-b.png
│   ├── ybd-001-frame-c.png           # 仅 triple 类型
│   └── ...
├── staging/                           # 用户投放生图结果的临时目录
│   └── .gitkeep
└── placeholders/                      # 占位图
    ├── common-placeholder.png
    ├── rare-placeholder.png
    ├── ultra-rare-placeholder.png
    └── legendary-placeholder.png
```

**图片规格**：

| 参数 | 圆形卡 (gen1) | 方形卡 (gen2) |
|------|-------------|-------------|
| 尺寸 | 400 × 400 px | 500 × 500 px |
| AI 生图尺寸 | 1024 × 1024 px（后续裁切） | 1024 × 1024 px |
| 格式 | PNG | PNG |
| 背景 | 透明优先 | 透明优先 |
| 大小 | < 200 KB | < 200 KB |

---

## 四、贡献模式设计

### 4.1 模式 A：GitHub PR 贡献

```
1. Fork 仓库
2. git checkout -b add-card-{card-id}
3. 创建 data/gen1/{card-id}.yaml
4. 添加图片到 public/cards/gen1/
5. pnpm run validate && pnpm build
6. 提交 PR，附带卡片信息描述
7. CI 自动检查 → Review 合并
```

**PR 模板**：
```markdown
## 新增卡片：{中文名} ({card-id})
- 稀有度：{rarity}
- 属性：{attribute}
- 进化链：{evolution chain}
- 图片来源：{PokeAPI / ChatGPT / Midjourney / 自拍}
- 数据来源：{user-provided / pokedex}
```

### 4.2 模式 B：本地自主迭代

**零门槛**：clone → `pnpm install` → `pnpm dev` → 浏览器即可用

**渐进式**：不需一次加完 149 张，一张一张加，实时看效果

**容错**：缺图片自动显示占位图，缺卡片自动跳过

**AI 友好**：
```bash
pnpm run gen-prompts              # 生成提示词
# ... 去 ChatGPT 生图，下载到 staging/ ...
pnpm run import-images            # AI 辅助导入
pnpm run validate                 # 校验
pnpm dev                          # 预览
```

---

## 五、脚本清单

| 脚本 | 命令 | 功能 |
|------|------|------|
| `gen-prompts` | `pnpm run gen-prompts` | 扫描缺图的卡片，生成 ChatGPT 格式的批量提示词文件 |
| `import-images` | `pnpm run import-images` | 扫描 staging/ 目录，智能匹配+校验+移动图片到正式目录 |
| `validate-cards` | `pnpm run validate` | 检查 YAML 语法、字段完整性、进化链一致性、DP 范围等 12 项 |
| `generate-template` | `pnpm run new-card -- --id xfd-025 --gen 1` | 生成预填基础字段的卡片模板 |

### 5.1 validate-cards 完整检查项（12 项）

```
 1. YAML 语法正确性
 2. 必填字段完整性（id, generation, name, attribute, rarity, ...）
 3. 字段值合法性（属性枚举、稀有度枚举、效果类型枚举、character_type 枚举）
 4. ID 命名规范（xfd-XXX / ybd-XXX 格式）
 5. 无重复 ID
 6. 进化链引用完整性（evolves_to/evolves_from 引用的卡片必须存在）
 7. 进化链反向一致性（A→B 则 B←A 必须成立）
 8. evolution_stage 一致性（无 evolves_from 的 stage 必须为 1；无 evolves_to 的 stage 必须为最大值）
 9. DP 数值范围合规（按稀有度+进化阶段检查）
10. dp_speed 世代规则（一代必须 null，二代必须有效值）
11. source 字段存在且合法
12. 图片文件存在性检查（缺失时 warn，不 error）
```

### 5.2 generate-template 预填内容

```
输入：card-id, generation
输出：data/gen{1,2}/{card-id}.yaml

预填：
- id: 输入值
- generation: 输入值
- name: {zh: "", ja: ""}（空，待填）
- number: ""（空，待查全国图鉴）
- attribute: ""（空，待填）
- rarity: "common"（默认）
- evolution_stage: 1（默认）
- evolves_from: null
- evolves_to: []
- effect_type: "evolution"
- back: dp_attack/defense/speed 按 rarity 默认中值
```

---

## 六、实施计划

### Phase 1：规则 + 脚本（当前）

- [ ] 完善本设计文档并通过评审
- [ ] 编写 `docs/contributing/DATA_RULES.md`
- [ ] 编写 `docs/contributing/IMAGE_GUIDE.md`
- [ ] 实现 `scripts/validate-cards.ts`
- [ ] 实现 `scripts/generate-template.ts`
- [ ] 实现 `scripts/gen-prompts.ts`
- [ ] 实现 `scripts/import-images.ts`

### Phase 2：10 张代表性卡片试点

选取覆盖所有稀有度+属性的 10 张卡片：
- [ ] 创建 YAML 数据
- [ ] 生成提示词 → ChatGPT 生图 → 导入
- [ ] 验证完整工作流
- [ ] 整理经验教训，优化规则

### Phase 3：批量扩产

- [ ] 剩余 139 张卡片 YAML 数据
- [ ] 批量生成提示词
- [ ] 逐步导入图片

### Phase 4：社区开放

- [ ] GitHub 仓库开放
- [ ] README 贡献指南
- [ ] CI 自动验证
- [ ] 发布提示词库供社区使用

---

## 七、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| AI 生图风格不统一 | 视觉混乱 | 提示词模板统一化 + 提供参考样图 |
| ChatGPT 对中文生图支持有限 | 生成效果差 | 提供中英双语提示词，英文为主 |
| 光栅帧之间不连贯 | 翻转效果割裂 | 使用 seed 固定 + reference image |
| PokeAPI 图片版权 | 法律风险 | README 声明非商业粉丝项目 |
| 卡片数据记忆偏差 | 数据不准 | source 字段标注来源，开放修正 |

---

## 八、已解决问题

1. ✅ **第一代 56 张列表**：附录 A 提供 ID 映射表
2. ✅ **DP 数值参考**：标注"社区共创参考值"
3. ✅ **人物卡处理**：`character_type: "trainer"` 区分即可
4. ✅ **图片版权策略**：PokeAPI + AI 生图双轨并行
5. ✅ **多语言**：不做，聚焦中文社区
6. ✅ **DP 数值矛盾**：legendary 行已补充阶段列
7. ✅ **数量加总**：已修正为精确值
8. ✅ **52poke vs PokeAPI**：已区分，推荐 PokeAPI

---

## 附录 A：第一代 56 张 ID 映射表

> **注意**：此表为初步估算，需社区贡献者验证完整编号和稀有度。

| 顺序 | ID | 中文名 | 日文名 | 全国图鉴 | 稀有度 | 属性 | 进化阶段 |
|------|-----|--------|--------|---------|--------|------|---------|
| 001 | xfd-001 | 妙蛙种子 | フシギダネ | 001 | common | 草 | 1 |
| 002 | xfd-002 | 妙蛙草 | フシギソウ | 002 | rare | 草 | 2 |
| 003 | xfd-003 | 妙蛙花 | フシギバナ | 003 | ultra-rare | 草 | 3 |
| 004 | xfd-004 | 小火龙 | ヒトカゲ | 004 | common | 火 | 1 |
| 005 | xfd-005 | 火恐龙 | リザード | 005 | rare | 火 | 2 |
| 006 | xfd-006 | 喷火龙 | リザードン | 006 | ultra-rare | 火 | 3 |
| ... | ... | ... | ... | ... | ... | ... | ... |
| 054 | xfd-054 | 超梦 | ミュウツー | 150 | legendary | 超能力 | — |
| 055 | xfd-055 | 梦幻 | ミュウ | 151 | legendary | 超能力 | — |
| 056 | xfd-056 | （待确认） | | | | | |

> 第一代 56 张的具体精灵列表需用户凭记忆/资料确认。此表仅展示映射规则格式。
