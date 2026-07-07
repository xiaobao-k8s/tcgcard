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

/**
 * Build all evolution chains from the card data.
 * Returns an array of chains, each ordered from base form to final form.
 */
export function getEvolutionChains(): Card[][] {
  const cards = loadCards();
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const chains: Card[][] = [];
  const visited = new Set<string>();

  for (const card of cards) {
    // Only start from base forms (no evolves_from)
    if (card.evolves_from) continue;

    const chain: Card[] = [];
    let current: Card | undefined = card;
    while (current) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      chain.push(current);
      // Follow the first evolves_to if it exists
      const nextId: string | undefined = current.evolves_to?.[0];
      current = nextId ? cardMap.get(nextId) : undefined;
    }

    if (chain.length > 0) {
      chains.push(chain);
    }
  }

  // Also include standalone cards (no evolution relationships) as single-element chains
  for (const card of cards) {
    if (!visited.has(card.id)) {
      visited.add(card.id);
      chains.push([card]);
    }
  }

  return chains;
}

/**
 * Group evolution chains by generation and attribute.
 */
export function getEvolutionChainsGrouped(): Record<string, Card[][]> {
  const chains = getEvolutionChains();
  const grouped: Record<string, Card[][]> = {};

  for (const chain of chains) {
    if (chain.length === 0) continue;
    const representative = chain[0];
    const key = `gen${representative.generation}-${representative.attribute}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(chain);
  }

  return grouped;
}

/**
 * Group cards by rarity tier, ordered from legendary to common.
 */
const RARITY_ORDER: Rarity[] = ['legendary', 'ultra-rare', 'rare', 'common'];

export function getCardsByRarity(): Record<Rarity, Card[]> {
  const cards = loadCards();
  const grouped: Record<Rarity, Card[]> = {
    legendary: [],
    'ultra-rare': [],
    rare: [],
    common: [],
  };

  for (const card of cards) {
    grouped[card.rarity].push(card);
  }

  // Sort each group by DP attack descending (strongest first)
  for (const rarity of RARITY_ORDER) {
    grouped[rarity].sort((a, b) => b.back.dp_attack - a.back.dp_attack);
  }

  return grouped;
}
