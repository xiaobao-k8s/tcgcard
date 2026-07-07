# T9 Phase 2 Review: 23 Representative Cards

## Overview

Review Date: 2026-07-07
Files Reviewed:
- `data/gen1/xfd-001.yaml` through `xfd-019.yaml` (19 files)
- `data/gen2/ybd-001.yaml` through `ybd-004.yaml` (4 files)
- Total: 23 cards

## 1. Field Completeness

**All 23 cards pass.** Every card contains all required fields per the `Card` interface in `src/lib/types.ts`:

| Field | Present in all? |
|---|---|
| id | Yes |
| generation | Yes |
| name.zh / name.ja | Yes |
| number | Yes |
| attribute | Yes |
| rarity | Yes |
| evolution_stage | Yes |
| evolves_from | Yes (null where appropriate) |
| evolves_to | Yes (empty array `[]` where appropriate) |
| effect_type | Yes |
| image_front | Yes |
| image_frame_a / image_frame_b | Yes |
| back.skill | Yes |
| back.dp_attack | Yes |
| back.dp_defense | Yes |
| back.height | Yes |
| back.weight | Yes |
| back.description | Yes |
| back.character_type | Yes |
| source | Yes (all set to `pokedex`) |

**Optional fields used correctly:**
- `dp_speed` is present only in Gen 2 cards (ybd-001 through ybd-004), which is correct per `CardBack.dp_speed?` optional typing.
- `image_frame_c` is not used in any card, which is fine as it is also optional.
- `evolves_from` is `null` for base-stage / non-evolution cards; string for evolved forms.
- `evolves_to` is `[]` for terminal stages or non-evolution cards.

## 2. Evolution Chain Consistency

All evolution chains are internally consistent:

### Chain 1: Bulbasaur Line (xfd-001 -> xfd-002 -> xfd-003)
- xfd-001: evolves_from=null, evolves_to=[xfd-002] -- OK
- xfd-002: evolves_from=xfd-001, evolves_to=[xfd-003] -- OK
- xfd-003: evolves_from=xfd-002, evolves_to=[] -- OK

### Chain 2: Charmander Line (xfd-004 -> xfd-005 -> xfd-006)
- xfd-004: evolves_from=null, evolves_to=[xfd-005] -- OK
- xfd-005: evolves_from=xfd-004, evolves_to=[xfd-006] -- OK
- xfd-006: evolves_from=xfd-005, evolves_to=[] -- OK

### Chain 3: Squirtle Line (xfd-007 -> xfd-008 -> xfd-009)
- xfd-007: evolves_from=null, evolves_to=[xfd-008] -- OK
- xfd-008: evolves_from=xfd-007, evolves_to=[xfd-009] -- OK
- xfd-009: evolves_from=xfd-008, evolves_to=[] -- OK

### Chain 4: Dratini Line (xfd-013 -> xfd-014 -> xfd-015)
- xfd-013: evolves_from=null, evolves_to=[xfd-014] -- OK
- xfd-014: evolves_from=xfd-013, evolves_to=[xfd-015] -- OK
- xfd-015: evolves_from=xfd-014, evolves_to=[] -- OK

### Non-Evolution Cards (effect_type: attack)
All 14 non-evolution cards have evolves_from=null and evolves_to=[] -- correct.

**No issues found.** All cross-references resolve within the dataset.

## 3. DP Value Reasonableness

Evaluated against the rule: DP values should scale with rarity and evolution stage.

### Evolution Chain DP Progression

| Chain | Stage | dp_attack | dp_defense | Pattern |
|---|---|---|---|---|
| Bulbasaur | 1/common | 45 | 50 | Base |
| Ivysaur | 2/rare | 85 | 90 | +40/+40 |
| Venusaur | 3/ultra-rare | 115 | 125 | +30/+35 |
| Charmander | 1/common | 50 | 40 | Base |
| Charmeleon | 2/rare | 80 | 75 | +30/+35 |
| Charizard | 3/ultra-rare | 120 | 110 | +40/+35 |
| Squirtle | 1/common | 45 | 50 | Base |
| Wartortle | 2/rare | 80 | 85 | +35/+35 |
| Blastoise | 3/ultra-rare | 115 | 120 | +35/+35 |
| Dratini | 1/legendary | 80 | 75 | Base (legendary) |
| Dragonair | 2/legendary | 110 | 105 | +30/+30 |
| Dragonite | 3/legendary | 150 | 145 | +40/+40 |

All progressions are monotonically increasing. Legendary line starts higher than common base, as expected.

### Standalone Attack Cards (effect_type: attack)

| Card | Rarity | dp_attack | dp_defense | Assessment |
|---|---|---|---|---|
| Pikachu | common | 45 | 35 | OK |
| Jigglypuff | rare | 65 | 70 | OK |
| Gengar | rare | 75 | 70 | OK |
| Lapras | ultra-rare | 110 | 115 | OK |
| Machamp | ultra-rare | 125 | 100 | OK |
| Mewtwo | legendary | 155 | 140 | OK |
| Mew | legendary | 140 | 135 | OK |
| Delibird (Gen2) | rare | 70 | 65 | OK |
| Chikorita (Gen2) | common | 40 | 45 | OK |
| Cyndaquil (Gen2) | common | 45 | 40 | OK |
| Totodile (Gen2) | common | 50 | 45 | OK |

Values are within reasonable ranges. No issues.

## 4. Rarity Distribution

| Rarity | Count | Percentage |
|---|---|---|
| common | 7 | 30.4% |
| rare | 6 | 26.1% |
| ultra-rare | 5 | 21.7% |
| legendary | 5 | 21.7% |

All four tiers are covered. Distribution is balanced.

## 5. Attribute Coverage

| Attribute | Count |
|---|---|
| Grass | 4 |
| Fire | 4 |
| Water | 4 |
| Dragon | 3 |
| Psychic | 2 |
| Ice | 2 |
| Electric | 1 |
| Fighting | 1 |
| Ghost | 1 |
| Normal | 1 |

10 out of 18 Pokemon types are represented. The three starters and their fully-evolved lines account for 12 cards (Grass/Fire/Water). Missing attributes: Poison, Ground, Rock, Bug, Steel, Flying, Dark, Fairy. This is expected for a representative sample focused on iconic and starter Pokemon.

**Note:** xfd-010 (Pikachu) has attribute `电` (electric). This is NOT in the `ATTRIBUTE_EMOJI` map in `src/lib/attribute-emoji.ts`, which uses `雷` for electric. The UI will fall back to `✨` instead of `⚡` for Pikachu. See Finding F2 below.

## 6. Data Accuracy

Cross-referenced against canonical Pokemon Pokedex data:

### Gen 1 Cards (xfd)

| ID | Name (zh) | Name (ja) | Number | Pokedex # | Match? | Height | Weight | Match? |
|---|---|---|---|---|---|---|---|---|
| xfd-001 | Bulbasaur | Fushigidane | 001 | #001 | Yes | 0.7m | 6.9kg | Yes |
| xfd-002 | Ivysaur | Fushigisou | 002 | #002 | Yes | 1.0m | 13.0kg | Yes |
| xfd-003 | Venusaur | Fushigibana | 003 | #003 | Yes | 2.0m | 100.0kg | Yes |
| xfd-004 | Charmander | Hitokage | 004 | #004 | Yes | 0.6m | 8.5kg | Yes |
| xfd-005 | Charmeleon | Lizardo | 005 | #005 | Yes | 1.1m | 19.0kg | Yes |
| xfd-006 | Charizard | Lizardon | 006 | #006 | Yes | 1.7m | 90.5kg | Yes |
| xfd-007 | Squirtle | Zenigame | 007 | #007 | Yes | 0.5m | 9.0kg | Yes |
| xfd-008 | Wartortle | Kameil | 008 | #008 | Yes | 1.0m | 22.5kg | Yes |
| xfd-009 | Blastoise | Kamekkusu | 009 | #009 | Yes | 1.6m | 85.5kg | Yes |
| xfd-010 | Pikachu | Pikachu | 025 | #025 | Yes | 0.4m | 6.0kg | Yes |
| xfd-011 | Jigglypuff | Purin | 039 | #039 | Yes | 0.5m | 5.5kg | Yes |
| xfd-012 | Gengar | Gengar | 094 | #094 | Yes | 1.5m | 40.5kg | Yes |
| xfd-013 | Dratini | Miniryu | 147 | #147 | Yes | 1.8m | 3.3kg | Yes |
| xfd-014 | Dragonair | Hakuryu | 148 | #148 | Yes | 4.0m | 16.5kg | Yes |
| xfd-015 | Dragonite | Kairyu | 149 | #149 | Yes | 2.2m | 210.0kg | Yes |
| xfd-016 | Mewtwo | Mewtwo | 150 | #150 | Yes | 2.0m | 122.0kg | Yes |
| xfd-017 | Mew | Mew | 151 | #151 | Yes | 0.4m | 4.0kg | Yes |
| xfd-018 | Lapras | Laplace | 131 | #131 | Yes | 2.5m | 220.0kg | Yes |
| xfd-019 | Machamp | Kairiky | 068 | #068 | Yes | 1.6m | 130.0kg | Yes |

### Gen 2 Cards (ybd)

| ID | Name (zh) | Name (ja) | Number | Pokedex # | Match? | Height | Weight | Match? |
|---|---|---|---|---|---|---|---|---|
| ybd-001 | Delibird | Delibird | 225 | #225 | Yes | 0.9m | 16.0kg | Yes |
| ybd-002 | Chikorita | Chikorita | 152 | #152 | Yes | 0.9m | 6.4kg | Yes |
| ybd-003 | Cyndaquil | Hinoarashi | 155 | #155 | Yes | 0.5m | 7.9kg | Yes |
| ybd-004 | Totodile | Waninoko | 158 | #158 | Yes | 0.6m | 9.5kg | Yes |

**All Pokemon names, Japanese names, Pokedex numbers, heights, and weights are accurate.**

### Dual-Type Pokemon Consideration

The following Pokemon in this dataset are canonically dual-type but only have a single attribute listed:

- **Gengar (#094)**: Ghost/Poison -- listed as 幽灵 only
- **Bulbasaur line (#001-003)**: Grass/Poison -- listed as 草 only
- **Charizard (#006)**: Fire/Flying -- listed as 火 only
- **Squirtle line (#007-009)**: Pure Water -- OK
- **Machamp (#068)**: Pure Fighting -- OK
- **Dratini line (#147-149)**: Pure Dragon -- OK
- **Delibird (#225)**: Ice/Flying -- listed as 冰 only

If `attribute` in the type system is a single string (confirmed: `attribute: string` in types.ts), then this is a schema limitation rather than a data error. The cards use the primary type, which is a reasonable convention.

## 7. Source Field

All 23 cards have `source: pokedex`. Consistent and acceptable.

## Findings

### F1 (Low) -- xfd-010 Pikachu uses attribute `电` instead of `雷`

Pikachu's attribute is set to `电` (electric), but `src/lib/attribute-emoji.ts` maps electric-type emoji using `雷`. The UI will display Pikachu with the default `✨` emoji instead of `⚡`.

**Recommendation:** Either change xfd-010 attribute to `雷`, or add `电: "⚡"` to `ATTRIBUTE_EMOJI` as an alias.

### F2 (Informational) -- Dual-type Pokemon only have primary attribute

Gengar (Ghost/Poison), Bulbasaur line (Grass/Poison), Charizard (Fire/Flying), Delibird (Ice/Flying) are all dual-type in canon but only list one attribute. This matches the current `attribute: string` schema limitation. If dual-type support is desired in the future, the schema needs updating.

### F3 (Informational) -- No `雷` (Electric) attribute in emoji map matches Pikachu's `电`

The emoji map uses `雷` for the electric type, but Pikachu (the most iconic electric Pokemon) uses `电`. This inconsistency should be resolved before bulk data entry.

## Summary

**Overall Assessment: PASS with minor notes**

The 23 representative cards are well-structured and accurate. All required fields are present, evolution chains are internally consistent, DP values are reasonable for their rarity/stage, all four rarity tiers are covered, and Pokemon data (names, numbers, dimensions) matches canonical Pokedex records.

The only actionable item is F1/F3: resolve the `电` vs `雷` attribute naming inconsistency for electric-type Pokemon before bulk data entry. This is a small fix with potential impact on many cards if not addressed.
