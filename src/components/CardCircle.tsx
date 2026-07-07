'use client';

import Link from 'next/link';
import type { Card } from '@/lib/types';
import { getAttributeEmoji } from '@/lib/attribute-emoji';

interface CardCircleProps {
  card: Card;
  sizeClass?: string;
  glowClass?: string;
}

/**
 * Map rarity to visual size classes for the bubble grid.
 * Higher rarity = larger circle.
 */
function getSizeClasses(rarity: Card['rarity']): string {
  switch (rarity) {
    case 'legendary':
      return 'w-28 h-28 sm:w-32 sm:h-32';
    case 'ultra-rare':
      return 'w-24 h-24 sm:w-28 sm:h-28';
    case 'rare':
      return 'w-20 h-20 sm:w-24 sm:h-24';
    case 'common':
      return 'w-16 h-16 sm:w-20 sm:h-20';
  }
}

/**
 * Map rarity to glow/shadow effects.
 * Higher rarity = stronger glow.
 */
function getGlowClasses(rarity: Card['rarity']): string {
  switch (rarity) {
    case 'legendary':
      return 'shadow-[0_0_24px_8px_rgba(139,92,246,0.5)] border-legendary-glow/60';
    case 'ultra-rare':
      return 'shadow-[0_0_18px_6px_rgba(239,68,68,0.4)] border-rare-glow/50';
    case 'rare':
      return 'shadow-[0_0_10px_3px_rgba(249,115,22,0.3)] border-primary/40';
    case 'common':
      return 'shadow-md border-border';
  }
}

/**
 * Map rarity to emoji display size inside the circle.
 */
function getEmojiSize(rarity: Card['rarity']): string {
  switch (rarity) {
    case 'legendary':
      return 'text-4xl sm:text-5xl';
    case 'ultra-rare':
      return 'text-3xl sm:text-4xl';
    case 'rare':
      return 'text-2xl sm:text-3xl';
    case 'common':
      return 'text-xl sm:text-2xl';
  }
}

/**
 * Map attribute to gradient background colors.
 */
function getGradient(attribute: string): string {
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

export default function CardCircle({ card }: CardCircleProps) {
  const sizeClass = getSizeClasses(card.rarity);
  const glowClass = getGlowClasses(card.rarity);
  const emojiSize = getEmojiSize(card.rarity);
  const gradient = getGradient(card.attribute);

  return (
    <Link
      href={`/${card.id}`}
      className={`group relative inline-flex flex-col items-center`}
      title={`${card.name.zh} #${card.number}`}
    >
      {/* Circle bubble */}
      <div
        className={`
          ${sizeClass}
          rounded-full
          bg-gradient-to-br ${gradient}
          border-2 ${glowClass}
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-xl
          cursor-pointer
        `}
      >
        <span className={emojiSize} role="img" aria-label={card.attribute}>
          {getAttributeEmoji(card.attribute)}
        </span>
      </div>

      {/* Tooltip — visible on hover */}
      <div className="
        absolute -bottom-14 left-1/2 -translate-x-1/2
        bg-text-primary text-white text-xs rounded-lg px-3 py-1.5
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        pointer-events-none whitespace-nowrap z-10
        shadow-lg
      ">
        <span className="font-medium">{card.name.zh}</span>
        <span className="text-white/70 ml-1">#{card.number}</span>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-primary rotate-45" />
      </div>

      {/* Name label below circle (always visible for accessibility) */}
      <span className="mt-4 text-xs sm:text-sm text-text-primary font-medium truncate max-w-full text-center">
        {card.name.zh}
      </span>
    </Link>
  );
}
