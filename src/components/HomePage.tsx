'use client';

import { useState, useMemo } from 'react';
import type { Card, Generation, Rarity } from '@/lib/types';
import CardCircle from '@/components/CardCircle';
import FilterBar from '@/components/FilterBar';

interface HomePageProps {
  cards: Card[];
  attributes: string[];
  rarities: Rarity[];
}

export default function HomePage({ cards, attributes, rarities }: HomePageProps) {
  // Filter state
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [attribute, setAttribute] = useState<string | null>(null);
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [search, setSearch] = useState('');

  // Filtered cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (generation && card.generation !== generation) return false;
      if (attribute && card.attribute !== attribute) return false;
      if (rarity && card.rarity !== rarity) return false;
      if (search) {
        const term = search.toLowerCase();
        const matchesName =
          card.name.zh.toLowerCase().includes(term) ||
          card.name.ja.toLowerCase().includes(term) ||
          card.id.toLowerCase().includes(term) ||
          card.number.toLowerCase().includes(term);
        if (!matchesName) return false;
      }
      return true;
    });
  }, [cards, generation, attribute, rarity, search]);

  // Sort by rarity weight (legendary > ultra-rare > rare > common)
  const sortedCards = useMemo(() => {
    const rarityWeight: Record<string, number> = {
      legendary: 4,
      'ultra-rare': 3,
      rare: 2,
      common: 1,
    };
    return [...filteredCards].sort(
      (a, b) => (rarityWeight[b.rarity] ?? 0) - (rarityWeight[a.rarity] ?? 0)
    );
  }, [filteredCards]);

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-4 px-4 shadow-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">
              🌀
            </span>
            <span className="text-lg font-bold hidden sm:inline">童年神奇卡片百科</span>
          </a>

          {/* Subtitle */}
          <p className="text-sm opacity-90 hidden md:block flex-1 text-center">
            童年没集齐的，来这里补全
          </p>

          {/* Card count badge */}
          <span className="shrink-0 bg-white/20 rounded-full px-3 py-1 text-xs">
            {cards.length} 张
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filter Bar */}
        <section className="mb-8">
          <FilterBar
            generation={generation}
            attribute={attribute}
            rarity={rarity}
            search={search}
            attributes={attributes}
            rarities={rarities}
            onGenerationChange={setGeneration}
            onAttributeChange={setAttribute}
            onRarityChange={setRarity}
            onSearchChange={setSearch}
          />
        </section>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-medium text-text-secondary">
            {sortedCards.length === cards.length
              ? `全部卡片`
              : `筛选结果：${sortedCards.length} 张`}
          </h2>
          {(generation || attribute || rarity || search) && (
            <button
              onClick={() => {
                setGeneration(null);
                setAttribute(null);
                setRarity(null);
                setSearch('');
              }}
              className="text-xs text-primary hover:underline"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Rarity Bubble Grid */}
        {sortedCards.length > 0 ? (
          <section className="flex flex-wrap justify-center gap-x-6 gap-y-14 pb-8">
            {sortedCards.map((card) => (
              <CardCircle key={card.id} card={card} />
            ))}
          </section>
        ) : (
          <div className="text-center py-16">
            <span className="text-4xl">🔍</span>
            <p className="mt-4 text-text-secondary">没有找到匹配的卡片</p>
            <p className="text-xs text-text-secondary/70 mt-1">试试调整筛选条件</p>
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>童年神奇卡片百科 &copy; 2026 · 童年神奇卡片百科</p>
      </footer>
    </div>
  );
}
