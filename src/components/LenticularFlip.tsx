'use client';

import { useState, useRef, type TouchEvent } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';

interface LenticularFlipProps {
  card: Card;
  /** The full evolution chain for this card (ordered from base to final). */
  evolutionChain?: Card[];
}

/**
 * Get PokeAPI official artwork URL for a Pokémon
 */
function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}

/**
 * Get the display label for the evolution frame.
 */
function getFrameLabel(card: Card, isFrameB: boolean): string {
  if (card.effect_type === 'evolution' && card.evolves_to && card.evolves_to.length > 0) {
    return isFrameB ? '✨ 进化形态' : '基础形态';
  }
  if (card.effect_type === 'triple') {
    return isFrameB ? '⚡ 蓄力状态' : '常态';
  }
  return isFrameB ? '🔥 大招' : '常态';
}

/**
 * Get the image URL for Frame B based on evolution chain
 */
function getFrameBImageUrl(card: Card, evolutionChain?: Card[]): string {
  // For evolution cards, show the next evolution stage
  if (card.effect_type === 'evolution' && card.evolves_to && card.evolves_to.length > 0 && evolutionChain) {
    const nextEvolution = evolutionChain.find(c => c.evolves_from === card.id);
    if (nextEvolution) {
      return getPokeApiImageUrl(nextEvolution.number);
    }
  }
  // For other cards, use the same image (will apply visual effects)
  return getPokeApiImageUrl(card.number);
}

export default function LenticularFlip({ card, evolutionChain }: LenticularFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const gradient = getAttributeGradient(card.attribute, 'dark');
  const frameAUrl = getPokeApiImageUrl(card.number);
  const frameBUrl = getFrameBImageUrl(card, evolutionChain);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    // Swipe threshold: 50px horizontal swipe triggers flip
    if (Math.abs(deltaX) > 50) {
      setIsFlipped((prev) => !prev);
    }
    touchStartX.current = null;
  };

  const handleTouchCancel = () => {
    touchStartX.current = null;
  };

  // Check if this is an evolution card with different images
  const hasEvolutionImage = card.effect_type === 'evolution' && frameAUrl !== frameBUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D lenticular card container */}
      <div className="perspective-[1000px]">
        <div
          className={`
            group relative
            w-56 h-56 sm:w-72 sm:h-72
            [transform-style:preserve-3d]
            [transition:transform_0.6s_cubic-bezier(0.4,0,0.2,1)]
            cursor-pointer
            ${isFlipped ? '[transform:rotateY(180deg)]' : 'hover:[transform:rotateY(180deg)]'}
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="button"
          tabIndex={0}
          aria-label="点击或悬停翻转卡片"
        >
          {/* Frame A (front face) - Base/Normal form */}
          <div
            className={`
              absolute inset-0 rounded-full
              bg-gradient-to-br ${gradient}
              border-4 border-white/30
              shadow-xl
              flex flex-col items-center justify-center
              [backface-visibility:hidden]
              overflow-hidden
            `}
          >
            {/* Pokémon image from PokeAPI */}
            <Image
              src={frameAUrl}
              alt={card.name.zh}
              fill
              className="object-contain p-4 transition-transform duration-300"
              unoptimized
              priority
            />
            {/* Label overlay */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
              <span className="text-white/90 text-sm font-bold drop-shadow-lg bg-black/40 px-3 py-1 rounded-full">
                {card.name.zh}
              </span>
              <span className="text-white/80 text-xs font-medium bg-black/30 px-2 py-0.5 rounded">
                {getFrameLabel(card, false)}
              </span>
            </div>
            {/* Lenticular ridge lines overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-10"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 3px)',
                }}
              />
            </div>
          </div>

          {/* Frame B (back face) - Evolved/Attack form */}
          <div
            className={`
              absolute inset-0 rounded-full
              bg-gradient-to-br ${gradient}
              border-4 border-white/40
              shadow-2xl
              flex flex-col items-center justify-center
              [backface-visibility:hidden]
              [transform:rotateY(180deg)]
              overflow-hidden
              ${hasEvolutionImage ? '' : ''}
            `}
          >
            {/* Pokémon image - evolved form or same with effects */}
            <Image
              src={frameBUrl}
              alt={`${card.name.zh} 进化形态`}
              fill
              className={`
                object-contain p-4 transition-transform duration-300
                ${hasEvolutionImage ? 'scale-110' : 'scale-105 brightness-125 saturate-150'}
              `}
              unoptimized
            />
            {/* Dramatic glow effect for Frame B */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className={`w-full h-full ${hasEvolutionImage ? 'bg-gradient-to-tr from-yellow-300/30 via-transparent to-orange-400/30' : 'bg-gradient-to-tr from-cyan-300/40 via-transparent to-purple-400/40'}`} />
            </div>
            {/* Intense shimmer effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tr from-white/0 via-white/30 to-white/0 animate-pulse" />
            </div>
            {/* Lenticular ridge lines overlay (more intense) */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-20"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
                }}
              />
            </div>
            {/* Label overlay for Frame B */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
              <span className="text-white text-sm font-bold drop-shadow-lg bg-gradient-to-r from-orange-500/80 to-red-500/80 px-3 py-1 rounded-full shadow-lg">
                {getFrameLabel(card, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status label below with flip indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span className={`transition-opacity duration-300 ${!isFlipped ? 'opacity-100' : 'opacity-40'}`}>
            {getFrameLabel(card, false)}
          </span>
          <span className="text-primary animate-pulse">⟷</span>
          <span className={`transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-40'}`}>
            {getFrameLabel(card, true)}
          </span>
        </div>
        <p className="text-text-secondary/60 text-xs">
          悬停或滑动卡片查看光栅效果
        </p>
      </div>
    </div>
  );
}
