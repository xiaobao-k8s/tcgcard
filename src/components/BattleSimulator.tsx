'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getImageUrl, getPokeApiImageUrl } from '@/lib/image-url';

interface Props { allCards: Card[] }

type RoundResult = {
  round: number; stat: string;
  leftValue: number; rightValue: number;
  leftWin: boolean; rightWin: boolean; isDraw: boolean;
};

type BattleState = 'selecting' | 'battling' | 'done';

const LOCAL = new Set([
  ...Array.from({ length: 24 }, (_, i) => 'xfd-' + String(i + 1).padStart(3, '0')),
  ...Array.from({ length: 10 }, (_, i) => 'ybd-' + String(i + 1).padStart(3, '0')),
]);

function cardImg(card: Card): string {
  if (LOCAL.has(card.id)) return getImageUrl(card.image_front);
  return getPokeApiImageUrl(card.number);
}

export default function BattleSimulator({ allCards }: Props) {
  const [leftCard, setLeftCard] = useState<Card | null>(null);
  const [rightCard, setRightCard] = useState<Card | null>(null);
  const [battleState, setBattleState] = useState<BattleState>('selecting');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [curRound, setCurRound] = useState(0);
  const [leftScore, setLeftScore] = useState(0);
  const [rightScore, setRightScore] = useState(0);
  const [isAnim, setIsAnim] = useState(false);
  const [showPicker, setShowPicker] = useState<'left' | 'right' | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  function pickRandom() {
    const picks = allCards.filter(c => c.id !== leftCard?.id);
    setRightCard(picks[Math.floor(Math.random() * picks.length)]);
    setShowPicker(null);
  }

  function genRounds() {
    if (!leftCard || !rightCard) return [];
    const hasSpd = leftCard.back.dp_speed != null && rightCard.back.dp_speed != null;
    const rs: RoundResult[] = [
      { round: 1, stat: '攻击', leftValue: leftCard.back.dp_attack, rightValue: rightCard.back.dp_attack, leftWin: leftCard.back.dp_attack > rightCard.back.dp_attack, rightWin: rightCard.back.dp_attack < rightCard.back.dp_attack, isDraw: leftCard.back.dp_attack === rightCard.back.dp_attack },
      { round: 2, stat: '防御', leftValue: leftCard.back.dp_defense, rightValue: rightCard.back.dp_defense, leftWin: leftCard.back.dp_defense > rightCard.back.dp_defense, rightWin: rightCard.back.dp_defense < rightCard.back.dp_defense, isDraw: leftCard.back.dp_defense === rightCard.back.dp_defense },
    ];
    if (hasSpd) rs.push({ round: 3, stat: '速度', leftValue: leftCard.back.dp_speed || 0, rightValue: rightCard.back.dp_speed || 0, leftWin: (leftCard.back.dp_speed || 0) > (rightCard.back.dp_speed || 0), rightWin: (leftCard.back.dp_speed || 0) < (rightCard.back.dp_speed || 0), isDraw: (leftCard.back.dp_speed || 0) === (rightCard.back.dp_speed || 0) });
    return rs;
  }

  function startBattle() {
    if (!leftCard || !rightCard) return;
    setTimeout(() => {
      const rs = genRounds();
      setRounds(rs);
      setCurRound(0); setLeftScore(0); setRightScore(0);
      setBattleState('battling');
      nextRound(rs, 0, 0, 0);
    }, 600);
  }

  function nextRound(rs: RoundResult[], idx: number, ls: number, rs_: number) {
    if (idx >= rs.length) {
      setLeftScore(ls); setRightScore(rs_);
      setBattleState('done'); return;
    }
    setIsAnim(true); setCurRound(idx);
    setTimeout(() => {
      const r = rs[idx];
      const nls = ls + (r.leftWin ? 1 : 0);
      const nrs = rs_ + (r.rightWin ? 1 : 0);
      setLeftScore(nls); setRightScore(nrs); setIsAnim(false);
      setTimeout(() => nextRound(rs, idx + 1, nls, nrs), 600);
    }, 800);
  }

  function reset() {
    setBattleState('selecting'); setRounds([]); setCurRound(0);
    setLeftScore(0); setRightScore(0);
  }

  function renderCard(card: Card | null, label: string, side: 'left' | 'right') {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-bold text-text-primary">{label}</p>
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-border overflow-hidden shadow-md">
          {card ? <Image src={cardImg(card)} alt={card.name.zh} fill className="object-contain p-2" unoptimized /> : null}
        </div>
        {card ? (
          <div className="text-center">
            <p className="text-sm font-bold text-text-primary">{card.name.zh}</p>
            <p className="text-xs text-text-secondary">ATK {card.back.dp_attack} · DEF {card.back.dp_defense}{card.back.dp_speed != null ? ' · SPD ' + card.back.dp_speed : ''}</p>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">点击下方按钮选择</p>
        )}
        <button onClick={() => setShowPicker(showPicker === side ? null : side)} className="text-xs text-primary hover:underline">
          {card ? '换一张' : '选择卡片'}
        </button>
        {side === 'right' && card ? (
          <button onClick={pickRandom} className="text-xs text-primary/70 hover:text-primary">🎲 随机对手</button>
        ) : null}
      </div>
    );
  }

  function filteredCards() {
    if (!pickerSearch) return allCards;
    const q = pickerSearch.toLowerCase();
    return allCards.filter(c => c.name.zh.includes(q) || c.name.ja.includes(q) || c.id.includes(q));
  }

  return (
    <div>
      {/* Arena */}
      <div className="bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-8 shadow-sm relative text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-primary text-white text-2xl sm:text-3xl font-black rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg border-2 border-white/30">
          VS
        </div>
        <div className="flex items-start justify-center gap-4 sm:gap-8">
          <div className="flex-1">{renderCard(leftCard, '我方', 'left')}</div>
          <div className="flex-1">{renderCard(rightCard, '对手', 'right')}</div>
        </div>
        {battleState === 'selecting' && leftCard && rightCard ? (
          <button onClick={startBattle} className="mt-6 px-8 py-3 bg-gradient-to-r from-primary to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg">
            ⚔️ 开始对战
          </button>
        ) : null}
      </div>

      {/* Card picker */}
      {showPicker ? (
        <div className="mt-4 bg-card-bg rounded-2xl border-2 border-border p-4 shadow-sm">
          <input
            type="text"
            placeholder="搜索精灵名称..."
            value={pickerSearch}
            onChange={e => setPickerSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-border mb-3 focus:outline-none focus:border-primary"
            autoFocus
          />
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
            {filteredCards().map(c => (
              <button key={c.id} onClick={() => {
                if (showPicker === 'left') setLeftCard(c);
                else setRightCard(c);
                setShowPicker(null);
                setPickerSearch('');
              }} className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-orange-50 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image src={cardImg(c)} alt={c.name.zh} fill className="object-contain p-0.5" unoptimized />
                </div>
                <span className="text-[10px] text-text-primary truncate w-full text-center">{c.name.zh}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Results */}
      {battleState !== 'selecting' ? (
        <div className="mt-6 bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className={'text-center px-4 py-2 rounded-xl ' + (leftScore > rightScore ? 'bg-primary/10 border border-primary/30' : '')}>
              <p className="text-xs text-text-secondary">我方</p>
              <p className={'text-3xl font-black ' + (leftScore > rightScore ? 'text-primary' : 'text-text-secondary')}>{leftScore}</p>
            </div>
            <div className="text-center"><p className="text-xs text-text-secondary">比分</p><p className="text-lg font-bold text-text-primary">-</p></div>
            <div className={'text-center px-4 py-2 rounded-xl ' + (rightScore > leftScore ? 'bg-blue-50 border border-blue-200' : '')}>
              <p className="text-xs text-text-secondary">对手</p>
              <p className={'text-3xl font-black ' + (rightScore > leftScore ? 'text-blue-500' : 'text-text-secondary')}>{rightScore}</p>
            </div>
          </div>
          <div className="space-y-3">
            {rounds.map((r, idx) => {
              const resolved = idx < curRound || (idx === curRound && !isAnim && battleState === 'done');
              const current = idx === curRound;
              const pending = idx > curRound;
              let bgClass = 'bg-gray-50 border border-dashed border-gray-200 opacity-50';
              if (current && isAnim) bgClass = 'bg-orange-50 border-2 border-primary/30 animate-pulse';
              else if (current && !isAnim && battleState === 'battling') bgClass = 'bg-orange-50 border-2 border-primary/30';
              else if (resolved) bgClass = 'bg-white border border-border opacity-100';
              return (
                <div key={idx} className={'rounded-xl p-3 sm:p-4 transition-all duration-500 ' + bgClass}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{r.round}</span>
                      <span className="text-sm font-bold text-text-primary">比{r.stat}</span>
                    </div>
                    {pending ? <span className="text-xs text-text-secondary">等待中...</span> : null}
                    {current && isAnim ? <span className="text-xs text-primary font-medium animate-pulse">⚡ 对决中</span> : null}
                    {resolved ? <span className={'text-xs font-bold ' + (r.isDraw ? 'text-text-secondary' : r.leftWin ? 'text-primary' : 'text-blue-500')}>{r.isDraw ? '平局' : (r.leftWin ? '我方' : '对手') + ' +1 分'}</span> : null}
                  </div>
                  {resolved ? (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-center text-sm">
                      <div><p className="text-xs text-text-secondary">我方</p><p className={'text-lg font-bold ' + (r.leftWin ? 'text-primary' : '')}>{r.leftValue}</p></div>
                      <div className="flex items-center justify-center"><span className={'text-lg ' + (r.leftWin ? 'text-primary' : r.rightWin ? 'text-blue-500' : 'text-text-secondary/40')}>{r.leftWin ? '>' : r.rightWin ? '<' : '='}</span></div>
                      <div><p className="text-xs text-text-secondary">对手</p><p className={'text-lg font-bold ' + (r.rightWin ? 'text-blue-500' : '')}>{r.rightValue}</p></div>
                    </div>
                  ) : null}
                  {current && isAnim ? (
                    <div className="grid grid-cols-3 gap-4 mt-2 text-center text-sm">
                      <div><p className="text-xs text-text-secondary">我方</p><p className="text-lg font-bold text-text-primary">{r.leftValue}</p></div>
                      <div className="flex items-center justify-center"><span className="text-2xl animate-ping">⚔️</span></div>
                      <div><p className="text-xs text-text-secondary">对手</p><p className="text-lg font-bold text-text-primary">{r.rightValue}</p></div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {battleState === 'done' ? (
            <div className="mt-6 text-center">
              <div className={'inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-bold shadow-lg ' + (leftScore > rightScore ? 'bg-primary text-white' : rightScore > leftScore ? 'bg-blue-500 text-white' : 'bg-gray-200 text-text-secondary')}>
                <span className="text-2xl">{(leftScore > rightScore || rightScore > leftScore) ? '🏆' : '🤝'}</span>
                {leftScore > rightScore ? (leftCard?.name.zh || '我方') + ' 获胜！' : rightScore > leftScore ? (rightCard?.name.zh || '对手') + ' 获胜！' : '平局！'}
              </div>
              <div className="mt-4">
                <button onClick={reset} className="px-6 py-2 bg-card-bg border-2 border-border rounded-full text-sm font-medium text-text-primary hover:border-primary/40 transition-colors">🔄 再来一局</button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
