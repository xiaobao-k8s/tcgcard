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

  // Determine previous and next cards (by current display order)
  const currentIndex = allCards.findIndex(c => c.id === card.id);
  const prevCard = currentIndex > 0 ? allCards[currentIndex - 1] : null;
  const nextCard = currentIndex < allCards.length - 1 ? allCards[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Header with breadcrumb */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white px-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="hover:underline opacity-80 hover:opacity-100 transition-opacity">
              图鉴
            </Link>
            <span className="opacity-50">/</span>
            <span className="opacity-80">{card.generation === 1 ? '一代·旋风卡' : '二代·比斗卡'}</span>
            <span className="opacity-50">/</span>
            <span className="opacity-80">{card.attribute}</span>
            <span className="opacity-50">/</span>
            <span className="font-medium">{card.name.zh}</span>
          </div>
          {/* Card count badge */}
          <span className="bg-white/20 rounded-full px-3 py-1 text-xs">
            {currentIndex + 1} / {allCards.length}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <CardDetail
          card={card}
          evolutionChain={evolutionChain}
          prevCard={prevCard}
          nextCard={nextCard}
          currentIndex={currentIndex}
          totalCards={allCards.length}
        />
      </main>
    </div>
  );
}
