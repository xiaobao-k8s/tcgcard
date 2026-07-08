'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Card } from '@/lib/types';
import { getImageUrl, getPokeApiImageUrl } from '@/lib/image-url';

interface Props { allCards: Card[] }

interface RoundResult {
  round: number; stat: string;
  leftValue: number; rightValue: number;
  leftWin: boolean; rightWin: boolean; isDraw: boolean;
}

type Phase = 'selecting' | 'battling' | 'done';

const LOCAL = new Set([
  ...Array.from({ length: 56 }, (_, i) => `xfd-${String(i + 1).padStart(3, "0")}`),
  ...Array.from({ length: 10 }, (_, i) => 'ybd-' + String(i + 1).padStart(3, '0')),
]);

function imgUrl(card: Card): string {
  if (LOCAL.has(card.id)) return getImageUrl(card.image_front);
  return getPokeApiImageUrl(card.number);
}

export default function BattleSimulator({ allCards }: Props) {
  const [left, setLeft] = useState<Card | null>(null);
  const [right, setRight] = useState<Card | null>(null);
  const [phase, setPhase] = useState<Phase>('selecting');
  const [rounds, setRounds] = useState<RoundResult[]>([]);
  const [cur, setCur] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lScore, setLScore] = useState(0);
  const [rScore, setRScore] = useState(0);
  const [showPicker, setShowPicker] = useState<'left' | 'right' | null>(null);
  const [search, setSearch] = useState('');

  function pickRandom() {
    const candidates = allCards.filter(c => c.id !== left?.id);
    setRight(candidates[Math.floor(Math.random() * candidates.length)]);
    setShowPicker(null);
  }

  function buildRounds() {
    if (!left || !right) return [];
    const spd = left.back.dp_speed != null && right.back.dp_speed != null;
    const rs: RoundResult[] = [];
    rs.push({
      round: 1, stat: '⚔️ 攻击',
      leftValue: left.back.dp_attack, rightValue: right.back.dp_attack,
      leftWin: left.back.dp_attack > right.back.dp_attack,
      rightWin: right.back.dp_attack < right.back.dp_attack,
      isDraw: left.back.dp_attack === right.back.dp_attack,
    });
    rs.push({
      round: 2, stat: '🛡️ 防御',
      leftValue: left.back.dp_defense, rightValue: right.back.dp_defense,
      leftWin: left.back.dp_defense > right.back.dp_defense,
      rightWin: right.back.dp_defense < right.back.dp_defense,
      isDraw: left.back.dp_defense === right.back.dp_defense,
    });
    if (spd) {
      rs.push({
        round: 3, stat: '💨 速度',
        leftValue: left.back.dp_speed || 0, rightValue: right.back.dp_speed || 0,
        leftWin: (left.back.dp_speed || 0) > (right.back.dp_speed || 0),
        rightWin: (right.back.dp_speed || 0) < (right.back.dp_speed || 0),
        isDraw: (left.back.dp_speed || 0) === (right.back.dp_speed || 0),
      });
    }
    return rs;
  }

  function startBattle() {
    if (!left || !right) return;
    const rs = buildRounds();
    setRounds(rs);
    setCur(null); setShowResult(false); setLScore(0); setRScore(0);
    setPhase('battling');
    playRound(rs, 0, 0, 0);
  }

  function playRound(rs: RoundResult[], idx: number, ls: number, rs_: number) {
    if (idx >= rs.length) {
      setLScore(ls); setRScore(rs_);
      setCur(null); setShowResult(true);
      setPhase('done');
      return;
    }
    setCur(idx); setShowResult(false);
    setTimeout(() => {
      const r = rs[idx];
      setLScore(ls + (r.leftWin ? 1 : 0));
      setRScore(rs_ + (r.rightWin ? 1 : 0));
      setShowResult(true);
      setTimeout(() => playRound(rs, idx + 1, ls + (r.leftWin ? 1 : 0), rs_ + (r.rightWin ? 1 : 0)), 1200);
    }, 1000);
  }

  function reset() {
    setPhase('selecting'); setRounds([]); setCur(null);
    setShowResult(false); setLScore(0); setRScore(0);
  }

  function pickerCards() {
    if (!search) return allCards;
    const q = search.toLowerCase();
    return allCards.filter(c => c.name.zh.includes(q) || c.name.ja.includes(q) || c.id.includes(q));
  }

  const lName = left?.name.zh ?? '我方';
  const rName = right?.name.zh ?? '对手';

  return (
    <div>
      {/* ─── Arena ─── */}
      <div className="bg-card-bg rounded-2xl border-2 border-border p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {phase === 'battling' && cur !== null ? (
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-primary/5 via-transparent to-orange-500/5 pointer-events-none" />
        ) : null}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-primary text-white text-xl sm:text-2xl font-black rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shadow-lg border-2 border-white/30">
          VS
        </div>

        <div className="flex items-start justify-center gap-4 sm:gap-8">
          {/* Left card */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-text-primary">我方</p>
            <div className={'relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 overflow-hidden shadow-md bg-gradient-to-br from-gray-100 to-gray-200 ' + (phase === 'done' && lScore > rScore ? 'border-primary shadow-[0_0_20px_6px_rgba(249,115,22,0.3)]' : 'border-border')}>
              {left ? <Image src={imgUrl(left)} alt={left.name.zh} fill className="object-contain p-2" unoptimized /> : null}
            </div>
            {left ? (
              <div className="text-center">
                <p className="text-sm font-bold text-text-primary">{left.name.zh}</p>
                <p className="text-xs text-text-secondary">ATK {left.back.dp_attack} · DEF {left.back.dp_defense}{left.back.dp_speed != null ? ' · SPD ' + left.back.dp_speed : ''}</p>
              </div>
            ) : null}
          </div>

          {/* Right card */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-text-primary">对手</p>
            <div className={'relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 overflow-hidden shadow-md bg-gradient-to-br from-gray-100 to-gray-200 ' + (phase === 'done' && rScore > lScore ? 'border-blue-500 shadow-[0_0_20px_6px_rgba(59,130,246,0.3)]' : 'border-border')}>
              {right ? <Image src={imgUrl(right)} alt={right.name.zh} fill className="object-contain p-2" unoptimized /> : null}
            </div>
            {right ? (
              <div className="text-center">
                <p className="text-sm font-bold text-text-primary">{right.name.zh}</p>
                <p className="text-xs text-text-secondary">ATK {right.back.dp_attack} · DEF {right.back.dp_defense}{right.back.dp_speed != null ? ' · SPD ' + right.back.dp_speed : ''}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Controls */}
        {phase === 'selecting' ? (
          <div className="mt-6 text-center">
            {!left || !right ? (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowPicker('left')} className="px-5 py-2.5 bg-card-bg border-2 border-border rounded-full text-sm font-medium text-text-primary hover:border-primary/40 transition-colors">
                  {left ? '换卡' : '选择我方卡片'}
                </button>
                <button onClick={() => setShowPicker('right')} className="px-5 py-2.5 bg-card-bg border-2 border-border rounded-full text-sm font-medium text-text-primary hover:border-primary/40 transition-colors">
                  {right ? '换卡' : '选择对手卡片'}
                </button>
                {left ? (
                  <button onClick={pickRandom} className="px-5 py-2.5 bg-white border-2 border-primary/30 text-primary font-medium rounded-full hover:shadow-md transition-all text-sm">
                    🎲 随机对手
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setShowPicker('left')} className="text-xs text-primary hover:underline">换卡</button>
                <button onClick={startBattle} className="px-8 py-3 bg-gradient-to-r from-primary to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg">
                  ⚔️ 开始对战
                </button>
                <button onClick={pickRandom} className="px-4 py-2 bg-white border-2 border-primary/30 text-primary font-medium rounded-full hover:shadow-md transition-all text-sm">
                  🎲 随机对手
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ─── Card Picker ─── */}
      {showPicker ? (
        <div className="mt-4 bg-card-bg rounded-2xl border-2 border-border p-4 shadow-sm">
          <input
            type="text" placeholder="搜索精灵名称..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl text-sm border border-border mb-3 focus:outline-none focus:border-primary" autoFocus
          />
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto">
            {pickerCards().map(c => (
              <button key={c.id} onClick={() => {
                if (showPicker === 'left') setLeft(c); else setRight(c);
                setShowPicker(null); setSearch('');
              }} className="flex flex-col items-center gap-1 p-1.5 rounded-xl hover:bg-orange-50 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image src={imgUrl(c)} alt={c.name.zh} fill className="object-contain p-0.5" unoptimized />
                </div>
                <span className="text-[10px] text-text-primary truncate w-full text-center">{c.name.zh}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ─── Battle Log ─── */}
      {phase !== 'selecting' && rounds.length > 0 ? (
        <div className="mt-6 bg-card-bg rounded-2xl border-2 border-border p-4 sm:p-6 shadow-sm">
          {/* Scoreboard */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
            <div className={'text-center px-5 py-3 rounded-xl border-2 transition-all duration-500 ' + (phase === 'done' && lScore > rScore ? 'bg-primary/10 border-primary/40 shadow' : 'border-transparent')}>
              <p className="text-xs text-text-secondary mb-1">{lName}</p>
              <p className={'text-3xl sm:text-4xl font-black tabular-nums ' + (lScore > rScore ? 'text-primary' : 'text-text-secondary')}>{lScore}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-text-secondary mb-1">比分</p>
              <p className="text-sm font-bold text-text-secondary">-</p>
              {phase === 'battling' ? <p className="text-xs text-primary font-medium mt-1 animate-pulse">⚡</p> : null}
            </div>
            <div className={'text-center px-5 py-3 rounded-xl border-2 transition-all duration-500 ' + (phase === 'done' && rScore > lScore ? 'bg-blue-50 border-blue-300/40 shadow' : 'border-transparent')}>
              <p className="text-xs text-text-secondary mb-1">{rName}</p>
              <p className={'text-3xl sm:text-4xl font-black tabular-nums ' + (rScore > lScore ? 'text-blue-500' : 'text-text-secondary')}>{rScore}</p>
            </div>
          </div>

          {/* Round Log */}
          <div className="space-y-2">
            {rounds.map((r, i) => {
              const isCur = cur !== null && cur === i;
              const isPast = cur !== null && i < cur;
              const isDone = phase === 'done';
              const revealed = isPast || (isDone && (cur === null || i <= cur));

              let bg = 'bg-gray-50/50 border border-dashed border-gray-200';
              if (revealed) bg = 'bg-white border border-border';
              if (isCur && !showResult) bg = 'bg-orange-50 border-2 border-primary/30 animate-pulse';

              return (
                <div key={i} className={'rounded-xl px-4 py-3 transition-all duration-500 ' + bg}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' + (revealed ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400')}>{r.round}</span>
                      <span className="text-sm font-bold text-text-primary">{r.stat}</span>
                    </div>
                    <span className="text-xs text-text-secondary">
                      {!revealed ? '⏳ 等待中' : isCur && showResult ? '结果' : ''}
                    </span>
                  </div>
                  {revealed ? (
                    <div className="grid grid-cols-5 gap-2 mt-2 items-center">
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">{lName}</p>
                        <p className={'text-lg font-bold tabular-nums ' + (r.leftWin ? 'text-primary' : 'text-text-secondary/60')}>{r.leftValue}</p>
                      </div>
                      <div className="col-span-3 flex items-center justify-center">
                        <span className={'text-sm font-bold px-3 py-1 rounded-full ' + (r.isDraw ? 'bg-gray-100 text-text-secondary' : r.leftWin ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-500')}>
                          {r.isDraw ? '平局' : (r.leftWin ? lName + ' +1' : rName + ' +1')}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">{rName}</p>
                        <p className={'text-lg font-bold tabular-nums ' + (r.rightWin ? 'text-blue-500' : 'text-text-secondary/60')}>{r.rightValue}</p>
                      </div>
                    </div>
                  ) : isCur && !showResult ? (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-lg">{r.leftValue}</span>
                      <span className="text-xl animate-ping">⚔️</span>
                      <span className="text-lg">{r.rightValue}</span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Winner — computed from rounds data for reliability */}
          {phase === 'done' ? (
            <div className="mt-6 text-center animate-[fadeIn_0.5s_ease-out]">
              {(() => {
                // Count total wins from all rounds
                let lWins = 0, rWins = 0;
                for (const r of rounds) {
                  if (r.leftWin) lWins++;
                  if (r.rightWin) rWins++;
                }
                const isDraw = lWins === rWins;
                const lWon = lWins > rWins;
                return (
                  <div className={'inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold shadow-lg ' + (lWon ? 'bg-primary text-white' : isDraw ? 'bg-gray-200 text-text-secondary' : 'bg-blue-500 text-white')}>
                    <span className="text-3xl">{isDraw ? '🤝' : '🏆'}</span>
                    <div>
                      {isDraw ? '平局！' : (lWon ? lName : rName) + ' 获胜！'}
                      <p className="text-xs opacity-70 font-normal mt-0.5">
                        {isDraw ? '不分胜负' : (lWon ? lName : rName) + ' 以 ' + Math.max(lWins, rWins) + ':' + Math.min(lWins, rWins) + ' 取胜'}
                      </p>
                    </div>
                  </div>
                );
              })()}
              <div className="mt-4">
                <button onClick={reset} className="px-6 py-2.5 bg-card-bg border-2 border-border rounded-full text-sm font-medium text-text-primary hover:border-primary/40 transition-colors">
                  🔄 再来一局
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
