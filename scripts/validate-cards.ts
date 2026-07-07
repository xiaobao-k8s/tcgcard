#!/usr/bin/env tsx
/**
 * validate-cards.ts — 数据验证脚本
 *
 * 检查 12 项：
 *  1. YAML 语法正确性
 *  2. 必填字段完整性
 *  3. 字段值合法性（属性/稀有度/效果类型/character_type 枚举）
 *  4. ID 命名规范（xfd-XXX / ybd-XXX）
 *  5. 无重复 ID
 *  6. 进化链引用完整性
 *  7. 进化链反向一致性
 *  8. evolution_stage 一致性
 *  9. DP 数值范围合规
 * 10. dp_speed 世代规则
 * 11. source 字段存在且合法
 * 12. 图片文件存在性检查（warn，不 error）
 *
 * Usage: pnpm run validate
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ─── Constants ───────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cards');

const VALID_ATTRIBUTES = new Set([
  '火', '水', '草', '电', '超能力', '格斗', '毒', '地面',
  '岩石', '虫', '飞行', '幽灵', '冰', '龙',
  '一般', '钢', '恶', '妖精',
]);

const VALID_RARITIES = new Set(['common', 'rare', 'ultra-rare', 'legendary'] as const);
const VALID_EFFECT_TYPES = new Set(['evolution', 'attack', 'triple'] as const);
const VALID_CHARACTER_TYPES = new Set(['pokemon', 'trainer'] as const);
const VALID_SOURCES = new Set(['user-provided', 'pokedex', 'community', 'ai-generated']);

// DP ranges: [min, max] keyed by rarity → stage
const DP_RANGES: Record<string, Record<string, [number, number]>> = {
  common: {
    '1': [30, 50],
    '2': [45, 65],
    '3': [55, 75],
  },
  rare: {
    '1': [60, 80],
    '2': [75, 95],
    '3': [85, 105],
  },
  'ultra-rare': {
    '3': [100, 130],
    'no-evo': [100, 130],
  },
  legendary: {
    '1': [70, 90],
    '2': [100, 120],
    '3': [140, 160],
    'no-evo': [130, 160],
  },
};

// ─── Types ───────────────────────────────────────────────────────────

interface CardBack {
  skill: string;
  dp_attack: unknown;
  dp_defense: unknown;
  dp_speed?: unknown;
  height: string;
  weight: string;
  description: string;
  character_type?: string;
}

interface CardRaw {
  id: unknown;
  generation: unknown;
  name: unknown;
  number: unknown;
  attribute: unknown;
  rarity: unknown;
  evolution_stage: unknown;
  evolves_from?: unknown;
  evolves_to?: unknown;
  effect_type: unknown;
  image_front?: string;
  image_frame_a?: string;
  image_frame_b?: string;
  image_frame_c?: string;
  back?: Partial<CardBack>;
  source?: unknown;
}

interface CheckResult {
  pass: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadAllCards(): { cards: CardRaw[]; files: string[]; errors: string[] } {
  const cards: CardRaw[] = [];
  const files: string[] = [];
  const parseErrors: string[] = [];

  for (const gen of [1, 2]) {
    const genDir = path.join(DATA_DIR, `gen${gen}`);
    if (!fs.existsSync(genDir)) continue;

    const yamlFiles = fs
      .readdirSync(genDir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of yamlFiles) {
      const filePath = path.join(genDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        const parsed = yaml.load(content) as CardRaw;
        cards.push(parsed);
        files.push(filePath);
      } catch (e) {
        parseErrors.push(`  [YAML ERROR] ${filePath}: ${(e as Error).message}`);
      }
    }
  }

  return { cards, files, errors: parseErrors };
}

// ─── Check Functions ─────────────────────────────────────────────────

function check1_yamlSyntax(parseErrors: string[]): CheckResult {
  if (parseErrors.length === 0) {
    return { pass: true, errors: [], warnings: [] };
  }
  return {
    pass: false,
    errors: parseErrors,
    warnings: [],
  };
}

function check2_requiredFields(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];
  const requiredTopLevel = ['id', 'generation', 'name', 'number', 'attribute', 'rarity', 'evolution_stage', 'effect_type'];
  const requiredBack = ['skill', 'dp_attack', 'dp_defense', 'height', 'weight', 'description'];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');

    for (const field of requiredTopLevel) {
      const val = (card as Record<string, unknown>)[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errors.push(`  [MISSING] ${id}: missing required field "${field}"`);
      }
    }

    if (card.name && typeof card.name === 'object') {
      const nameObj = card.name as Record<string, unknown>;
      if (!nameObj.zh || (typeof nameObj.zh === 'string' && nameObj.zh.trim() === '')) {
        errors.push(`  [MISSING] ${id}: name.zh is empty`);
      }
      if (!nameObj.ja || (typeof nameObj.ja === 'string' && nameObj.ja.trim() === '')) {
        errors.push(`  [MISSING] ${id}: name.ja is empty`);
      }
    } else {
      errors.push(`  [MISSING] ${id}: name is not an object`);
    }

    if (!card.back) {
      errors.push(`  [MISSING] ${id}: missing "back" section`);
    } else {
      for (const field of requiredBack) {
        const val = (card.back as Record<string, unknown>)[field];
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          errors.push(`  [MISSING] ${id}: back.${field} is missing or empty`);
        }
      }
    }

    // image paths
    for (const imgField of ['image_front', 'image_frame_a', 'image_frame_b'] as const) {
      if (!card[imgField]) {
        errors.push(`  [MISSING] ${id}: missing "${imgField}"`);
      }
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check3_enumValues(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');

    if (card.attribute !== undefined && !VALID_ATTRIBUTES.has(String(card.attribute))) {
      errors.push(`  [INVALID] ${id}: attribute "${card.attribute}" not in valid set`);
    }

    if (card.rarity !== undefined && !VALID_RARITIES.has(card.rarity as never)) {
      errors.push(`  [INVALID] ${id}: rarity "${card.rarity}" not in ${[...VALID_RARITIES].join(', ')}`);
    }

    if (card.effect_type !== undefined && !VALID_EFFECT_TYPES.has(card.effect_type as never)) {
      errors.push(`  [INVALID] ${id}: effect_type "${card.effect_type}" not in ${[...VALID_EFFECT_TYPES].join(', ')}`);
    }

    if (card.back?.character_type !== undefined && !VALID_CHARACTER_TYPES.has(card.back.character_type as never)) {
      errors.push(`  [INVALID] ${id}: back.character_type "${card.back.character_type}" not in ${[...VALID_CHARACTER_TYPES].join(', ')}`);
    }

    // triple effect requires image_frame_c
    if (card.effect_type === 'triple' && !card.image_frame_c) {
      errors.push(`  [MISSING] ${id}: effect_type is "triple" but image_frame_c is missing`);
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check4_idFormat(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];
  const idPattern = /^(xfd|ybd)-\d{3}$/;

  for (const card of cards) {
    const id = String(card.id ?? '');
    if (!idPattern.test(id)) {
      errors.push(`  [FORMAT] id "${id}" does not match xfd-XXX or ybd-XXX format`);
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check5_duplicateIds(cards: CardRaw[]): CheckResult {
  const seen = new Map<string, string[]>();

  for (const card of cards) {
    const id = String(card.id ?? 'null');
    if (!seen.has(id)) seen.set(id, []);
    seen.get(id)!.push(id);
  }

  const errors: string[] = [];
  for (const [id, occurrences] of seen) {
    if (occurrences.length > 1) {
      errors.push(`  [DUPLICATE] id "${id}" appears ${occurrences.length} times`);
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check6_evolutionReferenceIntegrity(cards: CardRaw[]): CheckResult {
  const idSet = new Set(cards.map((c) => String(c.id)));
  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');

    if (card.evolves_from && typeof card.evolves_from === 'string' && !idSet.has(card.evolves_from)) {
      errors.push(`  [BROKEN REF] ${id}: evolves_from "${card.evolves_from}" does not exist`);
    }

    if (Array.isArray(card.evolves_to)) {
      for (const refId of card.evolves_to) {
        if (!idSet.has(refId)) {
          errors.push(`  [BROKEN REF] ${id}: evolves_to "${refId}" does not exist`);
        }
      }
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check7_evolutionReverseConsistency(cards: CardRaw[]): CheckResult {
  const cardMap = new Map<string, CardRaw>();
  for (const card of cards) {
    cardMap.set(String(card.id), card);
  }

  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');

    // If A evolves_from B, then B should have A in evolves_to
    if (card.evolves_from && typeof card.evolves_from === 'string') {
      const parent = cardMap.get(card.evolves_from);
      if (parent) {
        const parentId = String(parent.id ?? 'unknown');
        const evolvesTo = Array.isArray(parent.evolves_to) ? parent.evolves_to : [];
        if (!evolvesTo.includes(id)) {
          errors.push(`  [INCONSISTENT] ${id}: evolves_from "${parentId}" but "${parentId}".evolves_to does not include "${id}"`);
        }
      }
    }

    // If A has B in evolves_to, then B should have evolves_from = A
    if (Array.isArray(card.evolves_to)) {
      for (const childId of card.evolves_to) {
        const child = cardMap.get(childId);
        if (child) {
          if (child.evolves_from !== id) {
            errors.push(`  [INCONSISTENT] ${id}: evolves_to "${childId}" but "${childId}".evolves_from is "${child.evolves_from}" (expected "${id}")`);
          }
        }
      }
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check8_evolutionStageConsistency(cards: CardRaw[]): CheckResult {
  const cardMap = new Map<string, CardRaw>();
  for (const card of cards) {
    cardMap.set(String(card.id), card);
  }

  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');
    const stage = Number(card.evolution_stage);

    // No evolves_from → should be stage 1
    if (!card.evolves_from || card.evolves_from === null) {
      if (stage !== 1) {
        errors.push(`  [STAGE] ${id}: no evolves_from but evolution_stage=${stage} (expected 1)`);
      }
    }

    // No evolves_to (null or empty array) → should be max stage in chain
    const evolvesTo = Array.isArray(card.evolves_to) ? card.evolves_to : [];
    if (evolvesTo.length === 0) {
      // Find the max stage in this chain
      let maxStage = stage;
      let current: CardRaw | undefined = card;
      while (current?.evolves_from && typeof current.evolves_from === 'string') {
        const parent = cardMap.get(current.evolves_from);
        if (!parent) break;
        maxStage = Math.max(maxStage, Number(parent.evolution_stage));
        current = parent;
      }

      if (stage < maxStage) {
        errors.push(`  [STAGE] ${id}: no evolves_to but evolution_stage=${stage}, max in chain=${maxStage}`);
      }
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check9_dpRange(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');
    const rarity = String(card.rarity);
    const stage = String(card.evolution_stage);
    const hasEvolvesFrom = !!card.evolves_from && card.evolves_from !== null;
    const evolvesTo = Array.isArray(card.evolves_to) ? card.evolves_to : [];
    const hasEvolvesTo = evolvesTo.length > 0;

    // Determine which DP range to use
    let stageKey = stage;
    if (!hasEvolvesFrom && !hasEvolvesTo) {
      stageKey = 'no-evo';
    }

    const rangeMap = DP_RANGES[rarity];
    if (!rangeMap) {
      errors.push(`  [DP] ${id}: unknown rarity "${rarity}", cannot validate DP`);
      continue;
    }

    const range = rangeMap[stageKey];
    if (!range) {
      warnings.push(`  [DP WARN] ${id}: no DP range defined for rarity="${rarity}" stage="${stageKey}"`);
      continue;
    }

    const [minDp, maxDp] = range;

    const atk = Number(card.back?.dp_attack);
    const def = Number(card.back?.dp_defense);

    if (!isNaN(atk) && (atk < minDp || atk > maxDp)) {
      errors.push(`  [DP RANGE] ${id}: dp_attack=${atk} out of [${minDp}, ${maxDp}] for ${rarity}/${stageKey}`);
    }
    if (!isNaN(def) && (def < minDp || def > maxDp)) {
      errors.push(`  [DP RANGE] ${id}: dp_defense=${def} out of [${minDp}, ${maxDp}] for ${rarity}/${stageKey}`);
    }
  }

  return { pass: errors.length === 0, errors, warnings };
}

function check10_dpSpeedGeneration(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');
    const gen = Number(card.generation);
    const dpSpeed = (card.back as Record<string, unknown> | undefined)?.dp_speed;

    if (gen === 1) {
      // Generation 1: dp_speed must be null or undefined
      if (dpSpeed !== null && dpSpeed !== undefined) {
        errors.push(`  [SPEED] ${id}: generation=1 but dp_speed=${dpSpeed} (should be null)`);
      }
    } else if (gen === 2) {
      // Generation 2: dp_speed must be a valid number
      if (dpSpeed === null || dpSpeed === undefined || typeof dpSpeed !== 'number' || isNaN(dpSpeed)) {
        errors.push(`  [SPEED] ${id}: generation=2 but dp_speed is null/undefined/invalid (must be a number)`);
      }
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check11_sourceField(cards: CardRaw[]): CheckResult {
  const errors: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');

    if (card.source === undefined || card.source === null) {
      errors.push(`  [MISSING] ${id}: "source" field is missing`);
    } else if (!VALID_SOURCES.has(String(card.source))) {
      errors.push(`  [INVALID] ${id}: source "${card.source}" not in ${[...VALID_SOURCES].join(', ')}`);
    }
  }

  return { pass: errors.length === 0, errors, warnings: [] };
}

function check12_imageExistence(cards: CardRaw[]): CheckResult {
  const warnings: string[] = [];

  for (const card of cards) {
    const id = String(card.id ?? 'unknown');
    const gen = card.generation === 1 ? 'gen1' : 'gen2';

    const imageFields: (keyof Pick<CardRaw, 'image_front' | 'image_frame_a' | 'image_frame_b' | 'image_frame_c'>)[] = [
      'image_front', 'image_frame_a', 'image_frame_b',
    ];
    if (card.effect_type === 'triple') {
      imageFields.push('image_frame_c');
    }

    for (const field of imageFields) {
      const relPath = card[field];
      if (!relPath) continue;
      const absPath = path.join(PUBLIC_DIR, relPath.replace(/^\//, ''));
      if (!fs.existsSync(absPath)) {
        warnings.push(`  [MISSING IMAGE] ${id}: ${relPath} not found`);
      }
    }
  }

  return { pass: true, errors: [], warnings };
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  console.log('========================================');
  console.log('  奇多卡片百科 · 数据验证');
  console.log('========================================\n');

  const { cards, errors: parseErrors } = loadAllCards();
  console.log(`Loaded ${cards.length} cards from data/\n`);

  const checks: { name: string; result: CheckResult }[] = [
    { name: '1. YAML 语法正确性', result: check1_yamlSyntax(parseErrors) },
    { name: '2. 必填字段完整性', result: check2_requiredFields(cards) },
    { name: '3. 字段值合法性', result: check3_enumValues(cards) },
    { name: '4. ID 命名规范', result: check4_idFormat(cards) },
    { name: '5. 无重复 ID', result: check5_duplicateIds(cards) },
    { name: '6. 进化链引用完整性', result: check6_evolutionReferenceIntegrity(cards) },
    { name: '7. 进化链反向一致性', result: check7_evolutionReverseConsistency(cards) },
    { name: '8. evolution_stage 一致性', result: check8_evolutionStageConsistency(cards) },
    { name: '9. DP 数值范围合规', result: check9_dpRange(cards) },
    { name: '10. dp_speed 世代规则', result: check10_dpSpeedGeneration(cards) },
    { name: '11. source 字段', result: check11_sourceField(cards) },
    { name: '12. 图片文件存在性', result: check12_imageExistence(cards) },
  ];

  let totalErrors = 0;
  let totalWarnings = 0;
  let passedChecks = 0;

  for (const { name, result } of checks) {
    const status = result.pass ? 'PASS' : 'FAIL';
    const symbol = result.pass ? '✅' : '❌';
    const errCount = result.errors.length;
    const warnCount = result.warnings.length;

    console.log(`${symbol} ${name}  [${status}] ${errCount} error(s), ${warnCount} warning(s)`);

    if (result.pass) passedChecks++;
    totalErrors += errCount;
    totalWarnings += warnCount;

    // Print errors inline
    for (const err of result.errors.slice(0, 20)) {
      console.log(`   ${err}`);
    }
    if (result.errors.length > 20) {
      console.log(`   ... and ${result.errors.length - 20} more errors`);
    }

    // Print warnings inline (capped)
    for (const warn of result.warnings.slice(0, 20)) {
      console.log(`   ${warn}`);
    }
    if (result.warnings.length > 20) {
      console.log(`   ... and ${result.warnings.length - 20} more warnings`);
    }
  }

  console.log('\n========================================');
  console.log(`  Total: ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  console.log(`  Passed: ${passedChecks}/12 checks`);
  console.log('========================================');

  if (totalErrors > 0) {
    console.log('\n❌ Validation failed. Fix errors before committing.');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n⚠️  Validation passed with ${totalWarnings} warning(s).`);
    process.exit(0);
  } else {
    console.log('\n✅ All checks passed!');
    process.exit(0);
  }
}

main();
