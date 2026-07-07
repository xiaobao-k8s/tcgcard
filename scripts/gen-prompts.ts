#!/usr/bin/env tsx
/**
 * gen-prompts.ts — 批量生图提示词生成器
 *
 * 扫描 data/ 目录，找出缺图的卡片，为每张卡片生成 ChatGPT 格式的完整提示词。
 * 输出到 prompts/ 目录。
 *
 * Usage: pnpm run gen-prompts
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// ─── Constants ───────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'cards');
const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

const ATTRIBUTE_EFFECTS: Record<string, string> = {
  '火': '小火苗飘散在身体周围，暖橙红色光芒，火焰粒子',
  '水': '水滴飞溅，流动波浪纹理，冷蓝色微光',
  '草': '叶片飘落，藤蔓缠绕，绿色自然能量',
  '电': '闪电火花，黄色电流裂纹，电气光芒',
  '超能力': '紫色灵能光环，物体漂浮，精神能量波纹',
  '格斗': '格斗架势，冲击线条，红色力量爆发',
  '毒': '紫色毒雾缭绕，腐蚀性气泡',
  '地面': '沙尘飞扬，大地裂纹，土黄色岩石',
  '岩石': '碎石环绕，岩层纹理，厚重土褐能量',
  '虫': '虫翼鳞片闪光，丝线飘动，绿色微光',
  '飞行': '气流环绕，羽毛飘散，天空蓝色光晕',
  '幽灵': '半透明身影，紫色暗影飘带，诡异微光',
  '冰': '冰晶碎片飘散，霜冻粒子，冷蓝白光芒',
  '龙': '龙鳞微光闪烁，古老紫色-金色光环',
  '一般': '干净清爽，中性色调，微光点缀',
  '钢': '金属光泽，钢铁质感，银灰色光纹',
  '恶': '暗黑能量漩涡，紫黑色暗影，压迫感',
  '妖精': '粉色星光闪烁，梦幻花瓣飘落，柔和光芒',
};

const RARITY_POSE: Record<string, string> = {
  common: '简单站立或坐下，平静放松的姿态',
  rare: '动态动作姿态，展现个性与活力',
  'ultra-rare': '戏剧性强力姿态，全身可见，充满张力',
  legendary: '史诗传奇姿态，无上威严，全屏焦点',
};

const RARITY_EFFECT_INTENSITY: Record<string, string> = {
  common: '极简特效，干净清爽',
  rare: '中等特效，属性能量可见',
  'ultra-rare': '强烈特效，发光光环，边缘全息微光',
  legendary: '满屏元素光环，彩虹全息光芒，最华丽精美',
};

// ─── Types ───────────────────────────────────────────────────────────

interface CardRaw {
  id: string;
  generation: number;
  name: { zh: string; ja: string };
  number: string;
  attribute: string;
  rarity: string;
  evolution_stage: number;
  evolves_from?: string | null;
  evolves_to?: string[];
  effect_type: string;
  image_front?: string;
  image_frame_a?: string;
  image_frame_b?: string;
  image_frame_c?: string;
  back?: {
    skill: string;
    dp_attack: number;
    dp_defense: number;
    dp_speed?: number | null;
    height: string;
    weight: string;
    description: string;
    character_type?: string;
  };
}

interface MissingImageInfo {
  card: CardRaw;
  missingFrames: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadAllCards(): CardRaw[] {
  const cards: CardRaw[] = [];

  for (const gen of [1, 2]) {
    const genDir = path.join(DATA_DIR, `gen${gen}`);
    if (!fs.existsSync(genDir)) continue;

    const yamlFiles = fs.readdirSync(genDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
    for (const file of yamlFiles) {
      const filePath = path.join(genDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      try {
        cards.push(yaml.load(content) as CardRaw);
      } catch {
        // skip invalid YAML
      }
    }
  }

  return cards;
}

function findMissingImages(cards: CardRaw[]): MissingImageInfo[] {
  const results: MissingImageInfo[] = [];

  for (const card of cards) {
    const gen = card.generation === 1 ? 'gen1' : 'gen2';
    const missing: string[] = [];

    const frames: { field: string; relPath: string | undefined }[] = [
      { field: 'front', relPath: card.image_front },
      { field: 'frame-a', relPath: card.image_frame_a },
      { field: 'frame-b', relPath: card.image_frame_b },
    ];

    if (card.effect_type === 'triple') {
      frames.push({ field: 'frame-c', relPath: card.image_frame_c });
    }

    for (const frame of frames) {
      if (!frame.relPath) {
        missing.push(frame.field);
        continue;
      }
      const absPath = path.join(PUBLIC_DIR, frame.relPath.replace(/^\//, ''));
      if (!fs.existsSync(absPath)) {
        missing.push(frame.field);
      }
    }

    if (missing.length > 0) {
      results.push({ card, missingFrames: missing });
    }
  }

  return results;
}

function getStageLabel(stage: number): string {
  switch (stage) {
    case 1: return '基础形态';
    case 2: return '中级形态';
    case 3: return '最终形态';
    default: return `${stage}阶段`;
  }
}

function getEffectLabel(effectType: string): string {
  switch (effectType) {
    case 'evolution': return '进化前后 2 帧';
    case 'attack': return '攻击动作 2 帧';
    case 'triple': return '常态→蓄力→大招 3 帧';
    default: return effectType;
  }
}

function generateFramePrompt(
  card: CardRaw,
  frameLabel: string,
  stageDescription: string
): string {
  const { name, attribute, rarity, number } = card;
  const effect = ATTRIBUTE_EFFECTS[attribute] || '干净清爽的微光效果';
  const pose = RARITY_POSE[rarity] || '自然姿态';
  const intensity = RARITY_EFFECT_INTENSITY[rarity] || '适中特效';

  return `生成一张 2001 年奇多 Pokémon 旋风卡风格的圆形卡片插画。
精灵：${name.zh}（${name.ja}），全国图鉴 #${number}。
姿态：${pose}。${stageDescription}
元素特效：${effect}。${intensity}。
背景：${attribute}属性色调渐变，圆形卡片边框。
风格要求：
- 2000 年代怀旧日式动画风，鲜艳饱和配色，粗线条描边
- 圆形卡片构图（约 4cm 直径感），光栅卡质感（轻微 3D 深度、光泽表面）
- 精灵正面朝向，动态但轮廓清晰
- 干净插图，不要任何文字
- 分辨率 1024×1024，精灵居中`;
}

function generateCardPrompts(info: MissingImageInfo, cardMap: Map<string, CardRaw>): string {
  const { card, missingFrames } = info;
  const { id, name, number, attribute, rarity, evolution_stage, effect_type, evolves_from, evolves_to } = card;
  const gen = card.generation;
  const genLabel = gen === 1 ? '一代旋风卡' : '二代比斗卡';
  const stageLabel = getStageLabel(evolution_stage);

  // Use pre-loaded cardMap for evolution partner lookups
  const evolvesFromCard = evolves_from ? cardMap.get(evolves_from) : null;
  const evolvesToCards = (evolves_to || []).map((eid) => cardMap.get(eid)).filter(Boolean);

  let lines: string[] = [];
  lines.push(`# ${name.zh} (${name.ja}) · 卡片图片生成提示词`);
  lines.push(`卡片ID: ${id} | 全国图鉴: #${number} | 稀有度: ${rarity} | 属性: ${attribute}`);
  lines.push(`世代: ${genLabel} | 进化阶段: ${stageLabel}`);
  lines.push(`光栅类型: ${effect_type} (${getEffectLabel(effect_type)})`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Generate prompts for each missing frame
  if (missingFrames.includes('front')) {
    lines.push(`## 主图 (front.png)`);
    lines.push('用于卡片列表缩略图，取进化后姿态。');
    lines.push('');
    lines.push(generateFramePrompt(card, '主图', `${stageLabel}，正面全身像，代表性姿态。`));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // evolution-type frames
  if (effect_type === 'evolution') {
    if (missingFrames.includes('frame-a')) {
      const fromName = evolves_from ? cardMap.get(evolves_from)?.name.zh || '进化前形态' : name.zh;
      lines.push(`## Frame A: 进化前 (frame-a.png)`);
      lines.push('');
      lines.push(generateFramePrompt(
        card,
        `进化前形态`,
        `进化前姿态，尺寸稍小，姿态温和可爱。${evolvesFromCard ? `精灵名：${fromName}。` : ''}`
      ));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (missingFrames.includes('frame-b')) {
      const toName = evolvesToCards.length > 0 ? evolvesToCards[0]?.name.zh || '进化后形态' : name.zh;
      lines.push(`## Frame B: 进化后 (frame-b.png)`);
      lines.push('');
      lines.push(generateFramePrompt(
        card,
        `进化后形态`,
        `进化后姿态，尺寸稍大，姿态更强更有力，特效更明显。${evolvesToCards.length > 0 ? `精灵名：${toName}。` : ''}`
      ));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  } else if (effect_type === 'attack') {
    const skillName = card.back?.skill || '经典技能';

    if (missingFrames.includes('frame-a')) {
      lines.push(`## Frame A: 常态 (frame-a.png)`);
      lines.push('');
      lines.push(generateFramePrompt(card, '常态', `平静站姿，无特殊效果，精灵自然状态。`));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (missingFrames.includes('frame-b')) {
      lines.push(`## Frame B: 攻击 (frame-b.png)`);
      lines.push('');
      lines.push(generateFramePrompt(card, '攻击', `释放技能「${skillName}」姿态，技能效果全开，动态张力拉满。`));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  } else if (effect_type === 'triple') {
    if (missingFrames.includes('frame-a')) {
      lines.push(`## Frame A: 常态 (frame-a.png)`);
      lines.push('');
      lines.push(generateFramePrompt(card, '常态', `平静站姿，无明显特效，精灵自然状态。`));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (missingFrames.includes('frame-b')) {
      lines.push(`## Frame B: 蓄力 (frame-b.png)`);
      lines.push('');
      lines.push(generateFramePrompt(card, '蓄力', `蓄力姿态，元素能量汇聚，光芒逐渐增强。`));
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    if (missingFrames.includes('frame-c')) {
      const skillName = card.back?.skill || '大招技能';
      lines.push(`## Frame C: 大招 (frame-c.png)`);
      lines.push('');
      lines.push(generateFramePrompt(card, '大招', `全力释放「${skillName}」，最大特效，全屏元素爆发。`));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  lines.push('## 中文说明（供参考）');

  if (effect_type === 'evolution') {
    if (missingFrames.includes('frame-a')) {
      lines.push(`- Frame A: 进化前形态，${evolvesFromCard ? evolvesFromCard.name.zh : '较小'}`);
    }
    if (missingFrames.includes('frame-b')) {
      lines.push(`- Frame B: 进化后形态，${evolvesToCards.length > 0 ? evolvesToCards[0]?.name.zh : '较大'}`);
    }
  } else if (effect_type === 'attack') {
    lines.push('- Frame A: 常态站姿');
    lines.push(`- Frame B: 攻击姿态，技能「${card.back?.skill || '待定'}」`);
  } else if (effect_type === 'triple') {
    lines.push('- Frame A: 常态');
    lines.push('- Frame B: 蓄力');
    lines.push(`- Frame C: 大招`);
  }

  return lines.join('\n');
}

function generateBatchAll(infos: MissingImageInfo[], cardMap: Map<string, CardRaw>): string {
  const lines: string[] = [];

  lines.push('# 童年神奇卡片百科 · AI 生图批量提示词');
  lines.push('# 使用说明：复制以下内容，逐段粘贴到 ChatGPT (GPT-4o with DALL-E) 中');
  lines.push('# 每段 = 一张卡片的所有帧');
  lines.push('');
  lines.push(`共 ${infos.length} 张卡片缺图。`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (let i = 0; i < infos.length; i++) {
    const info = infos[i];
    const { card } = info;
    const stageLabel = getStageLabel(card.evolution_stage);

    lines.push(`## 卡片 ${i + 1}: ${card.name.zh} (${card.id})`);
    lines.push(`稀有度：${card.rarity} | 属性：${card.attribute} | 进化阶段：${stageLabel}`);
    lines.push(`effect_type: ${card.effect_type} (${getEffectLabel(card.effect_type)})`);
    lines.push('');
    lines.push(generateCardPrompts(info, cardMap));
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────

function main(): void {
  console.log('========================================');
  console.log('  童年神奇卡片百科 · 生图提示词生成');
  console.log('========================================\n');

  // Ensure prompts directory exists
  for (const dir of [PROMPTS_DIR, path.join(PROMPTS_DIR, 'gen1'), path.join(PROMPTS_DIR, 'gen2')]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const cards = loadAllCards();
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  console.log(`Loaded ${cards.length} cards.\n`);

  const missingInfos = findMissingImages(cards);

  if (missingInfos.length === 0) {
    console.log('✅ 所有卡片图片完整，无需生成提示词。');
    process.exit(0);
  }

  console.log(`📷 发现 ${missingInfos.length} 张卡片缺图。\n`);

  // Generate per-card prompt files
  for (const info of missingInfos) {
    const { card } = info;
    const gen = card.generation === 1 ? 'gen1' : 'gen2';
    const fileName = `${card.id}-prompts.md`;
    const outPath = path.join(PROMPTS_DIR, gen, fileName);

    const content = generateCardPrompts(info, cardMap);
    fs.writeFileSync(outPath, content, 'utf-8');

    console.log(`  📝 ${fileName} → ${gen}/`);
  }

  // Generate batch-all.md
  const batchAllPath = path.join(PROMPTS_DIR, 'batch-all.md');
  const batchAllContent = generateBatchAll(missingInfos, cardMap);
  fs.writeFileSync(batchAllPath, batchAllContent, 'utf-8');
  console.log(`\n  📦 batch-all.md（所有 ${missingInfos.length} 张卡片汇总）`);

  // Print summary
  const gen1Count = missingInfos.filter((i) => i.card.generation === 1).length;
  const gen2Count = missingInfos.filter((i) => i.card.generation === 2).length;

  console.log('\n========================================');
  console.log(`  总计: ${missingInfos.length} 张卡片 (${gen1Count} gen1 + ${gen2Count} gen2)`);
  console.log(`  输出: prompts/batch-all.md`);
  console.log(`        prompts/gen1/*.md`);
  console.log(`        prompts/gen2/*.md`);
  console.log('========================================');
  console.log('\n⏭️  下一步: 复制 prompts/batch-all.md 中的提示词，逐段粘贴到 ChatGPT 生图');
}

main();
