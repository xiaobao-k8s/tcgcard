'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';

interface EvolutionChainProps {
  /** The full evolution chain, ordered from base form to final form. */
  chain: Card[];
  /** The currently viewed card ID. */
  currentCardId: string;
}

/**
 * Get PokeAPI official artwork URL for a Pokémon
 */
function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}

export default function EvolutionChain({ chain, currentCardId }: EvolutionChainProps) {
  if (chain.length <= 1) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-sm font-medium text-text-secondary">进化链</h3>
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
        {chain.map((card, index) => (
          <div key={card.id} className="flex items-center gap-1 sm:gap-2">
            {/* Evolution arrow between cards */}
            {index > 0 && (
              <span className="text-text-secondary/50 text-lg select-none" aria-hidden="true">
                →
              </span>
            )}

            {/* Card node */}
            <Link
              href={`/${card.id}`}
              className={`
                group relative flex flex-col items-center gap-1
                transition-transform duration-200 hover:scale-110
              `}
            >
              <div
                className={`
                  w-14 h-14 sm:w-16 sm:h-16
                  rounded-full
                  bg-gradient-to-br ${getAttributeGradient(card.attribute, 'light')}
                  border-2
                  flex items-center justify-center
                  transition-all duration-200
                  overflow-hidden
                  relative
                  ${
                    card.id === currentCardId
                      ? 'border-primary shadow-[0_0_12px_4px_rgba(249,115,22,0.4)] ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }
                `}
              >
                <Image
                  src={getPokeApiImageUrl(card.number)}
                  alt={card.name.zh}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <span
                className={`
                  text-xs font-medium truncate max-w-16 sm:max-w-20 text-center
                  ${card.id === currentCardId ? 'text-primary' : 'text-text-secondary'}
                `}
              >
                {card.name.zh}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
