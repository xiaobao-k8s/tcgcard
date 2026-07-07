# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

奇多卡片百科 (Cheetos Card Wiki) — a Chinese-language Pokemon TCG card wiki for "奇多" (Cheetos) brand collectible cards. Built as a static site with Next.js 14 App Router, deployed to GitHub Pages.

All UI text is Simplified Chinese. Pokemon names preserve Japanese (hiragana/katakana).

## Commands

```bash
pnpm dev          # Dev server (http://localhost:3000, no basePath)
pnpm build        # SSG static export to out/ (basePath: /tcgcard in production)
pnpm build:data   # YAML → JSON via scripts/build-data.ts
pnpm lint         # ESLint (next/core-web-vitals + next/typescript)
pnpm tsc --noEmit # Type check (no dedicated test framework configured)
```

No automated test framework is installed. Validation is build-time: `tsc --noEmit` + `pnpm build`.

## Architecture

### Data Flow

YAML files in `data/gen{1,2}/*.yaml` → `src/lib/cards.ts` (module-level cached via `loadCardsRaw()`) → Server Components at build time via `generateStaticParams()`.

Adding a new card requires only a new YAML file — no code changes.

### Server/Client Boundary

- **Server Components**: `src/app/page.tsx`, `src/app/[cardId]/page.tsx`, `src/app/evolution/page.tsx`, `src/app/rarity/page.tsx`, `src/app/battle-rules/page.tsx`, `src/components/CardDetail.tsx`, `src/components/RarityBadge.tsx`
- **Client Components** (`'use client'`): `src/components/HomePage.tsx`, `src/components/CardCircle.tsx`, `src/components/FilterBar.tsx`, `src/components/LenticularFlip.tsx`, `src/components/EvolutionChain.tsx`

### Key Modules

- `src/lib/cards.ts` — `loadCards()`, `getCardById()`, `filterCards()`, `getEvolutionChains()`, `getEvolutionChainsGrouped()`, `getCardsByRarity()`
- `src/lib/types.ts` — `Card`, `CardBack`, `CardFilters`, `Rarity`, `EffectType`, `CharacterType`, `Generation`
- `src/lib/attribute-emoji.ts` — 18 Pokemon-type emoji mapping
- `src/lib/attribute-gradient.ts` — 3 Tailwind gradient variants per attribute (light/medium/dark)

### Routing

- `/` — Home: card bubble grid with filter bar
- `/[cardId]` — Card detail with 3D lenticular flip animation
- `/evolution` — Evolution chain navigator
- `/rarity` — Rarity ranking page
- `/battle-rules` — Battle rules page

## Key Patterns

### Card Data Schema (YAML)

Each card file follows the `Card` interface in `types.ts`. Key fields: `id`, `generation`, `name` (`{zh, ja}`), `number`, `attribute`, `rarity`, `evolution_stage`, `evolves_from`, `evolves_to`, `effect_type`, `image_front`, `image_frame_a/b/c`, `back` (skill, dp_attack, dp_defense, dp_speed, height, weight, description).

### Rarity-Driven Visuals

Four tiers: `common`, `rare`, `ultra-rare`, `legendary`. Higher rarity = larger bubble + stronger glow in the home grid. `RarityBadge` renders star indicators.

### Styling

Tailwind CSS 4 with `@theme` directive in `globals.css` (no tailwind.config.js). Custom Cheetos Orange theme (`#f97316` primary, warm cream backgrounds, gold borders). Path alias `@/*` → `./src/*`.

### Lenticular Flip

`LenticularFlip.tsx` — pure CSS 3D flip using `preserve-3d`, `backface-visibility: hidden`, `rotateY(180deg)`, plus repeating linear gradients for the ridge/lenticular effect. Touch support via swipe detection (50px threshold).

## Deployment

- **Primary**: GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`). Triggers on push to `main`/`master`. Builds with `pnpm build`, deploys `out/` directory.
- **Secondary**: Vercel (`vercel.json`). Build command `pnpm build`, output `out`.
- `basePath` is `/tcgcard` in production, empty in dev. `images.unoptimized: true` because GitHub Pages doesn't support Next.js image optimization.

## Task Tracking

Tasks T1–T9 tracked in `docs/requirements/TASKS.md`. T1–T8 completed. T9 (data entry for all 149 Gen 1+2 cards) is pending. Architecture and review docs live in `docs/`.

## Devflow

This project uses Claude Code devflow orchestration. Pipeline: implement → review → fix-review → test → accept. State tracked in `.claude/devflow/current.json`. Slash commands: `/devflow:plan`, `/devflow:implement`, `/devflow:review`, `/devflow:test`, `/devflow:accept`.
