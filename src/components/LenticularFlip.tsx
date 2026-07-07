'use client';

import type { Card } from '@/lib/types';
import { getAttributeEmoji } from '@/lib/attribute-emoji';

interface LenticularFlipProps {
  card: Card;
}

/**
 * Map attribute to gradient background colors for the card face.
 */
function getGradient(attribute: string): string {
  const base: Record<string, string> = {
    '火': 'from-orange-400 to-red-500',
    '草': 'from-green-400 to-emerald-500',
    '水': 'from-blue-400 to-cyan-500',
    '雷': 'from-yellow-400 to-amber-500',
    '超能力': 'from-pink-400 to-purple-500',
    '格斗': 'from-amber-400 to-orange-500',
    '毒': 'from-purple-400 to-fuchsia-500',
    '地面': 'from-yellow-500 to-amber-600',
    '岩石': 'from-stone-400 to-stone-500',
    '虫': 'from-lime-400 to-green-500',
    '幽灵': 'from-indigo-400 to-purple-500',
    '钢': 'from-gray-400 to-slate-500',
    '飞行': 'from-sky-400 to-blue-400',
    '冰': 'from-cyan-400 to-blue-400',
    '龙': 'from-violet-500 to-purple-600',
  };
  return base[attribute] ?? 'from-orange-300 to-yellow-400';
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
  const gradient = getGradient(card.attribute);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D lenticular card container */}
      <div className="perspective-[1000px]">
        <div
          className="
            group relative
            w-56 h-56 sm:w-72 sm:h-72
            [transform-style:preserve-3d]
            [transition:transform_0.6s_cubic-bezier(0.4,0,0.2,1)]
            hover:[transform:rotateY(180deg)]
            cursor-pointer
          "
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
            `}
          >
            <span className="text-6xl sm:text-7xl" role="img" aria-label={card.attribute}>
              {getAttributeEmoji(card.attribute)}
            </span>
            <span className="mt-2 text-white/90 text-sm font-medium drop-shadow">
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
              brightness-110
            `}
          >
            <span className="text-6xl sm:text-7xl" role="img" aria-label={card.attribute}>
              {getAttributeEmoji(card.attribute)}
            </span>
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
        悬停查看光栅翻转效果
      </p>
    </div>
  );
}
