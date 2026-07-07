import { getEvolutionChainsGrouped, getAttributes } from '@/lib/cards';
import Image from 'next/image';
import Link from 'next/link';
import { getAttributeEmoji } from '@/lib/attribute-emoji';
import { getAttributeGradient } from '@/lib/attribute-gradient';

/**
 * Get PokeAPI official artwork URL for a Pokémon
 */
function getPokeApiImageUrl(number: string): string {
  const dexNum = parseInt(number, 10);
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${dexNum}.png`;
}

export default function EvolutionPage() {
  const groupedChains = getEvolutionChainsGrouped();
  const allAttributes = getAttributes();

  // Sort group keys for consistent ordering: gen1 first, then gen2, within each gen sort by attribute
  const sortedKeys = Object.keys(groupedChains).sort((a, b) => {
    const [genA, attrA] = a.split('-');
    const [genB, attrB] = b.split('-');
    if (genA !== genB) return genA.localeCompare(genB);
    const idxA = allAttributes.indexOf(attrA);
    const idxB = allAttributes.indexOf(attrB);
    return idxA - idxB;
  });

  const generationLabel: Record<string, string> = {
    gen1: '一代 · 旋风卡',
    gen2: '二代 · 比斗卡',
  };

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
            <span className="font-medium">进化链</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">精灵进化链</h1>
          <p className="text-sm text-white/70 mt-1">按进化关系分组，点击精灵查看详情</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {sortedKeys.length === 0 ? (
          <div className="text-center py-20 text-text-secondary">
            <p className="text-lg">暂无进化链数据</p>
            <p className="text-sm mt-2">添加包含进化关系的卡片后即可展示</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedKeys.map((key) => {
              const [gen, attr] = key.split('-');
              const chains = groupedChains[key];
              return (
                <EvolutionGroup
                  key={key}
                  attribute={attr}
                  chains={chains}
                  genLabel={generationLabel[gen] || gen}
                />
              );
            })}
          </div>
        )}
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>童年神奇卡片百科 &copy; 2026 &middot; 进化链图鉴</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

import type { Card } from '@/lib/types';

function EvolutionGroup({
  attribute,
  chains,
  genLabel,
}: {
  attribute: string;
  chains: Card[][];
  genLabel: string;
}) {
  return (
    <section className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-6">
      {/* Group header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
        <span className="text-2xl" role="img" aria-label={attribute}>
          {getAttributeEmoji(attribute)}
        </span>
        <h2 className="text-lg font-bold text-text-primary">
          {genLabel}
          <span className="text-text-secondary font-normal text-base ml-2">
            &middot; {attribute}属性
          </span>
        </h2>
        <span className="ml-auto text-xs text-text-secondary bg-border px-2 py-1 rounded-full">
          {chains.length} 条进化链
        </span>
      </div>

      {/* Chains list */}
      <div className="space-y-6">
        {chains.map((chain, idx) => (
          <EvolutionLine key={idx} chain={chain} />
        ))}
      </div>
    </section>
  );
}

function EvolutionLine({ chain }: { chain: Card[] }) {
  if (chain.length <= 1) {
    // Single card (no evolution) — show as a standalone node
    const card = chain[0];
    return (
      <div className="flex items-center gap-3 py-2">
        <Link
          href={`/${card.id}`}
          className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105"
        >
          <div
            className={`
              w-16 h-16 sm:w-20 sm:h-20
              rounded-full
              bg-gradient-to-br ${getAttributeGradient(card.attribute, 'medium')}
              border-2 border-border
              flex items-center justify-center
              shadow-md group-hover:shadow-lg
              overflow-hidden relative
            `}
          >
            <Image
              src={getPokeApiImageUrl(card.number)}
              alt={card.name.zh}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">
              {card.name.zh}
            </p>
            <p className="text-xs text-text-secondary">#{card.number}</p>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center flex-wrap justify-start gap-1">
        {chain.map((card, index) => (
          <div key={card.id} className="flex items-center gap-1">
            {/* Evolution arrow between cards */}
            {index > 0 && (
              <span
                className="text-primary text-lg sm:text-xl select-none px-1"
                aria-hidden="true"
              >
                &#8594;
              </span>
            )}

            {/* Card node */}
            <Link
              href={`/${card.id}`}
              className="flex flex-col items-center gap-1 group transition-transform duration-200 hover:scale-110"
              title={`${card.name.zh} · ${card.rarity === 'legendary' ? '传说级' : card.rarity === 'ultra-rare' ? '极稀有' : card.rarity === 'rare' ? '稀有' : '普通'}`}
            >
              <div
                className={`
                  w-16 h-16 sm:w-20 sm:h-20
                  rounded-full
                  bg-gradient-to-br ${getAttributeGradient(card.attribute, 'medium')}
                  border-2
                  flex items-center justify-center
                  transition-all duration-200
                  overflow-hidden relative
                  ${
                    card.rarity === 'legendary'
                      ? 'border-legendary-glow/60 shadow-[0_0_16px_4px_rgba(139,92,246,0.3)]'
                      : card.rarity === 'ultra-rare'
                        ? 'border-rare-glow/50 shadow-[0_0_12px_3px_rgba(239,68,68,0.25)]'
                        : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Image
                  src={getPokeApiImageUrl(card.number)}
                  alt={card.name.zh}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <span className="text-xs font-medium text-text-secondary group-hover:text-primary transition-colors truncate max-w-16 sm:max-w-20 text-center">
                {card.name.zh}
              </span>
              <span className="text-[10px] text-text-secondary/60">
                {card.evolution_stage ? `阶段${card.evolution_stage}` : ''}
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
