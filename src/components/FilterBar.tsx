'use client';

import type { Generation, Rarity } from '@/lib/types';

interface FilterBarProps {
  // Current filter values
  generation: Generation | null;
  attribute: string | null;
  rarity: Rarity | null;
  search: string;

  // Available filter options
  attributes: string[];
  rarities: Rarity[];

  // Callbacks
  onGenerationChange: (gen: Generation | null) => void;
  onAttributeChange: (attr: string | null) => void;
  onRarityChange: (rarity: Rarity | null) => void;
  onSearchChange: (term: string) => void;
}

/**
 * Rarity label mapping for Chinese display.
 */
const RARITY_LABELS: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  'ultra-rare': '极稀有',
  legendary: '传说级',
};

export default function FilterBar({
  generation,
  attribute,
  rarity,
  search,
  attributes,
  rarities,
  onGenerationChange,
  onAttributeChange,
  onRarityChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Generation Tabs */}
      <div className="flex justify-center gap-2">
        <GenerationTab
          label="全部"
          active={generation === null}
          onClick={() => onGenerationChange(null)}
        />
        <GenerationTab
          label="一代·旋风卡"
          active={generation === 1}
          onClick={() => onGenerationChange(1)}
        />
        <GenerationTab
          label="二代·比斗卡"
          active={generation === 2}
          onClick={() => onGenerationChange(2)}
        />
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="搜索精灵名称或编号..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5
              bg-card-bg border-2 border-border
              rounded-full
              text-sm text-text-primary placeholder:text-text-secondary/60
              focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Attribute & Rarity Filters */}
      <div className="flex flex-wrap justify-center gap-2">
        {/* Attribute filter */}
        <FilterChip
          label="全部属性"
          active={attribute === null}
          onClick={() => onAttributeChange(null)}
        />
        {attributes.map((attr) => (
          <FilterChip
            key={attr}
            label={attr}
            active={attribute === attr}
            onClick={() => onAttributeChange(attr)}
          />
        ))}

        {/* Separator */}
        <span className="w-px h-6 bg-border mx-2 self-center" />

        {/* Rarity filter */}
        <FilterChip
          label="全部稀有度"
          active={rarity === null}
          onClick={() => onRarityChange(null)}
        />
        {rarities.map((r) => (
          <FilterChip
            key={r}
            label={RARITY_LABELS[r]}
            active={rarity === r}
            onClick={() => onRarityChange(r)}
            rarity={r}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function GenerationTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-5 py-2 rounded-full text-sm font-medium
        transition-all duration-200
        ${
          active
            ? 'bg-primary text-white shadow-md'
            : 'bg-card-bg text-text-primary border-2 border-border hover:border-primary/40 hover:text-primary'
        }
      `}
    >
      {label}
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  rarity,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  rarity?: Rarity;
}) {
  // Special styling for rarity chips
  let activeClass = 'bg-primary text-white border-primary';
  if (rarity === 'legendary') {
    activeClass = 'bg-legendary-glow text-white border-legendary-glow';
  } else if (rarity === 'ultra-rare') {
    activeClass = 'bg-rare-glow text-white border-rare-glow';
  }

  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        border-2 transition-all duration-200
        ${
          active
            ? activeClass
            : 'bg-card-bg text-text-secondary border-border hover:border-primary/40 hover:text-primary'
        }
      `}
    >
      {label}
    </button>
  );
}
