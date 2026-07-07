import { getCardById, loadCards } from '@/lib/cards';
import type { Card } from '@/lib/types';
import CardDetail from '@/components/CardDetail';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { cardId: string };
}

export function generateStaticParams(): { cardId: string }[] {
  return loadCards().map((card) => ({ cardId: card.id }));
}

/**
 * Build the full evolution chain for a given card by traversing
 * evolves_from upward and then evolves_to downward.
 */
function buildEvolutionChain(card: Card, allCards: Card[]): Card[] {
  const cardMap = new Map(allCards.map((c) => [c.id, c]));
  const chain: Card[] = [];

  // Walk up to find the base form
  let current: Card | undefined = card;
  const visited = new Set<string>();
  while (current) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    chain.unshift(current);
    if (current.evolves_from) {
      current = cardMap.get(current.evolves_from);
    } else {
      break;
    }
  }

  // Walk down from the original card to collect all descendants
  const queue: Card[] = [card];
  const visitedDown = new Set<string>([card.id]);
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (node.evolves_to) {
      for (const nextId of node.evolves_to) {
        if (!visitedDown.has(nextId)) {
          const nextCard = cardMap.get(nextId);
          if (nextCard) {
            visitedDown.add(nextId);
            chain.push(nextCard);
            queue.push(nextCard);
          }
        }
      }
    }
  }

  // Deduplicate chain (base walk may have added cards that the down-walk also finds)
  const seen = new Set<string>();
  const deduped: Card[] = [];
  for (const c of chain) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      deduped.push(c);
    }
  }

  return deduped;
}

export default function CardDetailPage({ params }: PageProps) {
  const card = getCardById(params.cardId);
  if (!card) notFound();

  const allCards = loadCards();
  const evolutionChain = buildEvolutionChain(card, allCards);

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Header with breadcrumb navigation */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-4 px-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
          <Link href="/" className="hover:underline opacity-80 hover:opacity-100 transition-opacity">
            图鉴
          </Link>
          <span className="opacity-50">/</span>
          <span className="opacity-80">
            {card.generation === 1 ? '一代·旋风卡' : '二代·比斗卡'}
          </span>
          <span className="opacity-50">/</span>
          <span className="opacity-80">{card.attribute}</span>
          <span className="opacity-50">/</span>
          <span className="font-medium">{card.name.zh}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Card title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            {card.name.zh}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {card.name.ja} · #{card.number}
          </p>
        </div>

        {/* CardDetail component (lenticular flip + evolution chain + back data + rarity) */}
        <CardDetail card={card} evolutionChain={evolutionChain} />
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>奇多卡片百科 &copy; 2026 · 怀旧零食风宝可梦图鉴</p>
      </footer>
    </div>
  );
}
