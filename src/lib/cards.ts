import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Card, CardFilters, Generation, Rarity } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Module-level cached cards data to avoid repeated disk reads.
 */
const cardsCache = loadCardsRaw();

export function loadCards(): Card[] {
  return cardsCache;
}

/**
 * Load all card YAML files from the data directory.
 * Reads data/gen1/*.yaml and data/gen2/*.yaml
 */
function loadCardsRaw(): Card[] {
  const cards: Card[] = [];
  const generations: Generation[] = [1, 2];

  for (const gen of generations) {
    const genDir = path.join(DATA_DIR, `gen${gen}`);
    if (!fs.existsSync(genDir)) continue;

    const files = fs.readdirSync(genDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
      const filePath = path.join(genDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = yaml.load(content) as Card;
      cards.push(data);
    }
  }

  return cards;
}

/**
 * Get a single card by its ID.
 */
export function getCardById(id: string): Card | undefined {
  const cards = loadCards();
  return cards.find((card) => card.id === id);
}

/**
 * Filter cards by generation, attribute, rarity, and/or search term.
 */
export function filterCards(filters: CardFilters): Card[] {
  const cards = loadCards();

  return cards.filter((card) => {
    if (filters.generation && card.generation !== filters.generation) return false;
    if (filters.attribute && card.attribute !== filters.attribute) return false;
    if (filters.rarity && card.rarity !== filters.rarity) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const matchesName =
        card.name.zh.toLowerCase().includes(term) ||
        card.name.ja.toLowerCase().includes(term) ||
        card.id.toLowerCase().includes(term);
      if (!matchesName) return false;
    }
    return true;
  });
}

/**
 * Get all unique attributes from cards.
 */
export function getAttributes(): string[] {
  const cards = loadCards();
  return Array.from(new Set(cards.map((c) => c.attribute))).sort();
}

/**
 * Get all unique rarities from cards.
 */
export function getRarities(): Rarity[] {
  const cards = loadCards();
  return Array.from(new Set(cards.map((c) => c.rarity))) as Rarity[];
}
