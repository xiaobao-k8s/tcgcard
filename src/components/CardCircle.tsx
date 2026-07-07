'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';

interface CardCircleProps {
  card: Card;
  sizeClass?: string;
  glowClass?: string;
}

/**
 * Get PokeAPI official artwork URL for a Pokémon
 */
function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
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

export default function CardCircle({ card }: CardCircleProps) {
  const sizeClass = getSizeClasses(card.rarity);
  const glowClass = getGlowClasses(card.rarity);
  const gradient = getAttributeGradient(card.attribute, 'medium');
  // Try local image first, fallback to PokeAPI on error
  const [imgSrc, setImgSrc] = useState(card.image_front);
  const pokeApiFallback = getPokeApiImageUrl(card.number);

  return (
    <Link
      href={`/${card.id}`}
      className={`group relative inline-flex flex-col items-center`}
      title={`${card.name.zh} #${card.number}`}
      prefetch={true}
    >
      {/* Circle bubble with Pokémon image */}
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
        {/* Pokémon image — local first, PokeAPI fallback */}
        <Image
          src={imgSrc}
          alt={card.name.zh}
          fill
          className="object-contain p-1.5"
          unoptimized
          loading="lazy"
          onError={() => setImgSrc(pokeApiFallback)}
        />
        {/* Subtle edge softener — doesn't add new colors, just darkens image edges slightly */}
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_0_6px_rgba(0,0,0,0.12)]" />
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
