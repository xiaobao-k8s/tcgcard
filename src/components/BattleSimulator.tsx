'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getImageUrl, getPokeApiImageUrl } from '@/lib/image-url';

interface BattleSimulatorProps {
  allCards: Card[];
}

// ─── Battle logic ─────────────────────────────────────────────────────────

type RoundResult = {
  round: number;
  stat: string;
  leftValue: number;
  rightValue: number;
  leftWin: boolean;
  rightWin: boolean;
  isDraw: boolean;
};

type BattleState = 'selecting' | 'battling' | 'done';

export default function BattleSimulator({ allCards }: BattleSimulatorProps) {
  const [leftCard, setLeftCard] = useState<Card | null>(null);
  const [rightCard, setRightCard] = useState<Card | null>(null);
  const [battleState, setBattleState] = useState<BattleState>('selecting');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Search queries for the two selectors
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');
  const [showLeftPicker, setShowLeftPicker] = useState(false);
  const [showRightPicker, setShowRightPicker] = useState(false);

  const filteredCards = useMemo(() => {
    return allCards.filter(c => {
      const term = leftSearch || rightSearch;
      if (!term) return true;
      const q = term.toLowerCase();
      return c.name.zh.toLowerCase().includes(q) ||
        c.name.ja.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
    });
  }, [allCards, leftSearch, rightSearch]);

  const hasSpeed = (card: Card) => card.back.dp_speed != null;

  function startBattle() {
    if (!leftCard || !rightCard) return;

    const hasSpd = hasSpeed(leftCard) && hasSpeed(rightCard);
    const battleRounds: RoundResult[] = [];

    // Round 1: Attack
    battleRounds.push({
      round: 1,
      stat: '攻击',
      leftValue: leftCard.back.dp_attack,
      rightValue: rightCard.back.dp_attack,
      leftWin: leftCard.back.dp_attack > rightCard.back.dp_attack,
      rightWin: rightCard.back.dp_attack > leftCard.back.dp_attack,
      isDraw: leftCard.back.dp_attack === rightCard.back.dp_attack,
    });

    // Round 2: Defense
    battleRounds.push({
      round: 2,
      stat: '防御',
      leftValue: leftCard.back.dp_defense,
      rightValue: rightCard.back.dp_defense,
      leftWin: leftCard.back.dp_defense > rightCard.back.dp_defense,
      rightWin: rightCard.back.dp_defense > leftCard.back.dp_defense,
      isDraw: leftCard.back.dp_defense === rightCard.back.dp_defense,
    });

    // Round 3: Speed (if both have it)
    if (hasSpd) {
      const lSpd = leftCard.back.dp_speed || 0;
      const rSpd = rightCard.back.dp_speed || 0;
      battleRounds.push({
        round: 3,
        stat: '速度',
        leftValue: lSpd,
        rightValue: rSpd,
        leftWin: lSpd > rSpd,
        rightWin: rSpd > lSpd,
        isDraw: lSpd === rSpd,
      });
    }

    setRounds(battleRounds);
    setCurrentRound(0);
    setLeftScore(0);
    setRightScore(0);
    setBattleState('battling');
    playNextRound(battleRounds, 0, 0, 0);
  }

  function playNextRound(rs: RoundResult[], idx: number, lScore: number, rScore: number) {
    if (idx >= rs.length) {
      setLeftScore(lScore);
      setRightScore(rScore);
      setBattleState('done');
      return;
    }

    setIsAnimating(true);
    setCurrentRound(idx);

    setTimeout(() => {
      const r = rs[idx];
      const newL = lScore + (r.leftWin ? 1 : 0);
      const newR = rScore + (r.rightWin ? 1 : 0);
      setLeftScore(newL);
      setRightScore(newR);
      setIsAnimating(false);

      // Show each round for 1.2s before next
      setTimeout(() => {
        playNextRound(rs, idx + 1, newL, newR);
      }, 600);
    }, 800);
  }

  function resetBattle() {
    setBattleState('selecting');
    setRounds([]);
    setCurrentRound(0);
    setLeftScore(0);
    setRightScore(0);
  }

  function getCardImage(card: Card): string {
    const LOCAL = new Set([
      ...Array.from({ length: 24 }, (_, i) => `xfd-${String(i + 1).padStart(3, '0')}`),
      ...Array.from({ length: 10 }, (_, i) => `ybd-${String(i + 1).padStart(3, '0')}`),
    ]);
    if (LOCAL.has(card.id)) return getImageUrl(card.image_front);
    return getPokeApiImageUrl(card.number);
  }

  // ─── Card Picker ──────────────────────────────────────────────────────

  function CardPicker({ label, card, onSelect, search, onSearchChange, show, onToggle }: {
    label: string; card: Card | null; onSelect: (c: Card) => void;
    search: string; onSearchChange: (s: string) => void;
    show: boolean; onToggle: () => void;
  }) {
    return (
      <div className="flex-1 flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-text-primary">{label}</p>

        {/* Selected card display */}
        {card ? (
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-border overflow-hidden shadow-md">
            <Image src={getCardImage(card)} alt={card.name.zh} fill className="object-contain p-2" unoptimized />
          </div>
        ) : (
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-100 border-2 border-dashed border-border flex items-center justify-center text-text-secondary text-sm">
            点击选择
          </div>
        )}

        {card && (
          <div className="text-center">
            <p className="text-sm font-bold text-text-primary">{card.name.zh}</p>
            <p className="text-xs text-text-secondary">
              ATK {card.back.dp_attack} · DEF {card.back.dp_defense}
              {card.back.dp_speed != null ? ` · SPD ${card.back.dp_speed}` : ''}
            </p>
          </div>
        )}

        <button onClick={onToggle} className="text-xs text-primary hover:underline">
          {show ? '收起' : (card ? '换一张' : '选择卡片')}
        </button>

        {/* Card picker dropdown */}
        {show && (
          <div className="absolute top-full mt-2 z-30 w-72 bg-white rounded-2xl border-2 border-border shadow-xl p-3 max-h-80 overflow-y-auto">
            <input
              type="text"
              placeholder="搜索精灵名称..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm border border-border mb-2 focus:outline-none focus:border-primary"
              autoFocus
            />
            <div className="grid grid-cols-4 gap-2">
              {filteredCards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); onToggle(); }}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                    <Image src={getCardImage(c)} alt={c.name.zh} fill className="object-contain p-0.5" unoptimized />
                  </div>
                  <span className="text-[10px] text-text-primary truncate w-full text-center leading-tight">{c.name.zh}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* VS Arena */}
      <div className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-8 shadow-sm relative">
        {/* VS badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-primary text-white text-2xl sm:text-3xl font-black rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg border-2 border-white/30">
          VS
        </div>

        <div className="flex items-start justify-center gap-4 sm:gap-8 relative">
          {/* Position the pickers relatively for dropdown positioning */}
          <div className="relative flex-1 flex justify-center">
            <CardPicker
              label="我方"
              card={leftCard}
              onSelect={setLeftCard}
              search={leftSearch}
              onSearchChange={setLeftSearch}
              show={showLeftPicker}
              onToggle={() => { setShowLeftPicker(v => !v); setShowRightPicker(false); }}
            />
          </div>
          <div className="relative flex-1 flex justify-center">
            <CardPicker
              label="对手"
              card={rightCard}
              onSelect={setRightCard}
              search={rightSearch}
              onSearchChange={setRightSearch}
              show={showRightPicker}
              onToggle={() => { setShowRightPicker(v => !v); setShowLeftPicker(false); }}
            />
          </div>
        </div>

        {/* Battle button */}
        {battleState === 'selecting' && leftCard && rightCard && (
          <div className="text-center mt-6">
            <button
              onClick={startBattle}
              className="px-8 py-3 bg-gradient-to-r from-primary to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg"
            >
              ⚔️ 开始对战
            </button>
          </div>
        )}
      </div>

      {/* Battle results area */}
      {(battleState === 'battling' || battleState === 'done') && (
        <div className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-6 shadow-sm">
          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className={`text-center px-4 py-2 rounded-xl ${leftScore > rightScore ? 'bg-primary/10 border border-primary/30' : ''}`}>
              <p className="text-xs text-text-secondary">我方</p>
              <p className={`text-3xl font-black ${leftScore > rightScore ? 'text-primary' : 'text-text-secondary'}`}>{leftScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-secondary">比分</p>
              <p className="text-lg font-bold text-text-primary">-</p>
            </div>
            <div className={`text-center px-4 py-2 rounded-xl ${rightScore > leftScore ? 'bg-blue-50 border border-blue-200' : ''}`}>
              <p className="text-xs text-text-secondary">对手</p>
              <p className={`text-3xl font-black ${rightScore > leftScore ? 'text-blue-500' : 'text-text-secondary'}`}>{rightScore}</p>
            </div>
          </div>

          {/* Round results */}
          <div className="space-y-3">
            {rounds.map((r, idx) => {
              const isResolved = idx < currentRound || (idx === currentRound && !isAnimating && battleState === 'done');
              const isCurrent = idx === currentRound;
              const isPending = idx > currentRound;

              return (
                <div
                  key={idx}
                  className={`
                    rounded-xl p-3 sm:p-4 transition-all duration-500
                    ${isResolved ? 'bg-white border border-border opacity-100' : ''}
                    ${isCurrent && isAnimating ? 'bg-orange-50 border-2 border-primary/30 animate-pulse' : ''}
                    ${isCurrent && !isAnimating && battleState === 'battling' ? 'bg-orange-50 border-2 border-primary/30' : ''}
                    ${isPending ? 'bg-gray-50 border border-dashed border-gray-200 opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {r.round}
                      </span>
                      <span className="text-sm font-bold text-text-primary">比{r.stat}</span>
                    </div>

                    {isPending && <span className="text-xs text-text-secondary">等待中...</span>}
                    {isCurrent && isAnimating && <span className="text-xs text-primary font-medium animate-pulse">⚡ 对决中</span>}
                    {isCurrent && !isAnimating && battleState === 'battling' && <span className="text-xs text-primary font-medium">揭示结果</span>}
                    {isResolved && (
                      <span className={`text-xs font-bold ${r.isDraw ? 'text-text-secondary' : r.leftWin ? 'text-primary' : 'text-blue-500'}`}>
                        {r.isDraw ? '平局' : `${r.leftWin ? '我方' : '对手'} +1 分`}
                      </span>
                    )}
                  </div>

                  {isResolved && (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-center text-sm">
                      <div>
                        <p className="text-xs text-text-secondary">我方</p>
                        <p className={`text-lg font-bold ${r.leftWin ? 'text-primary' : r.isDraw ? '' : 'text-text-secondary/60'}`}>
                          {r.leftValue}
                        </p>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className={`text-lg ${r.leftWin ? 'text-primary' : r.rightWin ? 'text-blue-500' : 'text-text-secondary/40'}`}>
                          {r.leftWin ? '>' : r.rightWin ? '<' : '='}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">对手</p>
                        <p className={`text-lg font-bold ${r.rightWin ? 'text-blue-500' : r.isDraw ? '' : 'text-text-secondary/60'}`}>
                          {r.rightValue}
                        </p>
                      </div>
                    </div>
                  )}

                  {isCurrent && isAnimating && (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-center text-sm">
                      <div><p className="text-xs text-text-secondary">我方</p><p className="text-lg font-bold text-text-primary">{r.leftValue}</p></div>
                      <div className="flex items-center justify-center"><span className="text-2xl animate-ping">⚔️</span></div>
                      <div><p className="text-xs text-text-secondary">对手</p><p className="text-lg font-bold text-text-primary">{r.rightValue}</p></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Winner announcement */}
          {battleState === 'done' && (
            <div className="mt-6 text-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold shadow-lg ${leftScore > rightScore ? 'bg-primary text-white' : rightScore > leftScore ? 'bg-blue-500 text-white' : 'bg-gray-200 text-text-secondary'}`}>
                <span>{leftScore > rightScore ? '🏆' : rightScore > leftScore ? '🏆' : '🤝'}</span>
                {leftScore > rightScore
                  ? `${leftCard?.name.zh || '我方'} 获胜！`
                  : rightScore > leftScore
                    ? `${rightCard?.name.zh || '对手'} 获胜！`
                    : '平局！'
                }
              </div>
              <div className="mt-4">
                <button onClick={resetBattle} className="px-6 py-2 bg-card-bg border-2 border-border rounded-full text-sm font-medium text-text-primary hover:border-primary/40 transition-colors">
                  🔄 再来一局
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
