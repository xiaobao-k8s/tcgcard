import type { Card } from '@/lib/types';
import LenticularFlip from './LenticularFlip';
import EvolutionChain from './EvolutionChain';
import RarityBadge from './RarityBadge';

interface CardDetailProps {
  card: Card;
  /** The full evolution chain for this card (ordered from base to final). */
  evolutionChain: Card[];
}

export default function CardDetail({ card, evolutionChain }: CardDetailProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Lenticular flip card — center */}
      <LenticularFlip card={card} evolutionChain={evolutionChain} />

      {/* Evolution chain navigation */}
      {evolutionChain.length > 1 && (
        <EvolutionChain chain={evolutionChain} currentCardId={card.id} />
      )}

      {/* Back data panel */}
      <div className="w-full max-w-lg bg-card-bg rounded-2xl border-2 border-border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm">
            📊
          </span>
          卡片背面数据
        </h2>

        {/* Name, number, attribute row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <DataCell label="编号" value={card.number} />
          <DataCell label="属性" value={`${card.attribute}`} />
          <DataCell label="代际" value={card.generation === 1 ? '第一代' : '第二代'} />
        </div>

        {/* Physical stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <DataCell label="身高" value={card.back.height} />
          <DataCell label="体重" value={card.back.weight} />
        </div>

        {/* DP stats */}
        <div className="bg-bg-warm rounded-xl p-4 mb-4">
          <h3 className="text-xs font-medium text-text-secondary mb-3">DP 数值</h3>
          <div className="grid grid-cols-3 gap-4">
            <DPStat label="攻击" value={card.back.dp_attack} icon="⚔️" />
            <DPStat label="防御" value={card.back.dp_defense} icon="🛡️" />
            {card.back.dp_speed !== undefined ? (
              <DPStat label="速度" value={card.back.dp_speed} icon="💨" />
            ) : (
              <DPStat label="速度" value="—" icon="💨" muted />
            )}
          </div>
        </div>

        {/* Skill */}
        <div className="flex items-center gap-3 mb-4 px-3 py-2 bg-bg-warm rounded-xl">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-xs text-text-secondary">经典技能</p>
            <p className="text-sm font-medium text-text-primary">{card.back.skill}</p>
          </div>
        </div>

        {/* Description */}
        <blockquote className="text-sm text-text-secondary italic border-l-2 border-primary/30 pl-4">
          &ldquo;{card.back.description}&rdquo;
        </blockquote>
      </div>

      {/* Rarity info panel */}
      <div className="flex flex-col items-center gap-3">
        <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm">
            💎
          </span>
          稀有度信息
        </h2>
        <RarityBadge rarity={card.rarity} showDescription showTradeInfo />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-medium text-text-primary mt-0.5">{value}</p>
    </div>
  );
}

function DPStat({
  label,
  value,
  icon,
  muted = false,
}: {
  label: string;
  value: number | string;
  icon: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-lg">{icon}</span>
      <span className={`text-xl font-bold ${muted ? 'text-text-secondary/40' : 'text-primary'}`}>
        {value}
      </span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
