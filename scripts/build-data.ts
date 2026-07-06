/**
 * Build script: Convert YAML card data to JSON.
 * Run with: npx tsx scripts/build-data.ts
 * Output: public/data/cards.json
 */

import fs from 'fs';
import path from 'path';
import { loadCards } from '../src/lib/cards';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'cards.json');

function main() {
  console.log('Loading YAML card data...');
  const cards = loadCards();
  console.log(`Found ${cards.length} cards.`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2), 'utf-8');
  console.log(`Written to ${OUTPUT_FILE}`);
}

main();
