import { getCardsByRarity, RARITY_ORDER } from '@/lib/cards';
import type { Card, Rarity } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import RarityBadge from '@/components/RarityBadge';
import { getAttributeGradient } from '@/lib/attribute-gradient';

/**
 * Get PokeAPI official artwork URL for a Pokémon
 */
function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}

const RARITY_SECTION_LABELS: Record<Rarity, string> = {
  legendary: '传说级',
  'ultra-rare': '极稀有',
  rare: '稀有',
  common: '普通',
};

export default function RarityPage() {
  const grouped = getCardsByRarity();

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-6 px-4 shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-2 opacity-80">
            <Link href="/" className="hover:underline hover:opacity-100 transition-opacity">
              图鉴
            </Link>
            <span className="opacity-50">/</span>
            <span className="font-medium">稀有度榜单</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">稀有度排行榜</h1>
          <p className="text-sm text-white/70 mt-1">从传说级到普通，重温当年的交换行情</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-12">
        {RARITY_ORDER.map((rarity) => {
          const cards = grouped[rarity];
          if (cards.length === 0) return null;

          return (
            <RaritySection key={rarity} rarity={rarity} cards={cards} />
          );
        })}
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>童年神奇卡片百科 &copy; 2026 &middot; 稀有度榜单</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function RaritySection({ rarity, cards }: { rarity: Rarity; cards: Card[] }) {
  const isLegendary = rarity === 'legendary';

  return (
    <section>
      {/* Section header with badge */}
      <div className={`flex items-center gap-4 mb-6 ${isLegendary ? 'flex-col sm:flex-row' : ''}`}>
        <RarityBadge rarity={rarity} showDescription />
        <div className="flex-1">
          <h2 className={`text-xl font-bold ${
            rarity === 'legendary' ? 'text-legendary-glow' :
            rarity === 'ultra-rare' ? 'text-rare-glow' :
            rarity === 'rare' ? 'text-primary' :
            'text-text-primary'
          }`}>
            {RARITY_SECTION_LABELS[rarity]}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            共 {cards.length} {isLegendary ? '只传说精灵' : '张卡片'}
          </p>
        </div>
      </div>

      {/* Cards grid — legendary gets large display */}
      {isLegendary ? (
        <LegendaryGrid cards={cards} />
      ) : (
        <CardGrid cards={cards} rarity={rarity} />
      )}

      {/* Trade info footnote */}
      <div className="mt-4 p-3 bg-card-bg rounded-xl border border-border">
        <TradeInfo rarity={rarity} />
      </div>
    </section>
  );
}

function LegendaryGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <LegendaryCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function LegendaryCard({ card }: { card: Card }) {
  return (
    <Link
      href={`/${card.id}`}
      className="group relative bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl border-2 border-legendary-glow/30 p-6 shadow-[0_0_20px_6px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_8px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Large emoji circle */}
      <div className="flex justify-center mb-4">
        <div
          className={`
            w-32 h-32 sm:w-40 sm:h-40
            rounded-full
            bg-gradient-to-br ${getAttributeGradient(card.attribute, 'medium')}
            border-4 border-legendary-glow/60
            flex items-center justify-center
            shadow-[0_0_24px_8px_rgba(139,92,246,0.4)]
            group-hover:shadow-[0_0_32px_12px_rgba(139,92,246,0.5)]
            transition-all duration-300
          `}
        >
          <Image
            src={getPokeApiImageUrl(card.number)}
            alt={card.name.zh}
            width={128}
            height={128}
            className="object-contain p-4"
            unoptimized
          />
        </div>
      </div>

      {/* Card info */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-text-primary group-hover:text-legendary-glow transition-colors">
          {card.name.zh}
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          {card.name.ja} &middot; #{card.number}
        </p>
        <div className="mt-3 flex justify-center gap-2 text-xs text-text-secondary">
          <span className="px-2 py-1 bg-border rounded-full">
            ATK {card.back.dp_attack}
          </span>
          <span className="px-2 py-1 bg-border rounded-full">
            DEF {card.back.dp_defense}
          </span>
          {card.back.dp_speed && (
            <span className="px-2 py-1 bg-border rounded-full">
              SPD {card.back.dp_speed}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CardGrid({ cards, rarity }: { cards: Card[]; rarity: Rarity }) {
  const sizeClass =
    rarity === 'ultra-rare'
      ? 'w-20 h-20 text-3xl'
      : rarity === 'rare'
        ? 'w-16 h-16 text-2xl'
        : 'w-16 h-16 text-2xl';

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/${card.id}`}
          className="group flex flex-col items-center gap-2 transition-transform duration-200 hover:scale-105"
        >
          <div
            className={`
              ${sizeClass}
              rounded-full
              bg-gradient-to-br ${getAttributeGradient(card.attribute, 'medium')}
              border-2
              flex items-center justify-center
              ${
                rarity === 'ultra-rare'
                  ? 'border-rare-glow/50 shadow-[0_0_14px_4px_rgba(239,68,68,0.25)]'
                  : rarity === 'rare'
                    ? 'border-primary/40 shadow-[0_0_10px_3px_rgba(249,115,22,0.2)]'
                    : 'border-border shadow-sm'
              }
            `}
          >
            <Image
              src={getPokeApiImageUrl(card.number)}
              alt={card.name.zh}
              width={rarity === 'ultra-rare' ? 80 : 64}
              height={rarity === 'ultra-rare' ? 80 : 64}
              className="object-contain p-2"
              unoptimized
            />
          </div>
          <span className="text-xs font-medium text-text-secondary group-hover:text-primary transition-colors truncate max-w-20 text-center">
            {card.name.zh}
          </span>
        </Link>
      ))}
    </div>
  );
}

function TradeInfo({ rarity }: { rarity: Rarity }) {
  const tradeInfo: Record<Rarity, { emoji: string; text: string; context: string }> = {
    legendary: {
      emoji: '👑',
      text: '1 张快龙 ≈ 20 张普通卡，全校最靓的仔',
      context: '传说级精灵几乎没人舍得交换，拥有者就是全班焦点。',
    },
    'ultra-rare': {
      emoji: '💎',
      text: '1 张极稀有 ≈ 5-10 张普通卡',
      context: '课间交换的硬通货，谁有一张能换一堆普通卡。',
    },
    rare: {
      emoji: '🔥',
      text: '能换 2-3 张普通卡',
      context: '偶尔抽到，交换时比较抢手，但不算特别稀缺。',
    },
    common: {
      emoji: '📦',
      text: '没什么交换价值，大家都不太稀罕',
      context: '每包基本都有一张，重复率极高，经常拿来拍卡玩。',
    },
  };

  const info = tradeInfo[rarity];

  return (
    <div className="text-sm text-text-secondary">
      <p className="font-medium text-text-primary mb-1">
        <span className="mr-1">{info.emoji}</span>
        当年交换行情
      </p>
      <p className="mb-1">{info.text}</p>
      <p className="text-xs text-text-secondary/70">{info.context}</p>
    </div>
  );
}
