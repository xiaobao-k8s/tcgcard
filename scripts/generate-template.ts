#!/usr/bin/env tsx
/**
 * generate-template.ts — 卡片模板生成器
 *
 * 输入：card-id, generation
 * 输出：data/gen{1,2}/{card-id}.yaml（预填基础字段）
 *
 * Usage: pnpm run new-card -- --id xfd-025 --gen 1
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface TemplateArgs {
  id: string;
  gen: number;
}

function parseArgs(args: string[]): TemplateArgs | null {
  let id: string | undefined;
  let gen: number | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id' && args[i + 1]) {
      id = args[i + 1];
      i++;
    } else if ((args[i] === '--gen' || args[i] === '--generation') && args[i + 1]) {
      gen = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (!id || !gen) return null;
  return { id, gen };
}

function getDpMidValues(rarity: string, stage: number): { attack: number; defense: number; speed: number | null } {
  const ranges: Record<string, Record<string, [number, number]>> = {
    common: { '1': [30, 50], '2': [45, 65], '3': [55, 75] },
    rare: { '1': [60, 80], '2': [75, 95], '3': [85, 105] },
    'ultra-rare': { '3': [100, 130], 'no-evo': [100, 130] },
    legendary: { '1': [70, 90], '2': [100, 120], '3': [140, 160], 'no-evo': [130, 160] },
  };

  const key = String(stage);
  const range = ranges[rarity]?.[key] ?? ranges[rarity]?.['no-evo'] ?? [50, 50];
  const mid = Math.round((range[0] + range[1]) / 2);

  return {
    attack: mid,
    defense: mid,
    speed: null, // gen1 = null, overridden for gen2
  };
}

function generateTemplate(args: TemplateArgs): void {
  const { id, gen } = args;

  // Validate ID format
  const idPattern = /^(xfd|ybd)-\d{3}$/;
  if (!idPattern.test(id)) {
    console.error(`❌ Invalid card ID format: "${id}"`);
    console.error('   Expected format: xfd-XXX (gen 1) or ybd-XXX (gen 2)');
    process.exit(1);
  }

  // Validate generation matches ID prefix
  const prefix = id.split('-')[0];
  const expectedGen = prefix === 'xfd' ? 1 : 2;
  if (gen !== expectedGen) {
    console.warn(`⚠️  ID prefix "${prefix}" suggests generation ${expectedGen}, but --gen ${gen} specified.`);
    console.warn('   Using generation from ID prefix.');
  }

  const actualGen = expectedGen;
  const genDir = path.join(process.cwd(), 'data', `gen${actualGen}`);
  const outPath = path.join(genDir, `${id}.yaml`);

  // Check if file already exists
  if (fs.existsSync(outPath)) {
    console.error(`❌ File already exists: ${outPath}`);
    process.exit(1);
  }

  // Ensure directory exists
  if (!fs.existsSync(genDir)) {
    fs.mkdirSync(genDir, { recursive: true });
  }

  // Get DP mid values for common rarity, stage 1
  const dp = getDpMidValues('common', 1);

  // Build template object
  const template = {
    id,
    generation: actualGen,
    name: {
      zh: '',
      ja: '',
    },
    number: '',
    attribute: '',
    rarity: 'common',
    evolution_stage: 1,
    evolves_from: null,
    evolves_to: [],
    effect_type: 'evolution',
    image_front: `/cards/gen${actualGen}/${id}-front.png`,
    image_frame_a: `/cards/gen${actualGen}/${id}-frame-a.png`,
    image_frame_b: `/cards/gen${actualGen}/${id}-frame-b.png`,
    back: {
      skill: '',
      dp_attack: dp.attack,
      dp_defense: dp.defense,
      dp_speed: actualGen === 1 ? null : 50,
      height: '',
      weight: '',
      description: '',
      character_type: 'pokemon',
    },
    source: 'user-provided',
  };

  // Generate YAML manually for cleaner output (js-yaml default format is verbose)
  const yamlContent = `# === 基础信息 ===
id: "${id}"
generation: ${actualGen}
name:
  zh: ""
  ja: ""
number: ""
attribute: ""
rarity: "common"

# === 进化链 ===
evolution_stage: 1
evolves_from: null
evolves_to: []

# === 光栅效果 ===
effect_type: "evolution"

# === 图片路径 ===
image_front: "/cards/gen${actualGen}/${id}-front.png"
image_frame_a: "/cards/gen${actualGen}/${id}-frame-a.png"
image_frame_b: "/cards/gen${actualGen}/${id}-frame-b.png"

# === 背面数据 ===
back:
  skill: ""
  dp_attack: ${dp.attack}
  dp_defense: ${dp.defense}
  dp_speed: ${actualGen === 1 ? 'null' : '50'}
  height: ""
  weight: ""
  description: ""
  character_type: "pokemon"

# === 数据溯源 ===
source: "user-provided"
`;

  fs.writeFileSync(outPath, yamlContent, 'utf-8');

  console.log(`✅ 卡片模板已生成: ${outPath}`);
  console.log(`\n📋 预填内容:`);
  console.log(`   ID: ${id}`);
  console.log(`   Generation: ${actualGen}`);
  console.log(`   Rarity: common (default)`);
  console.log(`   Evolution Stage: 1`);
  console.log(`   DP Attack/Defense: ${dp.attack}/${dp.defense} (common/stage-1 mid)`);
  console.log(`   DP Speed: ${actualGen === 1 ? 'null (gen1 rule)' : '50 (default)'}`);
  console.log(`\n⏭️  下一步: 编辑 ${outPath} 填写名称、属性、进化链等字段`);
}

function printUsage(): void {
  console.log('Usage: pnpm run new-card -- --id <card-id> --gen <generation>');
  console.log('');
  console.log('Options:');
  console.log('  --id, -i       Card ID (e.g., xfd-025, ybd-010)');
  console.log('  --gen, -g      Generation (1 or 2)');
  console.log('');
  console.log('Examples:');
  console.log('  pnpm run new-card -- --id xfd-025 --gen 1');
  console.log('  pnpm run new-card -- --id ybd-010 --gen 2');
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    console.error('❌ Missing required arguments: --id and --gen');
    printUsage();
    process.exit(1);
  }

  generateTemplate(parsed);
}

main();
