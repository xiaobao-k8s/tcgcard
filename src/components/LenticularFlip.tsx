'use client';

import { useState, useRef, type TouchEvent } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';

interface LenticularFlipProps {
  card: Card;
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
 * For evolution-type cards, frame A shows the base form, frame B shows the evolved form.
 * For attack-type cards, frame A shows normal, frame B shows attack pose.
 */
function getFrameLabel(card: Card, isFrameB: boolean): string {
  if (card.effect_type === 'evolution' && card.evolves_to && card.evolves_to.length > 0) {
    return isFrameB ? '进化形态' : '基础形态';
  }
  if (card.effect_type === 'triple') {
    return isFrameB ? '蓄力状态' : '常态';
  }
  return isFrameB ? '大招' : '常态';
}

export default function LenticularFlip({ card }: LenticularFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const gradient = getAttributeGradient(card.attribute, 'dark');
  const imageUrl = getPokeApiImageUrl(card.number);

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
          {/* Frame A (front face) */}
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
              src={imageUrl}
              alt={card.name.zh}
              fill
              className="object-contain p-4"
              unoptimized
              priority
            />
            <span className="absolute bottom-8 text-white/90 text-sm font-medium drop-shadow bg-black/20 px-2 py-0.5 rounded">
              {card.name.zh}
            </span>
            {/* Lenticular ridge lines overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-10"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 3px)',
                }}
              />
            </div>
            {/* Frame label */}
            <span className="absolute bottom-4 text-white/70 text-xs">
              {getFrameLabel(card, false)}
            </span>
          </div>

          {/* Frame B (back face, shown on hover flip) */}
          <div
            className={`
              absolute inset-0 rounded-full
              bg-gradient-to-br ${gradient}
              border-4 border-white/30
              shadow-xl
              flex flex-col items-center justify-center
              [backface-visibility:hidden]
              [transform:rotateY(180deg)]
              overflow-hidden
            `}
          >
            {/* Pokémon image from PokeAPI (same as front for now) */}
            <Image
              src={imageUrl}
              alt={card.name.zh}
              fill
              className="object-contain p-4 brightness-110"
              unoptimized
            />
            {/* Shimmer effect for evolved/attack form */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full bg-gradient-to-tr from-white/0 via-white/20 to-white/0" />
            </div>
            {/* Lenticular ridge lines overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-15"
                style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 3px)',
                }}
              />
            </div>
            <span className="absolute bottom-4 text-white/90 text-xs font-medium">
              {getFrameLabel(card, true)}
            </span>
          </div>
        </div>
      </div>

      {/* Status label below */}
      <p className="text-text-secondary text-sm">
        悬停或滑动查看光栅翻转效果
      </p>
    </div>
  );
}
