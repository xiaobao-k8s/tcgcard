'use client';

import { useState, useRef, useEffect, type TouchEvent } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getAttributeGradient } from '@/lib/attribute-gradient';

interface LenticularFlipProps {
  card: Card;
  evolutionChain?: Card[];
}

function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}

function getFrameLabel(card: Card, isFrameB: boolean): string {
  if (card.effect_type === 'evolution' && card.evolves_to && card.evolves_to.length > 0) {
    return isFrameB ? '进化形态' : '基础形态';
  }
  if (card.effect_type === 'triple') {
    return isFrameB ? '蓄力状态' : '常态';
  }
  return isFrameB ? '大招' : '常态';
}

function getFrameBImageUrl(card: Card, evolutionChain?: Card[]): string {
  if (card.effect_type === 'evolution' && card.evolves_to && card.evolves_to.length > 0 && evolutionChain) {
    const nextEvolution = evolutionChain.find(c => c.evolves_from === card.id);
    if (nextEvolution) return getPokeApiImageUrl(nextEvolution.number);
  }
  return getPokeApiImageUrl(card.number);
}

export default function LenticularFlip({ card, evolutionChain }: LenticularFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [autoPlayed, setAutoPlayed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const gradient = getAttributeGradient(card.attribute, 'dark');
  const frameAUrl = getPokeApiImageUrl(card.number);
  const frameBUrl = getFrameBImageUrl(card, evolutionChain);
  const hasEvolutionImage = card.effect_type === 'evolution' && frameAUrl !== frameBUrl;

  // Auto play flip animation on first load
  useEffect(() => {
    if (!autoPlayed) {
      const timer = setTimeout(() => {
        setIsAnimating(true);
        setIsFlipped(true);
        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => setIsAnimating(false), 600);
        }, 1200);
      }, 1000);
      setAutoPlayed(true);
      return () => clearTimeout(timer);
    }
  }, [autoPlayed]);

  const toggleFlip = () => {
    setIsAnimating(true);
    setIsFlipped((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) toggleFlip();
    touchStartX.current = null;
  };

  const handleTouchCancel = () => { touchStartX.current = null; };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D card container */}
      <div
        className="perspective-[1000px] select-none"
        onClick={toggleFlip}
      >
        <div
          className={`
            relative
            w-56 h-56 sm:w-72 sm:h-72
            [transform-style:preserve-3d]
            cursor-pointer
            transition-all duration-700 ease-out
            ${isFlipped ? '[transform:rotateY(180deg)_scale(1.02)]' : ''}
            ${isAnimating ? 'scale-105' : ''}
            hover:scale-[1.03]
          `}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFlip(); }}
          aria-label={`${card.name.zh} — 点击翻转`}
        >
          {/* ─── Frame A (Front) ─── */}
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
            <Image
              src={frameAUrl}
              alt={card.name.zh}
              fill
              className="object-contain p-4"
              unoptimized
              priority
            />
            {/* Name label */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
              <span className="text-white/90 text-sm font-bold drop-shadow-lg bg-black/40 px-3 py-1 rounded-full">
                {card.name.zh}
              </span>
              <span className="bg-black/30 text-white/70 text-[10px] px-2 py-0.5 rounded">
                {getFrameLabel(card, false)}
              </span>
            </div>
            {/* Lenticular ridges */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(255,255,255,0.08) 1.5px, rgba(255,255,255,0.08) 3px)',
              }} />
            </div>
          </div>

          {/* ─── Frame B (Back) ─── */}
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
            {/* Pokémon image — with dramatic filter effects */}
            <div className="absolute inset-0">
              <Image
                src={frameBUrl}
                alt={`${card.name.zh} ${getFrameLabel(card, true)}`}
                fill
                className={`
                  object-contain p-4
                  ${hasEvolutionImage ? 'scale-110' : 'scale-105'}
                  brightness-110 saturate-150
                `}
                unoptimized
              />
              {/* Hue shift overlay for dramatic effect */}
              {!hasEvolutionImage && (
                <div className="absolute inset-0 mix-blend-color" style={{ backgroundColor: 'rgba(255, 100, 50, 0.15)' }} />
              )}
            </div>

            {/* Holographic rainbow shimmer */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-30"
                style={{
                  background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)',
                  animation: 'spin 3s linear infinite',
                }}
              />
            </div>

            {/* Radial glow pulse */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            </div>

            {/* Intense lenticular ridges for Frame B */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(255,255,255,0.15) 1.5px, rgba(255,255,255,0.15) 3px)',
              }} />
            </div>

            {/* Frame B label */}
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 z-10">
              <span className="text-white text-sm font-bold drop-shadow-lg bg-gradient-to-r from-orange-500/90 to-red-500/90 px-3 py-1 rounded-full shadow-lg">
                ✨ {getFrameLabel(card, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Status area ─── */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Flip indicator bar */}
        <div className="flex items-center gap-3 w-full max-w-[200px]">
          <span className={`text-xs font-medium transition-all duration-500 ${!isFlipped ? 'text-primary scale-110' : 'text-text-secondary/50'}`}>
            {getFrameLabel(card, false)}
          </span>
          <div className="flex-1 h-6 bg-gray-200/50 rounded-full overflow-hidden relative">
            <div
              className={`
                h-full rounded-full transition-all duration-700 ease-out
                ${gradient.includes('orange') ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                  gradient.includes('red') ? 'bg-gradient-to-r from-red-400 to-red-600' :
                  gradient.includes('blue') ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  gradient.includes('green') ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  gradient.includes('purple') ? 'bg-gradient-to-r from-purple-400 to-purple-600' :
                  'bg-gradient-to-r from-primary to-orange-500'}
              `}
              style={{
                width: '50%',
                marginLeft: isFlipped ? '50%' : '0%',
              }}
            />
          </div>
          <span className={`text-xs font-medium transition-all duration-500 ${isFlipped ? 'text-primary scale-110' : 'text-text-secondary/50'}`}>
            {getFrameLabel(card, true)}
          </span>
        </div>

        {/* Hint text */}
        <p className="text-text-secondary/50 text-[10px] tracking-wide">
          点击卡片翻转 · 滑动切换形态
        </p>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
