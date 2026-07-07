import type { Rarity } from '@/lib/types';

interface RarityBadgeProps {
  rarity: Rarity;
  showDescription?: boolean;
  showTradeInfo?: boolean;
}

/**
 * Rarity tier metadata — labels, stars, descriptions, trade info.
 */
interface RarityTierInfo {
  label: string;
  stars: number;
  description: string;
  tradeInfo: string;
  colorClasses: string;
  bgClasses: string;
  glowClasses: string;
}

const RARITY_INFO: Record<Rarity, RarityTierInfo> = {
  common: {
    label: '普通',
    stars: 1,
    description: '每包基本都有一张，重复率极高',
    tradeInfo: '没什么交换价值，大家都不太稀罕',
    colorClasses: 'text-gray-600',
    bgClasses: 'bg-gray-100 border-gray-200',
    glowClasses: '',
  },
  rare: {
    label: '稀有',
    stars: 3,
    description: '偶尔能抽到，交换时比较抢手',
    tradeInfo: '能换 2-3 张普通卡',
    colorClasses: 'text-primary',
    bgClasses: 'bg-orange-50 border-primary/30',
    glowClasses: 'shadow-[0_0_8px_2px_rgba(249,115,22,0.2)]',
  },
  'ultra-rare': {
    label: '极稀有',
    stars: 4,
    description: '能换 5-10 张普通卡',
    tradeInfo: '1 张极稀有 ≈ 5-10 张普通卡',
    colorClasses: 'text-rare-glow',
    bgClasses: 'bg-red-50 border-rare-glow/30',
    glowClasses: 'shadow-[0_0_14px_4px_rgba(239,68,68,0.3)]',
  },
  legendary: {
    label: '传说级',
    stars: 5,
    description: '当年几十包未必出一张，全校没几个人有',
    tradeInfo: '1 张快龙 ≈ 20 张普通卡，全校最靓的仔',
    colorClasses: 'text-legendary-glow',
    bgClasses: 'bg-purple-50 border-legendary-glow/30',
    glowClasses: 'shadow-[0_0_20px_6px_rgba(139,92,246,0.4)]',
  },
};

export default function RarityBadge({
  rarity,
  showDescription = false,
  showTradeInfo = false,
}: RarityBadgeProps) {
  const info = RARITY_INFO[rarity];
  const starDisplay = '★'.repeat(info.stars) + '☆'.repeat(5 - info.stars);

  return (
    <div
      className={`
        inline-flex flex-col items-center gap-1
        px-4 py-3 rounded-2xl
        border-2 ${info.bgClasses}
        ${info.glowClasses}
        transition-all duration-200
      `}
    >
      {/* Stars */}
      <span className={`text-lg tracking-wider ${info.colorClasses}`} aria-label={`${info.stars} 星稀有度`}>
        {starDisplay}
      </span>

      {/* Label */}
      <span className={`text-sm font-bold ${info.colorClasses}`}>
        {info.label}
      </span>

      {/* Description */}
      {showDescription && (
        <p className="text-xs text-text-secondary text-center max-w-48">
          {info.description}
        </p>
      )}

      {/* Trade info */}
      {showTradeInfo && (
        <div className="mt-1 px-3 py-1.5 bg-card-bg rounded-full border border-border">
          <p className="text-xs text-text-secondary text-center">
            💰 {info.tradeInfo}
          </p>
        </div>
      )}
    </div>
  );
}
