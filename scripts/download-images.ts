/** 下载 PokeAPI 精灵图到本地，避免线上 429 限流 */
import { loadCards } from '../src/lib/cards';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import https from 'https';

const TYPES = ['front', 'frame-a', 'frame-b'] as const;
const LOCAL_IMAGE_CARDS = new Set(
  Array.from({ length: 9 }, (_, i) => `xfd-${String(i + 1).padStart(3, '0')}`)
);

function getPokemonImageUrl(number: string): string {
  // 使用 Pokemon 官方图片源（assets.pokemon.com），无速率限制
  const dexNum = parseInt(number, 10);
  const padded = String(dexNum).padStart(3, '0');
  return `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${padded}.png`;
}

function download(url: string, dest: string, retries = 3): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 429) {
        if (retries > 0) {
          console.log(`  ⏳ 429, ${retries}次重试...`);
          setTimeout(() => download(url, dest, retries - 1).then(resolve).catch(reject), 2000);
        } else {
          reject(new Error('429 重试用完'));
        }
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => writeFile(dest, Buffer.concat(chunks)).then(resolve).catch(reject));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const cards = loadCards();
  console.log(`📦 ${cards.length} 张卡片`);

  mkdirSync('public/cards/gen1', { recursive: true });
  mkdirSync('public/cards/gen2', { recursive: true });

  let downloaded = 0, skipped = 0, failed = 0;

  for (const [idx, card] of cards.entries()) {
    const prefix = card.generation === 1 ? 'gen1' : 'gen2';
    console.log(`\n[${idx + 1}/${cards.length}] ${card.name.zh} (${card.id})`);

    for (const type of TYPES) {
      const suffix = type === 'front' ? 'front' : type;
      const dest = `public/cards/${prefix}/${card.id}-${suffix}.png`;

      if (existsSync(dest)) { skipped++; continue; }
      if (prefix === 'gen1' && LOCAL_IMAGE_CARDS.has(card.id)) { skipped++; continue; }

      const url = getPokemonImageUrl(card.number);
      try {
        await download(url, dest);
        console.log(`  ✅ ${card.id}-${suffix}.png`);
        downloaded++;
      } catch (e) {
        console.error(`  ❌ ${card.id}-${suffix}.png — ${(e as Error).message}`);
        failed++;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n📊 完成: ${downloaded} 下载, ${skipped} 跳过, ${failed} 失败`);
}

main().catch(console.error);
