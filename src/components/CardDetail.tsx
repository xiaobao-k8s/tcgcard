import type { Card } from '@/lib/types';
import LenticularFlip from './LenticularFlip';
import EvolutionChain from './EvolutionChain';
import RarityBadge from './RarityBadge';
import CardNavBar from './CardNavBar';

interface CardDetailProps {
  card: Card;
  evolutionChain: Card[];
  prevCard: Card | null;
  nextCard: Card | null;
  currentIndex: number;
  totalCards: number;
}

export default function CardDetail({ card, evolutionChain, prevCard, nextCard, currentIndex, totalCards }: CardDetailProps) {
  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <CardNavBar
        prevCard={prevCard}
        nextCard={nextCard}
        currentIndex={currentIndex}
        totalCards={totalCards}
      />

      {/* Two-column layout: flip card (left) + data panels (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left column: lenticular flip + evolution chain + rarity */}
        <div className="lg:col-span-2 flex flex-col items-center gap-4">
          {/* Card flip */}
          <div className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-6 shadow-sm w-full max-w-sm">
            <LenticularFlip card={card} evolutionChain={evolutionChain} />
          </div>

          {/* Evolution chain */}
          {evolutionChain.length > 1 && (
            <div className="bg-card-bg rounded-2xl border-2 border-border p-4 shadow-sm w-full max-w-sm">
              <EvolutionChain chain={evolutionChain} currentCardId={card.id} />
            </div>
          )}

          {/* Rarity badge */}
          <div className="bg-card-bg rounded-2xl border-2 border-border p-4 shadow-sm w-full max-w-sm">
            <RarityBadge rarity={card.rarity} showDescription showTradeInfo />
          </div>
        </div>

        {/* Right column: all data panels */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card identity panel */}
          <DataPanel title="📋 卡片信息">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataItem label="编号" value={card.number} />
              <DataItem label="属性" value={card.attribute} />
              <DataItem label="代际" value={card.generation === 1 ? '第一代 · 旋风卡' : '第二代 · 比斗卡'} />
              <DataItem label="形态" value={
                card.evolution_stage === 1 ? '基础形态' :
                card.evolution_stage === 2 ? '中级形态' : '最终形态'
              } />
            </div>
          </DataPanel>

          {/* Physical stats */}
          <DataPanel title="📏 体型数据">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DataItem label="身高" value={card.back.height} />
              <DataItem label="体重" value={card.back.weight} />
              <DataItem label="技能" value={card.back.skill} />
              <DataItem label="效果类型" value={
                card.effect_type === 'evolution' ? '进化对比' :
                card.effect_type === 'triple' ? '三段变化' : '攻击切换'
              } />
            </div>
          </DataPanel>

          {/* DP stats — the core battle data */}
          <DataPanel title="⚔️ DP 对战数值">
            <div className="grid grid-cols-3 gap-4">
              <DPGauge label="攻击" value={card.back.dp_attack} color="text-red-500" bar="bg-red-500" max={160} />
              <DPGauge label="防御" value={card.back.dp_defense} color="text-blue-500" bar="bg-blue-500" max={160} />
              {card.back.dp_speed !== undefined && card.back.dp_speed !== null ? (
                <DPGauge label="速度" value={card.back.dp_speed} color="text-green-500" bar="bg-green-500" max={160} />
              ) : (
                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center">
                  <span className="text-xs text-text-secondary">速度</span>
                  <span className="text-lg font-bold text-text-secondary/40">—</span>
                  <span className="text-[10px] text-text-secondary/60">一代无</span>
                </div>
              )}
            </div>
            {/* Total DP */}
            <div className="mt-3 pt-3 border-t border-border text-center">
              <span className="text-xs text-text-secondary">
                DP 总值：{card.back.dp_attack + card.back.dp_defense + (card.back.dp_speed || 0)}
              </span>
            </div>
          </DataPanel>

          {/* Description */}
          <DataPanel title="📖 图鉴描述">
            <blockquote className="text-sm text-text-secondary italic border-l-4 border-primary/30 pl-4 leading-relaxed">
              &ldquo;{card.back.description}&rdquo;
            </blockquote>
          </DataPanel>

          {/* Source */}
          <div className="text-right">
            <span className="text-[10px] text-text-secondary/50">
              数据来源：{card.source || '未标注'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function DataPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-5 shadow-sm">
      <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
        <span className="text-base">{title}</span>
      </h3>
      {children}
    </div>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-warm rounded-xl p-3 text-center">
      <p className="text-[10px] text-text-secondary mb-1">{label}</p>
      <p className="text-sm font-bold text-text-primary truncate">{value}</p>
    </div>
  );
}

function DPGauge({ label, value, color, bar, max }: {
  label: string;
  value: number;
  color: string;
  bar: string;
  max: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const bgMap: Record<string, string> = {
    'text-red-500': 'bg-red-50',
    'text-blue-500': 'bg-blue-50',
    'text-green-500': 'bg-green-50',
  };
  const bgClass = bgMap[color] || 'bg-gray-50';
  return (
    <div className={`${bgClass} rounded-xl p-3 flex flex-col items-center`}>
      <span className={`text-xs font-semibold ${color} mb-1`}>{label}</span>
      <span className={`text-2xl sm:text-3xl font-black ${color} tabular-nums`}>{value}</span>
      <div className="w-full h-1.5 bg-white/60 rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
