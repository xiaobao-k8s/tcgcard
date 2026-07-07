#!/usr/bin/env tsx
/**
 * import-images.ts — 图片快速导入工具
 *
 * 扫描 staging/ 目录的图片，智能匹配到对应卡片，校验并移动到正式目录。
 *
 * Usage: pnpm run import-images [--source <dir>] [--target <dir>] [--dry-run]
 */

import fs from 'fs';
import path from 'path';

// ─── Constants ───────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_STAGING = path.join(process.cwd(), 'staging');
const DEFAULT_TARGET = path.join(process.cwd(), 'public', 'cards');

const SUPPORTED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

// ─── Types ───────────────────────────────────────────────────────────

interface CardInfo {
  id: string;
  generation: number;
  nameZh: string;
  nameJa: string;
  number: string;
}

interface ImportResult {
  success: string[];   // "src → dest" pairs
  skipped: string[];   // "src — reason" pairs
  failed: string[];    // "src — reason" pairs
  conflicts: string[]; // "src → existing" pairs
}

interface MatchResult {
  cardId: string;
  frameType: 'front' | 'frame-a' | 'frame-b' | 'frame-c';
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadCardIndex(): CardInfo[] {
  const cards: CardInfo[] = [];

  for (const gen of [1, 2]) {
    const genDir = path.join(DATA_DIR, `gen${gen}`);
    if (!fs.existsSync(genDir)) continue;

    const yamlFiles = fs.readdirSync(genDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of yamlFiles) {
      const filePath = path.join(genDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      // Minimal YAML parsing without external lib
      const idMatch = content.match(/^id:\s*["']?([^"'\n]+)["']?$/m);
      const nameZhMatch = content.match(/zh:\s*["']([^"']*)["']/m);
      const nameJaMatch = content.match(/ja:\s*["']([^"']*)["']/m);
      const numberMatch = content.match(/^number:\s*["']?([^"'\n]+)["']?$/m);

      if (idMatch) {
        cards.push({
          id: idMatch[1].trim(),
          generation: gen,
          nameZh: nameZhMatch?.[1]?.trim() || '',
          nameJa: nameJaMatch?.[1]?.trim() || '',
          number: numberMatch?.[1]?.trim() || '',
        });
      }
    }
  }

  return cards;
}

function getStagingImages(stagingDir: string): string[] {
  if (!fs.existsSync(stagingDir)) return [];
  return fs.readdirSync(stagingDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return SUPPORTED_EXTENSIONS.has(ext);
  });
}

function extractCardIdFromFilename(filename: string): string | null {
  const base = path.basename(filename, path.extname(filename));

  // Direct match: xfd-001-frame-a.png → xfd-001
  const idMatch = base.match(/^(xfd|ybd)-\d{3}/);
  if (idMatch) return idMatch[0];

  return null;
}

function extractFrameTypeFromFilename(filename: string): string {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();

  if (base.includes('frame-c') || base.includes('frame_c') || base.includes('framec')) return 'frame-c';
  if (base.includes('frame-b') || base.includes('frame_b') || base.includes('frameb') || base.includes('evo2') || base.includes('attack')) return 'frame-b';
  if (base.includes('frame-a') || base.includes('frame_a') || base.includes('framea') || base.includes('evo1') || base.includes('normal')) return 'frame-a';
  if (base.includes('front') || base.includes('main') || base.includes('cover')) return 'front';

  // Default: assume first image is front, second is frame-a, third is frame-b
  // We handle this in the caller with ordering
  return 'front';
}

function pinyinify(text: string): string {
  // Simple romanization for common Pokemon names
  // This is a best-effort matching — real matching uses Chinese name lookup
  const lower = text.toLowerCase().trim();

  const nameMap: Record<string, string[]> = {
    'charmander': ['小火龙'],
    'charmeleon': ['火恐龙'],
    'charizard': ['喷火龙'],
    'bulbasaur': ['妙蛙种子'],
    'ivysaur': ['妙蛙草'],
    'venusaur': ['妙蛙花'],
    'squirtle': ['杰尼龟'],
    'wartortle': ['卡咪龟'],
    'blastoise': ['水箭龟'],
    'pikachu': ['皮卡丘'],
    'raichu': ['雷丘'],
    'mewtwo': ['超梦'],
    'mew': ['梦幻'],
    'dragonite': ['快龙'],
    'dragonair': ['哈克龙'],
    'dratini': ['迷你龙'],
    'gengar': ['耿鬼'],
    'haunter': ['鬼斯通'],
    'gastly': ['鬼斯'],
    'alakazam': ['胡地'],
    'kadabra': ['勇基拉'],
    'abra': ['凯西'],
    'machamp': ['怪力'],
    'machoke': ['豪力'],
    'machop': ['腕力'],
    'golem': ['隆隆岩'],
    'graveler': ['隆隆石'],
    'geodude': ['小拳石'],
    'slowbro': ['呆壳兽'],
    'slowpoke': ['呆呆兽'],
    'magneton': ['三合一磁怪'],
    'magnemite': ['小磁怪'],
    'farfetchd': ['大葱鸭'],
    'dodrio': ['嘟嘟利'],
    'doduo': ['嘟嘟'],
    'seel': ['小海狮'],
    'dewgong': ['白海狮'],
    'grimer': ['臭泥'],
    'muk': ['臭臭泥'],
    'shellder': ['大舌贝'],
    'cloyster': ['刺甲贝'],
    'onix': ['大岩蛇'],
    'drowzee': ['催眠貘'],
    'hypno': ['引梦貘人'],
    'krabby': ['大钳蟹'],
    'kingler': ['巨钳蟹'],
    'voltorb': ['霹雳电球'],
    'electrode': ['顽皮雷弹'],
    'exeggcute': ['蛋蛋'],
    'exeggutor': ['椰蛋树'],
    'cubone': ['卡拉卡拉'],
    'marowak': ['嘎啦嘎啦'],
    'hitmonlee': ['飞腿郎'],
    'hitmonchan': ['快拳郎'],
    'lickitung': ['大舌头'],
    'koffing': ['瓦斯弹'],
    'weezing': ['双弹瓦斯'],
    'rhyhorn': ['独角犀牛'],
    'rhydon': ['钻角犀兽'],
    'chansey': ['吉利蛋'],
    'tangela': ['蔓藤怪'],
    'kangaskhan': ['袋兽'],
    'horsea': ['墨海马'],
    'seadra': ['海刺龙'],
    'goldeen': ['角金鱼'],
    'seaking': ['金鱼王'],
    'staryu': ['海星星'],
    'starmie': ['宝石海星'],
    'mr. mime': ['魔墙人偶'],
    'scyther': ['飞天螳螂'],
    'jynx': ['迷唇姐'],
    'electabuzz': ['电击兽'],
    'magmar': ['鸭嘴火兽'],
    'pinsir': ['凯罗斯'],
    'tauros': ['肯泰罗'],
    'gyarados': ['暴鲤龙'],
    'lapras': ['拉普拉斯'],
    'ditto': ['百变怪'],
    'eevee': ['伊布'],
    'vaporeon': ['水伊布'],
    'jolteon': ['雷伊布'],
    'flareon': ['火伊布'],
    'porygon': ['多边兽'],
    'omanyte': ['菊石兽'],
    'omastar': ['多刺菊石兽'],
    'kabuto': ['化石盔'],
    'kabutops': ['镰刀盔'],
    'aerodactyl': ['化石翼龙'],
    'snorlax': ['卡比兽'],
    'articuno': ['急冻鸟'],
    'zapdos': ['闪电鸟'],
    'moltres': ['火焰鸟'],
    // Gen 2
    'lugia': ['洛奇亚'],
    'ho-oh': ['凤王'],
    'hooh': ['凤王'],
    'celebi': ['雪拉比'],
    'tyranitar': ['班基拉斯'],
    'larvitar': ['幼基拉斯'],
    'pupitar': ['沙基拉斯'],
  };

  // Check direct match
  if (nameMap[lower]) return nameMap[lower][0];

  // Check partial match
  for (const [key, zhNames] of Object.entries(nameMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      return zhNames[0];
    }
  }

  return '';
}

function matchImageToCard(
  filename: string,
  cardIndex: CardInfo[],
  fileOrder: number
): MatchResult | null {
  // Strategy 1: Direct card ID in filename
  const cardIdFromFilename = extractCardIdFromFilename(filename);
  if (cardIdFromFilename) {
    const card = cardIndex.find((c) => c.id === cardIdFromFilename);
    if (card) {
      const frameType = extractFrameTypeFromFilename(filename);
      return {
        cardId: card.id,
        frameType: frameType as MatchResult['frameType'],
        confidence: 'high',
        reasoning: `filename contains card ID "${cardIdFromFilename}"`,
      };
    }
  }

  // Strategy 2: Chinese/pinyin name match
  const base = path.basename(filename, path.extname(filename));

  // Try to find Chinese name match
  for (const card of cardIndex) {
    if (card.nameZh && base.toLowerCase().includes(card.nameZh.toLowerCase())) {
      const frameType = extractFrameTypeFromFilename(filename);
      return {
        cardId: card.id,
        frameType: frameType as MatchResult['frameType'],
        confidence: 'medium',
        reasoning: `filename contains Chinese name "${card.nameZh}"`,
      };
    }
  }

  // Strategy 3: English/Pokemon name → Chinese name → card match
  const zhName = pinyinify(base);
  if (zhName) {
    const card = cardIndex.find((c) => c.nameZh === zhName);
    if (card) {
      const frameType = extractFrameTypeFromFilename(filename);
      return {
        cardId: card.id,
        frameType: frameType as MatchResult['frameType'],
        confidence: 'medium',
        reasoning: `english name in filename maps to "${card.nameZh}" (${card.id})`,
      };
    }
  }

  // Strategy 4: Pokedex number match (e.g., "004" → number field)
  const numberMatch = base.match(/(\d{1,3})/);
  if (numberMatch) {
    const num = numberMatch[1].padStart(3, '0');
    const card = cardIndex.find((c) => c.number === num || c.number === numberMatch[1]);
    if (card) {
      const frameType = extractFrameTypeFromFilename(filename);
      return {
        cardId: card.id,
        frameType: frameType as MatchResult['frameType'],
        confidence: 'low',
        reasoning: `number "${num}" matches card number field`,
      };
    }
  }

  return null;
}

function validateImage(filePath: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    issues.push(`Unsupported format: ${ext}`);
  }

  const stats = fs.statSync(filePath);
  if (stats.size > 200 * 1024) {
    issues.push(`File size ${Math.round(stats.size / 1024)}KB exceeds 200KB limit`);
  }

  if (stats.size === 0) {
    issues.push('File is empty (0 bytes)');
  }

  return { valid: issues.length === 0, issues };
}

function getDestinationPath(
  card: CardInfo,
  frameType: string,
  targetDir: string
): string {
  const genDir = card.generation === 1 ? 'gen1' : 'gen2';
  const filename = `${card.id}-${frameType}.png`;
  return path.join(targetDir, genDir, filename);
}

// ─── Main ────────────────────────────────────────────────────────────

function parseImportArgs(args: string[]): { source: string; target: string; dryRun: boolean } {
  let source = DEFAULT_STAGING;
  let target = DEFAULT_TARGET;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && args[i + 1]) {
      source = args[i + 1];
      i++;
    } else if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  return { source, target, dryRun };
}

function printReport(result: ImportResult): void {
  console.log('\n📦 图片导入报告');
  console.log('═══════════════════════════════════════');

  if (result.success.length > 0) {
    console.log(`✅ 导入成功 ${result.success.length} 张：`);
    for (const line of result.success) {
      console.log(`  ${line}`);
    }
  }

  if (result.skipped.length > 0) {
    console.log(`\n⏭️  跳过 ${result.skipped.length} 张：`);
    for (const line of result.skipped) {
      console.log(`  ${line}`);
    }
  }

  if (result.conflicts.length > 0) {
    console.log(`\n⚠️  需手动确认 ${result.conflicts.length} 张：`);
    for (const line of result.conflicts) {
      console.log(`  ${line}`);
    }
  }

  if (result.failed.length > 0) {
    console.log(`\n❌ 失败 ${result.failed.length} 张：`);
    for (const line of result.failed) {
      console.log(`  ${line}`);
    }
  }

  if (result.success.length === 0 && result.failed.length === 0 && result.skipped.length === 0) {
    console.log('\n📭 staging/ 目录中没有图片需要导入。');
    console.log('   请将生图结果放入 staging/ 目录后重试。');
  }

  // Calculate progress
  const cardIndex = loadCardIndex();
  let cardsWithImages = 0;
  for (const card of cardIndex) {
    const gen = card.generation === 1 ? 'gen1' : 'gen2';
    const frontPath = path.join(process.cwd(), 'public', 'cards', gen, `${card.id}-front.png`);
    if (fs.existsSync(frontPath)) {
      cardsWithImages++;
    }
  }

  const total = cardIndex.length;
  console.log(`\n📊 当前进度：${cardsWithImages}/${total} (${Math.round(cardsWithImages / total * 100)}%) 卡片有主图`);
}

function main(): void {
  console.log('========================================');
  console.log('  奇多卡片百科 · 图片导入');
  console.log('========================================\n');

  const { source, target, dryRun } = parseImportArgs(process.argv.slice(2));

  if (dryRun) {
    console.log('🔍 DRY RUN mode — no files will be modified.\n');
  }

  if (!fs.existsSync(source)) {
    console.error(`❌ Source directory not found: ${source}`);
    process.exit(1);
  }

  // Ensure target subdirectories exist
  for (const gen of ['gen1', 'gen2']) {
    const genDir = path.join(target, gen);
    if (!fs.existsSync(genDir)) {
      if (dryRun) {
        console.log(`  [DRY RUN] Would create: ${genDir}`);
      } else {
        fs.mkdirSync(genDir, { recursive: true });
      }
    }
  }

  const images = getStagingImages(source);
  if (images.length === 0) {
    console.log('📭 No images found in staging directory.');
    process.exit(0);
  }

  console.log(`📷 Found ${images.length} image(s) in ${source}.\n`);

  const cardIndex = loadCardIndex();
  console.log(`📋 Card index: ${cardIndex.length} cards loaded.\n`);

  const result: ImportResult = { success: [], skipped: [], failed: [], conflicts: [] };

  // Track which (cardId, frameType) combos we've already assigned
  const assigned = new Map<string, string>(); // "cardId:frameType" → source file

  // Sort images for predictable ordering (helps with sequential numbering)
  images.sort();

  for (const image of images) {
    const srcPath = path.join(source, image);

    // Validate image
    const validation = validateImage(srcPath);
    if (!validation.valid) {
      result.failed.push(`${image} — ${validation.issues.join('; ')}`);
      continue;
    }

    // Match to card
    const match = matchImageToCard(image, cardIndex, 0);
    if (!match) {
      result.skipped.push(`${image} — 无法匹配到任何卡片，请手动指定`);
      continue;
    }

    // Check for duplicate assignment
    const comboKey = `${match.cardId}:${match.frameType}`;
    if (assigned.has(comboKey)) {
      result.conflicts.push(`${image} — "${comboKey}" 已被 ${assigned.get(comboKey)} 占用`);
      continue;
    }

    // Get destination
    const card = cardIndex.find((c) => c.id === match.cardId)!;
    const destPath = getDestinationPath(card, match.frameType, target);

    // Check if destination already exists
    if (fs.existsSync(destPath)) {
      result.conflicts.push(`${image} → ${destPath} — 目标文件已存在，请确认后手动处理`);
      continue;
    }

    // Execute import
    assigned.set(comboKey, image);

    if (dryRun) {
      result.success.push(`${image} → ${destPath} [DRY RUN]`);
    } else {
      try {
        // Convert to PNG if needed
        const finalDest = destPath.replace(/\.(jpg|jpeg|webp)$/i, '.png');

        fs.copyFileSync(srcPath, finalDest);
        result.success.push(`${image} → ${finalDest}`);
      } catch (err) {
        result.failed.push(`${image} — copy failed: ${(err as Error).message}`);
      }
    }
  }

  // Print report
  printReport(result);

  // Exit with non-zero if there are failures or unresolved matches
  if (result.failed.length > 0 || result.skipped.length > 0) {
    process.exit(1);
  }
}

main();
