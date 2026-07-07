# 审查报告: T9 Phase 1 — 数据录入 + 图片生成脚本

> 审查范围: scripts/validate-cards.ts, scripts/generate-template.ts, scripts/gen-prompts.ts, scripts/import-images.ts, package.json
> 审查日期: 2026-07-07
> 审查人: review-agent
> 对照文档: docs/superpowers/specs/2026-07-06-t9-data-entry-design.md

---

## 总体评价: **通过（含 3 个 Critical、7 个 Medium）**

四个脚本覆盖了设计文档中 Phase 1 的核心要求，CLI 交互体验良好（中文输出、清晰的分隔线、可执行的下一步提示）。但存在 3 个必须在 Phase 2 试点前修复的 Critical 级别问题，以及若干中等问题。

---

## 1. Critical 级别问题（Must Fix）

### C1: `import-images.ts` — JPG/WebP 复制后改扩展名为 `.png`，并非真正的格式转换

**文件:** `/datad/github/tcgcard/scripts/import-images.ts` (第 494-496 行)

```typescript
const finalDest = destPath.replace(/\.(jpg|jpeg|webp)$/i, '.png');
fs.copyFileSync(srcPath, finalDest);
```

当源文件为 `.jpg` 或 `.webp` 时，代码仅复制原始字节并修改文件扩展名。一个 JPEG 文件保存为 `.png` 后缀是无效的 PNG 文件——浏览器可能无法渲染，且可能破坏构建。设计文档明确要求输入支持 `png/jpg/webp`，输出应为 PNG。

**修复建议:** 使用 `sharp` 库进行实际的格式转换，或保留原始扩展名并同步更新 YAML 中的路径约定。

---

### C2: `gen-prompts.ts` — `loadAllCards()` 在每张卡片循环中被重复调用，N+1 问题

**文件:** `/datad/github/tcgcard/scripts/gen-prompts.ts` (第 199 行)

```typescript
function generateCardPrompts(info: MissingImageInfo): string {
  // ...
  const allCards = loadAllCards();  // 每张卡片调用一次
```

`generateCardPrompts()` 在 `main()` 的循环中被调用（第 379-389 行），同时又在 `generateBatchAll()` 中再次调用（第 345 行）。每次调用都从磁盘重新读取并解析所有 YAML 文件。对于 149 张卡片，这是 O(n^2) 的冗余 I/O。

**修复建议:** 在 `main()` 中加载一次卡片数据，将 `cardMap` 作为参数传递给 `generateCardPrompts()` 和 `generateBatchAll()`。

---

### C3: `generate-template.ts` — 手动拼接 YAML 字符串，`js-yaml` 导入但未使用

**文件:** `/datad/github/tcgcard/scripts/generate-template.ts` (第 95-162 行)

脚本导入了 `js-yaml`，构建了 `template` 对象（第 95-123 行），但随后忽略该对象，手动拼接 YAML 字符串（第 126-162 行）。这带来维护风险：

- Schema 变更时，对象和字符串都需要同步更新
- 手动 YAML 格式化脆弱（引号、转义、缩进）
- `template` 对象和 `yamlContent` 字符串可能产生分歧

**修复建议:** 使用 `yaml.dump(template, { ...options })` 生成 YAML，或者如果偏好手动格式化的可读性（带注释分段），则移除未使用的 `template` 对象和 `js-yaml` 导入。

---

## 2. Medium 级别问题

### M1: `import-images.ts` — 缺少图片尺寸校验

设计文档要求 gen1: 400x400px, gen2: 500x500px。当前 `validateImage()`（第 301-318 行）只检查文件大小（200KB）和格式。没有尺寸验证意味着 1024x1024 的 AI 生图会直接通过。

**文件:** `/datad/github/tcgcard/scripts/import-images.ts` (function `validateImage`, 第 301-318 行)

### M2: `import-images.ts` — `pinyinify` 函数名具有误导性

该函数（第 110-229 行）将英文 Pokemon 名称映射为中文名，并非转换为拼音。函数名暗示的是罗马化，与实际功能相反。

**修复建议:** 重命名为 `englishToChineseName` 或 `pokemonNameLookup`。

**文件:** `/datad/github/tcgcard/scripts/import-images.ts` (第 110 行)

### M3: `generate-template.ts` — 短参数别名 `-i` / `-g` 在帮助文档中列出但未实现

`printUsage()`（第 181-182 行）列出了 `--id, -i` 和 `--gen, -g`，但 `parseArgs()`（第 20-36 行）只处理长参数形式。运行 `pnpm run new-card -- -i xfd-025 -g 1` 会静默失败。

**修复建议:** 在 `parseArgs()` 中添加 `args[i] === '-i'` 和 `args[i] === '-g'` 分支。

**文件:** `/datad/github/tcgcard/scripts/generate-template.ts` (第 24-31 行)

### M4: `gen-prompts.ts` — YAML 解析错误被静默忽略

```typescript
try {
  cards.push(yaml.load(content) as CardRaw);
} catch {
  // skip invalid YAML
}
```

无效的 YAML 文件被静默跳过，用户不会收到任何提示。在数据录入工作流中，用户手动创建 YAML 时语法错误很常见，应该报告。

**修复建议:** 至少 `console.warn()` 输出文件路径和错误信息，或在运行结束时汇总报告。

**文件:** `/datad/github/tcgcard/scripts/gen-prompts.ts` (第 103-107 行)

### M5: `gen-prompts.ts` — 未实现英文提示词模板

设计文档（第 3.2.5 节）同时指定了中文模板（主用）和英文模板（Midjourney/SD 备用）。当前实现只生成中文提示词。

**影响:** 想用 Midjourney 或 Stable Diffusion 的用户需要自行翻译。

**文件:** `/datad/github/tcgcard/scripts/gen-prompts.ts` (function `generateFramePrompt`, 第 168-189 行)

### M6: `validate-cards.ts` — `CardRaw` 接口大部分字段使用 `unknown` 类型

`CardRaw` 接口（第 79-96 行）将大多数字段声明为 `unknown`，导致代码中大量使用 `as Record<string, unknown>` 强制类型转换。这实际上绕过了 TypeScript 的类型安全。

**修复建议:** 定义精确类型接口，或在解析时进行运行时验证。

**文件:** `/datad/github/tcgcard/scripts/validate-cards.ts` (第 79-96 行)

### M7: `validate-cards.ts` — 每个检查项的错误输出上限为 20 条

错误列表在 20 条处截断，显示 "...and N more"。对于 149 张卡片的系统性问题（例如所有 gen1 卡片缺少 `source`），会产生 149 条错误，其中 129 条被隐藏。用户必须反复修复-重跑来发现所有问题。

**修复建议:** 输出到文件，或提供 `--verbose` 标志取消截断。

**文件:** `/datad/github/tcgcard/scripts/validate-cards.ts` (第 520-532 行)

---

## 3. Minor / Nits

| # | 脚本 | 问题 | 行号 |
|---|------|------|------|
| N1 | validate-cards | `check5_duplicateIds` 中 `seen.get(id)!.push(id)` 将同一个 id 字符串推入数组两次，应推入文件路径或卡片标识 | 249 |
| N2 | validate-cards | Emoji 字符（`✅`, `❌`, `⚠️`）在某些终端和 CI 日志中可能无法正确渲染 | 509, 542-548 |
| N3 | generate-template | `number` 字段预填为空字符串 `""`，但设计要求为 3 位补零的全国图鉴编号。模板可使用 `"000 (待查全国图鉴)"` 作为更清晰的占位符 | 102, 133 |
| N4 | gen-prompts | `ATTRIBUTE_EFFECTS`, `RARITY_POSE` 等常量硬编码在脚本内，未与 `src/lib/attribute-gradient.ts` 等共享源 | 21-54 |

---

## 4. 设计文档覆盖对照

| 设计需求 | 状态 | 说明 |
|---|---|---|
| 12 项验证检查 (§5.1) | 已覆盖 | 全部 12 项实现，输出格式清晰 |
| 提示词输出结构 (§3.2.2) | 已覆盖 | `batch-all.md` + `gen1/` + `gen2/` |
| 中文提示词模板 (§3.2.5) | 已覆盖 | 格式与设计一致 |
| 英文提示词模板 (§3.2.5) | **缺失** | 见 M5 |
| staging 目录导入 (§3.4) | 已覆盖 | 但存在 C1、M1 问题 |
| 导入报告格式 (§3.4.5) | 已覆盖 | 与设计示例一致 |
| 模板预填 (§5.2) | 已覆盖 | 但存在 C3、M3 问题 |
| `--dry-run` 支持 | 已覆盖 | 在 import-images 中实现 |
| `package.json` 脚本命令 (§5) | 已覆盖 | 4 条命令齐全 |
| `staging/` 目录 + `.gitkeep` | 已覆盖 | 磁盘上存在 |
| `public/cards/gen1/`, `gen2/`, `placeholders/` | 已覆盖 | 磁盘上存在 |

---

## 5. package.json 审查

脚本配置正确：

```json
"validate": "npx tsx scripts/validate-cards.ts",
"new-card": "npx tsx scripts/generate-template.ts",
"gen-prompts": "npx tsx scripts/gen-prompts.ts",
"import-images": "npx tsx scripts/import-images.ts"
```

`js-yaml` 和 `@types/js-yaml` 分别在 dependencies 和 devDependencies 中。无问题。

注意：使用 `npx tsx` 而非直接 shebang 调用，对没有全局安装 `tsx` 的用户更友好。

---

## 6. 问题汇总（按优先级）

| 优先级 | 编号 | 描述 | 文件 |
|--------|------|------|------|
| **Critical** | C1 | JPG/WebP 改扩展名非真正转换 | `scripts/import-images.ts` |
| **Critical** | C2 | N+1 重复 I/O 问题 | `scripts/gen-prompts.ts` |
| **Critical** | C3 | 手动 YAML 字符串拼接，js-yaml 未使用 | `scripts/generate-template.ts` |
| Medium | M1 | 缺少图片尺寸校验 | `scripts/import-images.ts` |
| Medium | M2 | `pinyinify` 函数名误导 | `scripts/import-images.ts` |
| Medium | M3 | 短参数别名未实现 | `scripts/generate-template.ts` |
| Medium | M4 | YAML 解析错误静默忽略 | `scripts/gen-prompts.ts` |
| Medium | M5 | 英文提示词模板未实现 | `scripts/gen-prompts.ts` |
| Medium | M6 | `CardRaw` 类型弱化 | `scripts/validate-cards.ts` |
| Medium | M7 | 错误输出截断为 20 条 | `scripts/validate-cards.ts` |
| Minor | N1-N4 | 见上表 | 各脚本 |

---

## 7. 验收结论

**T9 Phase 1（规则 + 脚本）: 有条件通过**

- 4 个脚本功能完整，覆盖了设计文档中 Phase 1 的核心需求
- CLI 交互体验一致且清晰，中文输出符合设计要求
- `package.json` 脚本配置正确
- `staging/` 和 `public/cards/` 目录结构就位

**Phase 2 试点前必须修复:**

1. **C1** — JPG-as-PNG 会产生损坏的图片，后续难以排查
2. **C2** — N+1 I/O 在 149 张卡片时会有可感知的性能影响
3. **C3** — 模板生成器的死代码会在 Schema 演进时造成分歧

**建议一并修复:** M1（尺寸校验）和 M3（短参数别名），成本极低。
