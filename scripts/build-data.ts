/**
 * Build script: Convert YAML card data to JSON.
 * Run with: npx tsx scripts/build-data.ts
 * Output: public/data/cards.json
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const DATA_DIR = path.join(process.cwd(), 'data');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cards.json');

interface CardData {
  id: string;
  [key: string]: unknown;
}

function loadAllCards(): CardData[] {
  const cards: CardData[] = [];
  const generations = [1, 2];

  for (const gen of generations) {
    const genDir = path.join(DATA_DIR, `gen${gen}`);
    if (!fs.existsSync(genDir)) continue;

    const files = fs
      .readdirSync(genDir)
      .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
      const filePath = path.join(genDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content) as CardData;
      cards.push(data);
    }
  }

  return cards;
}

function main() {
  console.log('Loading YAML card data...');
  const cards = loadAllCards();
  console.log(`Found ${cards.length} cards.`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  console.log(`Written to ${OUTPUT_FILE}`);
}

main();
