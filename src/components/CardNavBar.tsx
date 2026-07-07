'use client';

import Link from 'next/link';
import type { Card } from '@/lib/types';

interface CardNavBarProps {
  prevCard: Card | null;
  nextCard: Card | null;
  currentIndex: number;
  totalCards: number;
}

export default function CardNavBar({ prevCard, nextCard, currentIndex, totalCards }: CardNavBarProps) {
  return (
    <div className="w-full bg-card-bg border-2 border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Cards navigation row */}
      <div className="flex items-center justify-between p-2 sm:p-3">
        {/* Previous button */}
        {prevCard ? (
          <Link
            href={`/${prevCard.id}`}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
          >
            <span className="text-lg sm:text-xl text-primary group-hover:-translate-x-1 transition-transform">←</span>
            <div className="hidden sm:block text-left">
              <p className="text-xs text-text-secondary">上一张</p>
              <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{prevCard.name.zh}</p>
            </div>
          </Link>
        ) : (
          <div className="px-2 sm:px-4 py-2 opacity-30">
            <span className="text-lg sm:text-xl">←</span>
          </div>
        )}

        {/* Center: position indicator + back button */}
        <div className="flex flex-col items-center gap-1">
          <Link
            href="/"
            className="text-xs text-text-secondary hover:text-primary transition-colors flex items-center gap-1"
          >
            <span>⌂</span>
            <span className="hidden sm:inline">返回图鉴</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-1 rounded-full bg-border overflow-hidden w-16 sm:w-24">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
              />
            </div>
            <span className="text-xs text-text-secondary tabular-nums">
              {currentIndex + 1}/{totalCards}
            </span>
          </div>
        </div>

        {/* Next button */}
        {nextCard ? (
          <Link
            href={`/${nextCard.id}`}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl hover:bg-primary/10 transition-all duration-200 group"
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs text-text-secondary">下一张</p>
              <p className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{nextCard.name.zh}</p>
            </div>
            <span className="text-lg sm:text-xl text-primary group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        ) : (
          <div className="px-2 sm:px-4 py-2 opacity-30">
            <span className="text-lg sm:text-xl">→</span>
          </div>
        )}
      </div>
    </div>
  );
}
