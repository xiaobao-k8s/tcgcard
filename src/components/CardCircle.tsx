'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';
import { getImageUrl, getPokeApiImageUrl } from '@/lib/image-url';

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

/** All 34 cards now have local images from PokeAPI download */
const LOCAL_IMAGE_CARDS = new Set([
  ...Array.from({ length: 24 }, (_, i) => `xfd-${String(i + 1).padStart(3, '0')}`),
  ...Array.from({ length: 10 }, (_, i) => `ybd-${String(i + 1).padStart(3, '0')}`),
]);

export default function CardCircle({ card }: CardCircleProps) {
  const sizeClass = getSizeClasses(card.rarity);
  const glowClass = getGlowClasses(card.rarity);
  const gradient = getAttributeGradient(card.attribute, 'medium');
  // Use local image if available, otherwise PokeAPI
  const imgSrc = LOCAL_IMAGE_CARDS.has(card.id) ? getImageUrl(card.image_front) : getPokeApiImageUrl(card.number);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Link
      href={`/${card.id}`}
      className={`group relative inline-flex flex-col items-center`}
      title={`${card.name.zh} #${card.number}`}
      prefetch={true}
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
          overflow-hidden
          relative
        `}
      >
        {/* Pokémon image — only show if not failed */}
        {!imgFailed && (
          <Image
            src={imgSrc}
            alt={card.name.zh}
            fill
            className="object-contain p-1"
            unoptimized
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
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
