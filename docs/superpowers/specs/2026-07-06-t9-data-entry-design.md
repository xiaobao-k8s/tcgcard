# T9 数据录入 + 图片生成方案设计

> 设计日期：2026-07-06
> 状态：待评审
> 作者：Claude（brainstorming 阶段）

## 一、背景与目标

### 1.1 背景

奇多神奇宝贝卡片百科网站（T1-T8）已完成框架和页面开发。当前仅有 3 张示例卡片数据（小火龙、喷火龙、妙蛙种子），需要补全完整的 149 张卡片数据：
- 第一代旋风圆卡：56 张
- 第二代方形比斗卡：93 张（含 3 张人物卡）

### 1.2 目标

1. **建立标准化的数据录入规则**，确保数据一致性
2. **设计两种图片生成方案**（52poke 爬取 + AI 生图），供社区选择
3. **支持两种贡献模式**：
   - GitHub PR 在线贡献
   - 本地 clone 自主迭代（用户自己玩、自己改）
4. **先产出 20-30 张代表性卡片**，验证规则可行性，再开放社区批量贡献

## 二、数据录入规则

### 2.1 YAML Schema 规范

每张卡片对应一个 YAML 文件，文件命名规则：`{card-id}.yaml`

#### ID 命名规则

| 代 | 前缀 | 示例 | 说明 |
|---|------|------|------|
| 第一代旋风卡 | `xfd-` | `xfd-001`, `xfd-056` | 56 张，按图鉴编号排序 |
| 第二代比斗卡 | `ybd-` | `ybd-001`, `ybd-093` | 93 张，按铺货顺序排序 |

#### 完整字段定义

```yaml
# === 基础信息 ===
id: "xfd-001"                    # 唯一标识，{前缀}-{编号}
generation: 1                    # 代际：1=旋风卡, 2=比斗卡
name:
  zh: "小火龙"                   # 中文名（大陆正版译名）
  ja: "ヒトカゲ"                 # 日文名
number: "004"                    # 全国图鉴编号（字符串，补零）
attribute: "火"                  # 属性（见 2.2 属性枚举）
rarity: "common"                 # 稀有度（见 2.3 稀有度枚举）

# === 进化链 ===
evolution_stage: 1               # 进化阶段：1=基础, 2=中级, 3=最终
evolves_from: null               # 前一段进化的 card-id，基础形态为 null
evolves_to:                      # 后一段进化的 card-id 数组（无进化为空数组）
  - "xfd-002"

# === 光栅效果 ===
effect_type: "evolution"         # 光栅效果类型（见 2.4 效果类型枚举）

# === 图片路径 ===
image_front: "/cards/gen1/xfd-001-front.png"       # 卡片正面主图
image_frame_a: "/cards/gen1/xfd-001-frame-a.png"   # 光栅帧 A（常态/进化前）
image_frame_b: "/cards/gen1/xfd-001-frame-b.png"   # 光栅帧 B（动作/进化后）
image_frame_c: "/cards/gen1/xfd-001-frame-c.png"   # 光栅帧 C（仅二代三变卡）

# === 背面数据 ===
back:
  skill: "火花"                  # 经典技能（1-2个）
  dp_attack: 50                  # DP 攻击值
  dp_defense: 40                 # DP 防御值
  dp_speed: 50                   # DP 速度值（仅第二代必填）
  height: "0.6m"                 # 身高
  weight: "8.5kg"                # 体重
  description: "背上的火焰代表生命力。"  # 图鉴描述（一句话）
  character_type: "pokemon"      # 卡片类型：pokemon=精灵, trainer=人物（仅二代）
```

### 2.2 属性枚举

18 种属性，使用中文单字：

```
火、水、草、电、超能力、格斗、毒、地面
岩石、虫、飞行、幽灵、冰、龙
一般、钢、恶、妖精
```

> 注：钢、恶、妖精为金银版新增属性，仅第二代卡片使用。

### 2.3 稀有度枚举

| 值 | 标签 | 星级 | 第一代数量 | 第二代数量 | 说明 |
|---|------|------|-----------|-----------|------|
| `common` | 普通 | ★☆☆☆☆ | ~30 | ~45 | 每包都有，重复率极高 |
| `rare` | 稀有 | ★★☆☆☆ | ~15 | ~25 | 偶尔能抽到 |
| `ultra-rare` | 极稀有 | ★★★☆☆ | ~8 | ~12 | 能换 5-10 张普通卡 |
| `legendary` | 传说 | ★★★★☆ | 3 | 5 | 几十包未必出一张 |

**第一代传奇卡片（5张）**：迷你龙、哈克龙、快龙、超梦、梦幻

**第二代传奇卡片（5张）**：洛奇亚、凤王、雪拉比、班基拉斯、暴鲤龙

### 2.4 光栅效果类型枚举

| 值 | 说明 | 帧数 | 适用范围 |
|---|------|------|----------|
| `evolution` | 进化前后对比 | 2 帧 (A/B) | 一代/二代有进化链的卡片 |
| `attack` | 攻击动作切换 | 2 帧 (A/B) | 无进化链的卡片（如超梦） |
| `triple` | 常态→蓄力→大招 | 3 帧 (A/B/C) | 仅二代部分卡片 |

### 2.5 DP 数值范围规则

DP 数值按稀有度分档，同稀有度内按进化阶段微调：

| 稀有度 | 基础形态 | 中级形态 | 最终形态 | 无进化 |
|--------|---------|---------|---------|--------|
| common | ATK 30-50, DEF 30-50, SPD 30-50 | ATK 45-65, DEF 45-65, SPD 45-65 | ATK 55-75, DEF 55-75, SPD 55-75 | — |
| rare | ATK 60-80, DEF 60-80, SPD 60-80 | ATK 75-95, DEF 75-95, SPD 75-95 | ATK 85-105, DEF 85-105, SPD 85-105 | — |
| ultra-rare | — | — | ATK 100-130, DEF 100-130, SPD 100-130 | ATK 100-130, DEF 100-130, SPD 100-130 |
| legendary | — | — | — | ATK 130-160, DEF 130-160, SPD 130-160 |

**设计原则**：
- 攻击、防御、速度三项总值 = 稀有度基准 × 3（允许 ±10% 浮动）
- 最终形态 > 中级形态 > 基础形态（进化链内数值递增）
- 同稀有度同阶段的卡片，数值可以有差异（体现特色），但差距不超过 15%

### 2.6 当年交换行情文案规则

在稀有度榜单页面展示，按以下模板生成：

| 稀有度 | 行情模板 | 示例 |
|--------|---------|------|
| common | "每包基本都有，重复率极高，交换时1换1" | 皮卡丘：每包基本都有，重复率极高 |
| rare | "偶尔能抽到，交换时比较抢手，可换2-3张普通卡" | 火恐龙：偶尔能抽到，可换2张普通卡 |
| ultra-rare | "一包几十包未必出一张，能换5-10张普通卡" | 喷火龙：一包几十包未必出一张，能换5-10张普通卡 |
| legendary | "全校没几个人有，硬通货，{具体行情}" | 快龙：1张快龙能换20张普通卡，整个小学没几个人有 |

## 三、图片生成方案

### 3.1 方案 A：52poke 精灵立绘爬取

#### 数据来源

52poke 神奇宝贝百科（wiki.52poke.com）提供完整的精灵立绘资源。

#### URL 规则

```
# 官方 sprites 规则（需验证）
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{number}.png

# 示例
# 小火龙 #004: .../official-artwork/4.png
# 喷火龙 #006: .../official-artwork/6.png
```

#### 处理流程

```bash
# 1. 下载原图
curl -o raw.png "https://.../official-artwork/{number}.png"

# 2. 裁切为正方形（精灵居中）
# 圆形卡：400×400px
# 方形卡：500×500px

# 3. 生成光栅帧（可选，后期用 CSS 模拟翻转效果）
```

#### 优缺点

| 优点 | 缺点 |
|------|------|
| 官方风格统一，辨识度高 | 不是奇多卡片原始风格 |
| 资源完整，覆盖所有精灵 | 需要处理图片版权 |
| 下载即用，无需生成 | 无法体现光栅3D效果 |

#### 版权声明

52poke 的精灵图片版权归 Nintendo/Game Freak/The Pokémon Company 所有。本站为粉丝怀旧项目，非商业用途，属于合理使用（Fair Use）。需在 README 中声明版权信息。

### 3.2 方案 B：AI 生图提示词模板（推荐）

#### 设计理念

AI 生图可以生成**符合奇多卡片风格**的图片，比 52poke 立绘更有怀旧感。社区贡献者可以用 ChatGPT / Midjourney / Stable Diffusion 等工具生成。

#### 通用提示词模板

```
A Pokemon card illustration of [宝可梦中文名] ([宝可梦英文名]), 
designed in the style of early 2000s Chinese snack card (Cheetos Pokemon lenticular card, 2001).

Character: [宝可梦描述，如 "a small fire lizard with a flame on its tail"]
Pose: [姿态描述]
Element effects: [属性特效，如 "small flames around the body"]
Background: [背景，如 "gradient orange to yellow, circular card frame"]

Style requirements:
- Retro 2000s anime aesthetic, nostalgic Chinese snack card art style
- Vibrant saturated colors, bold outlines
- Circular card composition (diameter 4cm feel)
- Lenticular card look: slight 3D depth, glossy surface feel
- Front-facing character, dynamic but clear silhouette
- Clean illustration, no text overlay
- High quality, 400x400px resolution target
```

#### 按稀有度调整的提示词修饰

**common（普通）**：
```
Simple pose, standing or sitting calmly.
Minimal element effects, clean and friendly.
Soft background gradient.
```

**rare（稀有）**：
```
Dynamic action pose, showing personality.
Moderate element effects, [属性] energy visible.
Brighter background with subtle pattern.
```

**ultra-rare（极稀有）**：
```
Dramatic power pose, full body visible.
Strong element effects, glowing aura.
Rich gradient background with light rays.
Holographic shimmer effect on edges.
```

**legendary（传说）**：
```
Epic legendary pose, commanding presence.
Full element aura, reality-bending effects.
Cosmic/dramatic background with depth.
Pronounced holographic rainbow shimmer.
Most detailed and ornate illustration.
```

#### 按属性调整的元素特效

| 属性 | 元素特效描述 |
|------|-------------|
| 火 | small flames, fire particles, warm orange-red glow |
| 水 | water droplets, flowing waves, cool blue shimmer |
| 草 | leaves, vines, green nature energy |
| 电 | lightning sparks, electric bolts, yellow crackling |
| 超能力 | psychic aura, purple energy waves, floating objects |
| 格斗 | fighting stance, impact lines, red power burst |
| 龙 | dragon scales shimmer, ancient power glow, purple-gold aura |
| 冰 | ice crystals, frost particles, cold blue-white glow |
| 幽灵 | ghostly transparency, purple shadow wisps |
| ... | （其余属性类似） |

#### 光栅帧生成规则

对于 `effect_type: evolution` 的卡片，需要生成两帧：

```
Frame A (进化前): 
  [基础提示词] + "showing [基础形态名称] in early evolution stage, smaller size"

Frame B (进化后):
  [基础提示词] + "showing [进化形态名称] in evolved form, larger size, more powerful"
```

对于 `effect_type: triple` 的卡片，需要生成三帧：

```
Frame A (常态): "calm standing pose, no special effects"
Frame B (蓄力): "gathering energy pose, element effects building up"
Frame C (大招): "full power attack pose, maximum element effects, dramatic"
```

#### 优缺点

| 优点 | 缺点 |
|------|------|
| 可以生成符合奇多风格的图片 | 需要 AI 生图工具 |
| 光栅帧可以分别生成，效果更真实 | 质量一致性需要人工把控 |
| 社区可以发挥创意 | 生成成本（API 调用费用） |
| 风格可以统一 | 部分精灵可能生成效果不理想 |

### 3.3 图片命名规范

```
public/cards/
├── gen1/                              # 第一代旋风圆卡
│   ├── xfd-001-front.png             # 正面主图（精灵立绘）
│   ├── xfd-001-frame-a.png           # 光栅帧 A
│   ├── xfd-001-frame-b.png           # 光栅帧 B
│   └── ...
├── gen2/                              # 第二代方形比斗卡
│   ├── ybd-001-front.png
│   ├── ybd-001-frame-a.png
│   ├── ybd-001-frame-b.png
│   ├── ybd-001-frame-c.png           # 三变卡才有 frame-c
│   └── ...
└── placeholders/                      # 占位图（无图片时使用）
    ├── common-placeholder.png
    ├── rare-placeholder.png
    ├── ultra-rare-placeholder.png
    └── legendary-placeholder.png
```

**图片规格**：
- 圆形卡（gen1）：400×400px，PNG，透明背景
- 方形卡（gen2）：500×500px，PNG，透明背景
- 文件大小：< 200KB

## 四、贡献模式设计

### 4.1 模式 A：GitHub PR 贡献

适合想分享自己的卡片数据/图片给社区的贡献者。

```
1. Fork 仓库
2. 创建分支：git checkout -b add-card-{card-id}
3. 创建 YAML 文件：data/gen1/{card-id}.yaml
4. 添加图片：public/cards/gen1/{card-id}-*.png
5. 运行验证：pnpm run validate
6. 提交 PR，描述卡片信息
7. CI 自动检查格式
8. Review 合并
```

**PR 模板**：
```markdown
## 新增卡片：{中文名} ({card-id})

- 稀有度：{rarity}
- 属性：{attribute}
- 进化链：{evolution chain}
- 图片来源：{52poke / AI生图 / 自拍}
- DP 数值依据：{参考来源}
```

### 4.2 模式 B：本地自主迭代

适合想自己玩、自己改、不打算提交 PR 的用户。

**使用场景**：
- 用户 clone 仓库后，自己添加缺少的卡片
- 用户想修改已有的 DP 数值
- 用户想添加非官方的自定义卡片
- 用户想本地部署自己的版本

**设计要点**：
1. **零门槛启动**：clone 后 `pnpm install && pnpm dev` 即可运行
2. **渐进式添加**：不需要一次添加全部 149 张，可以一张一张加
3. **容错设计**：缺少的图片自动显示占位图，不影响页面渲染
4. **本地预览**：添加卡片后实时在浏览器看到效果

**文件结构**（面向本地迭代用户）：
```
tcgcard/
├── data/                    # 卡片数据目录
│   ├── gen1/                # 添加 YAML 文件即可
│   └── gen2/
├── public/cards/            # 卡片图片目录
│   ├── gen1/                # 放入图片即可
│   └── gen2/
├── docs/contributing/       # 贡献指南
│   ├── DATA_RULES.md        # 数据规则（本文件）
│   └── IMAGE_GUIDE.md       # 图片生成指南
└── scripts/
    ├── validate-cards.ts    # 数据验证脚本
    └── generate-template.ts # 卡片模板生成器
```

**卡片模板生成器**：

社区用户可以运行命令自动生成空白模板：

```bash
# 生成一张新卡片的 YAML 模板
pnpm run new-card -- --id xfd-025 --gen 1

# 输出：data/gen1/xfd-025.yaml（预填基础字段）
```

### 4.3 两种模式的对比

| 维度 | PR 贡献 | 本地迭代 |
|------|---------|---------|
| 目标 | 分享给社区 | 个人使用/实验 |
| 数据验证 | 需要（CI 检查） | 可选 |
| 图片质量 | 需要把控 | 随意 |
| 文档要求 | 需要 PR 描述 | 不需要 |
| 技术门槛 | 需要 Git 知识 | 基本无 |

## 五、验证脚本设计

### 5.1 `scripts/validate-cards.ts`

验证所有 YAML 文件的格式和内容正确性：

```
检查项：
1. YAML 语法正确性
2. 必填字段完整性（id, generation, name, attribute, rarity, etc.）
3. 字段值合法性（属性枚举、稀有度枚举、效果类型枚举）
4. 进化链一致性（evolves_to 引用的卡片必须存在）
5. DP 数值范围合规（按稀有度检查）
6. 图片文件存在性（可选，缺失时 warn 不 error）
7. ID 命名规范（前缀-编号）
8. 无重复 ID
```

### 5.2 `scripts/generate-template.ts`

生成新卡片的 YAML 模板：

```
输入：card-id, generation
输出：预填基础字段的 YAML 文件

预填内容：
- id: 输入值
- generation: 输入值
- name: {zh: "", ja: ""}（待填写）
- number: 自动提取编号
- attribute: ""（待填写）
- rarity: "common"（默认）
- evolution_stage: 1（默认）
- evolves_from: null
- evolves_to: []
- effect_type: "evolution"
- back.dp_attack/defense/speed: 按 rarity 默认中值
```

## 六、实施计划

### Phase 1：规则文档 + 验证工具（当前）

- [ ] 完善本设计文档，通过评审
- [ ] 编写 `docs/contributing/DATA_RULES.md`
- [ ] 编写 `docs/contributing/IMAGE_GUIDE.md`
- [ ] 实现 `scripts/validate-cards.ts`
- [ ] 实现 `scripts/generate-template.ts`

### Phase 2：代表性卡片（20-30 张）

- [ ] 第一代 56 张中选取 15 张代表性卡片
- [ ] 第二代 93 张中选取 10 张代表性卡片
- [ ] 为每张卡片生成 YAML 数据
- [ ] 为每张卡片生成 AI 绘图提示词
- [ ] 验证数据正确性

### Phase 3：社区开放

- [ ] 开放 GitHub 仓库
- [ ] 编写 README 贡献指南
- [ ] 配置 CI 自动验证
- [ ] 发布第一批 AI 绘图提示词供社区使用

### Phase 4：数据补全

- [ ] 社区贡献补全剩余卡片
- [ ] 逐步替换 52poke 立绘为 AI 生图
- [ ] 数据质量持续优化

## 七、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| AI 生图质量不稳定 | 视觉不统一 | 提供详细提示词模板 + 示例图 |
| DP 数值争议 | 社区讨论 | 标注"参考值"，允许社区投票修改 |
| 进化链数据不完整 | 页面显示异常 | 验证脚本强制检查引用完整性 |
| 52poke 图片版权 | 法律风险 | 声明非商业粉丝项目，标注来源 |
| 卡片数据记忆偏差 | 数据不准确 | 标注数据来源，开放社区修正 |

## 八、待讨论问题

1. **第一代 56 张卡片的完整列表**：需要确认具体是哪些精灵，编号对应关系
2. **DP 数值的"官方"参考**：是否有原始卡片的 DP 数值记录？还是需要社区共创？
3. **人物卡（小智/小刚/小霞）的特殊处理**：是否需要不同的 YAML 结构？
4. **图片版权策略**：是否同时提供 52poke 立绘和 AI 生图两种选项？
5. **多语言支持**：是否需要支持英文/繁体中文？
