'use client';

import { useState, useRef, type TouchEvent } from 'react';
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
    if (nextEvolution) return nextEvolution.image_frame_b || getPokeApiImageUrl(nextEvolution.number);
  }
  // Use local frame-b image, fallback to PokeAPI
  return card.image_frame_b || getPokeApiImageUrl(card.number);
}

/** Attribute accent colors for frame labels */
const ATTR_LABEL: Record<string, { from: string; to: string }> = {
  fire:    { from: 'from-orange-500', to: 'to-red-600' },
  water:   { from: 'from-sky-400', to: 'to-blue-600' },
  grass:   { from: 'from-green-400', to: 'to-emerald-600' },
  electric: { from: 'from-yellow-300', to: 'to-amber-500' },
  psychic: { from: 'from-pink-400', to: 'to-purple-600' },
  ice:     { from: 'from-cyan-300', to: 'to-blue-500' },
  dragon:  { from: 'from-violet-400', to: 'to-purple-600' },
  dark:    { from: 'from-gray-500', to: 'to-gray-800' },
  fairy:   { from: 'from-pink-300', to: 'to-red-400' },
  fighting: { from: 'from-red-500', to: 'to-orange-700' },
  flying:  { from: 'from-indigo-300', to: 'to-sky-500' },
  poison:  { from: 'from-purple-400', to: 'to-fuchsia-600' },
  ground:  { from: 'from-amber-400', to: 'to-yellow-700' },
  rock:    { from: 'from-stone-400', to: 'to-amber-700' },
  bug:     { from: 'from-lime-400', to: 'to-green-600' },
  ghost:   { from: 'from-indigo-500', to: 'to-purple-800' },
  steel:   { from: 'from-gray-300', to: 'to-slate-600' },
};
function getAttrLabel(effect: string): { from: string; to: string } {
  const key = Object.keys(ATTR_LABEL).find(k =>
    effect.includes(k) || effect.includes({
      '火': 'fire', '水': 'water', '草': 'grass', '电': 'electric',
      '超能力': 'psychic', '冰': 'ice', '龙': 'dragon', '恶': 'dark',
      '妖精': 'fairy', '格斗': 'fighting', '飞行': 'flying', '毒': 'poison',
      '地面': 'ground', '岩石': 'rock', '虫': 'bug', '幽灵': 'ghost',
      '钢': 'steel', '一般': 'steel',
    }[effect] || '')
  );
  return ATTR_LABEL[key || 'fire'];
}

export default function LenticularFlip({ card, evolutionChain }: LenticularFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const sparkleId = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const gradient = getAttributeGradient(card.attribute, 'dark');
  // Use local image for frame A, fallback to PokeAPI on error
  const [frameAUrl, setFrameAUrl] = useState(card.image_frame_a || getPokeApiImageUrl(card.number));
  const frameBUrl = getFrameBImageUrl(card, evolutionChain);
  const hasEvolutionImage = card.effect_type === 'evolution' && frameAUrl !== frameBUrl;
  const labelColor = getAttrLabel(card.attribute);

  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
    // Spawn sparkle particles on flip
    const newSparkles = Array.from({ length: 5 }, (_, i) => ({
      id: sparkleId.current++,
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 70,
      delay: i * 0.08,
    }));
    setSparkles((prev) => [...prev.slice(-10), ...newSparkles]);
    setTimeout(() => setSparkles((prev) => prev.filter(s => !newSparkles.some(n => n.id === s.id))), 800);
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
    <div className="flex flex-col items-center gap-5 relative">
      {/* ─── Outer container with vintage card feel ─── */}
      <div className="relative perspective-[1200px] select-none" onClick={toggleFlip}>
        {/* Sparkle particles */}
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute z-20 pointer-events-none text-xs animate-ping"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: '0.6s',
            }}
          >
            ✦
          </span>
        ))}

        {/* Card with 3D flip */}
        <div
          className={`
            relative
            w-56 h-56 sm:w-72 sm:h-72
            [transform-style:preserve-3d]
            cursor-pointer
            transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isFlipped ? '[transform:rotateY(180deg)]' : 'hover:scale-[1.04]'}
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
              border-[3px] border-white/25
              shadow-xl
              flex flex-col items-center justify-center
              [backface-visibility:hidden]
              overflow-hidden
            `}
          >
            {/* Pokémon image */}
            <Image
              src={frameAUrl}
              alt={card.name.zh}
              fill
              className="object-contain p-5 sm:p-6"
              unoptimized
              priority
              onError={() => {
                const pokeFallback = getPokeApiImageUrl(card.number);
                if (frameAUrl !== pokeFallback) setFrameAUrl(pokeFallback);
              }}
            />
            {/* Blend overlay — unifies image edge with card border */}
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-black/5 mix-blend-multiply" />
            {/* Lenticular ridge overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full opacity-[0.12]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(255,255,255,0.12) 1.5px, rgba(255,255,255,0.12) 3px)',
              }} />
            </div>
            {/* Name badge */}
            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1">
              <span className="text-white text-sm font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-black/30 px-4 py-1 rounded-full backdrop-blur-[1px]">
                {card.name.zh}
              </span>
              <span className="bg-black/20 text-white/60 text-[10px] px-2 py-0.5 rounded tracking-wider">
                {getFrameLabel(card, false)}
              </span>
            </div>
            {/* Corner shine */}
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/10 rotate-45 blur-sm" />
          </div>

          {/* ─── Frame B (Back) ─── */}
          <div
            className={`
              absolute inset-0 rounded-full
              bg-gradient-to-br ${gradient}
              border-[3px] border-white/30
              shadow-2xl
              flex flex-col items-center justify-center
              [backface-visibility:hidden]
              [transform:rotateY(180deg)]
              overflow-hidden
            `}
          >
            {/* Image with enhanced effects */}
            <div className="absolute inset-0">
              <Image
                src={frameBUrl}
                alt={`${card.name.zh} ${getFrameLabel(card, true)}`}
                fill
                className={`
                  object-contain p-5 sm:p-6
                  ${hasEvolutionImage ? 'scale-110' : 'scale-105'}
                  brightness-110 saturate-150 contrast-110
                `}
                unoptimized
              />
              {/* Warm color shift for same-image cards */}
              {!hasEvolutionImage && (
                <div className="absolute inset-0 mix-blend-overlay opacity-20"
                  style={{ background: 'linear-gradient(135deg, #ff8c00, #ff4500)' }} />
              )}
            </div>

            {/* Blend overlay */}
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-black/10 mix-blend-multiply" />

            {/* Holographic shimmer sweep */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full opacity-25"
                style={{
                  background: 'conic-gradient(from var(--angle, 0deg), #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0000)',
                  animation: 'lenti-spin 4s linear infinite',
                }}
              />
            </div>

            {/* Breathing glow */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div
                className="w-full h-full"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35) 0%, transparent 65%)',
                  animation: 'lenti-pulse 2.4s ease-in-out infinite',
                }}
              />
            </div>

            {/* Stronger ridges for Frame B */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="w-full h-full opacity-[0.18]" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(255,255,255,0.18) 1.5px, rgba(255,255,255,0.18) 3px)',
              }} />
            </div>

            {/* Frame B label */}
            <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1 z-10">
              <span className={`text-white text-sm font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] bg-gradient-to-r ${labelColor.from} ${labelColor.to} px-4 py-1 rounded-full shadow-lg`}>
                ✦ {getFrameLabel(card, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Status area ─── */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Toggle bar */}
        <div className="flex items-center gap-2.5 w-full max-w-[220px]">
          {/* Left label */}
          <span
            className={`text-xs font-bold tracking-wider transition-all duration-500 min-w-[4em] text-right ${
              !isFlipped ? 'text-primary opacity-100' : 'text-text-secondary/30'
            }`}
          >
            {getFrameLabel(card, false)}
          </span>

          {/* Slider */}
          <div
            className="flex-1 h-2 rounded-full overflow-hidden cursor-pointer relative bg-gradient-to-r from-gray-200/60 to-gray-300/60"
            onClick={(e) => { e.stopPropagation(); toggleFlip(); }}
          >
            <div
              className={`
                absolute inset-0 rounded-full transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                bg-gradient-to-r ${labelColor.from} ${labelColor.to}
              `}
              style={{
                width: '50%',
                marginLeft: isFlipped ? '50%' : '0%',
              }}
            />
            {/* Knob */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-primary/30 transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: isFlipped ? 'calc(75% - 7px)' : 'calc(25% - 7px)' }}
            />
          </div>

          {/* Right label */}
          <span
            className={`text-xs font-bold tracking-wider transition-all duration-500 min-w-[4em] text-left ${
              isFlipped ? 'text-primary opacity-100' : 'text-text-secondary/30'
            }`}
          >
            {getFrameLabel(card, true)}
          </span>
        </div>

        {/* Hint */}
        <p className="text-text-secondary/40 text-[10px] tracking-widest">
          点击翻转 · 滑动切换
        </p>
      </div>

      <style jsx>{`
        @keyframes lenti-spin {
          from { --angle: 0deg; }
          to { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes lenti-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
