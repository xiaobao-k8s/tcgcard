'use client';

import Link from 'next/link';
import type { Card } from '@/lib/types';
import { getAttributeEmoji } from '@/lib/attribute-emoji';

interface EvolutionChainProps {
  /** The full evolution chain, ordered from base form to final form. */
  chain: Card[];
  /** The currently viewed card ID. */
  currentCardId: string;
}

/**
 * Map attribute to a small gradient for the mini circle.
 */
function getMiniGradient(attribute: string): string {
  const base: Record<string, string> = {
    '火': 'from-orange-300 to-red-400',
    '草': 'from-green-300 to-emerald-400',
    '水': 'from-blue-300 to-cyan-400',
    '雷': 'from-yellow-300 to-amber-400',
    '超能力': 'from-pink-300 to-purple-400',
    '格斗': 'from-amber-300 to-orange-400',
    '毒': 'from-purple-300 to-fuchsia-400',
    '地面': 'from-yellow-400 to-amber-500',
    '岩石': 'from-stone-300 to-stone-400',
    '虫': 'from-lime-300 to-green-400',
    '幽灵': 'from-indigo-300 to-purple-400',
    '钢': 'from-gray-300 to-slate-400',
    '飞行': 'from-sky-300 to-blue-300',
    '冰': 'from-cyan-300 to-blue-300',
    '龙': 'from-violet-400 to-purple-500',
  };
  return base[attribute] ?? 'from-orange-200 to-yellow-300';
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
                  bg-gradient-to-br ${getMiniGradient(card.attribute)}
                  border-2
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    card.id === currentCardId
                      ? 'border-primary shadow-[0_0_12px_4px_rgba(249,115,22,0.4)] ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50 hover:shadow-md'
                  }
                `}
              >
                <span className="text-xl sm:text-2xl" role="img" aria-label={card.attribute}>
                  {getAttributeEmoji(card.attribute)}
                </span>
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
