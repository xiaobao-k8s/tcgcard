// Card data types for the Cheetos Card Wiki

export type Rarity = 'common' | 'rare' | 'ultra-rare' | 'legendary';
export type EffectType = 'evolution' | 'attack' | 'triple';
export type CharacterType = 'pokemon' | 'trainer';
export type Generation = 1 | 2;

export interface CardBack {
  skill: string;
  dp_attack: number;
  dp_defense: number;
  dp_speed?: number;
  height: string;
  weight: string;
  description: string;
  character_type?: CharacterType;
}

export interface Card {
  id: string;
  generation: Generation;
  name: { zh: string; ja: string };
  number: string;
  attribute: string;
  rarity: Rarity;
  evolution_stage: number;
  evolves_from?: string | null;
  evolves_to?: string[];
  effect_type: EffectType;
  image_front: string;
  image_frame_a: string;
  image_frame_b: string;
  image_frame_c?: string;
  back: CardBack;
}

export interface CardFilters {
  generation?: Generation;
  attribute?: string;
  rarity?: Rarity;
  search?: string;
}
