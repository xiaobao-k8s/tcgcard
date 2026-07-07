/**
 * Shared attribute-to-gradient mapping for all card components.
 *
 * Each attribute maps to three gradient variants:
 * - `light`: 200/300 range — used for small/mini circles (EvolutionChain)
 * - `medium`: 300/400 range — used for CardCircle bubbles
 * - `dark`: 400/500 range — used for LenticularFlip large card faces
 *
 * Default fallback: warm orange gradient matching project brand.
 */

type GradientVariant = 'light' | 'medium' | 'dark';

/** Attribute-to-gradient mapping with three intensity variants. */
const ATTRIBUTE_GRADIENTS: Record<string, Record<GradientVariant, string>> = {
  火: {
    light: 'from-orange-200 to-red-300',
    medium: 'from-orange-300 to-red-400',
    dark: 'from-orange-400 to-red-500',
  },
  草: {
    light: 'from-green-200 to-emerald-300',
    medium: 'from-green-300 to-emerald-400',
    dark: 'from-green-400 to-emerald-500',
  },
  水: {
    light: 'from-blue-200 to-cyan-300',
    medium: 'from-blue-300 to-cyan-400',
    dark: 'from-blue-400 to-cyan-500',
  },
  雷: {
    light: 'from-yellow-200 to-amber-300',
    medium: 'from-yellow-300 to-amber-400',
    dark: 'from-yellow-400 to-amber-500',
  },
  超能力: {
    light: 'from-pink-200 to-purple-300',
    medium: 'from-pink-300 to-purple-400',
    dark: 'from-pink-400 to-purple-500',
  },
  格斗: {
    light: 'from-amber-200 to-orange-300',
    medium: 'from-amber-300 to-orange-400',
    dark: 'from-amber-400 to-orange-500',
  },
  毒: {
    light: 'from-purple-200 to-fuchsia-300',
    medium: 'from-purple-300 to-fuchsia-400',
    dark: 'from-purple-400 to-fuchsia-500',
  },
  地面: {
    light: 'from-yellow-300 to-amber-400',
    medium: 'from-yellow-400 to-amber-500',
    dark: 'from-yellow-500 to-amber-600',
  },
  岩石: {
    light: 'from-stone-200 to-stone-300',
    medium: 'from-stone-300 to-stone-400',
    dark: 'from-stone-400 to-stone-500',
  },
  虫: {
    light: 'from-lime-200 to-green-300',
    medium: 'from-lime-300 to-green-400',
    dark: 'from-lime-400 to-green-500',
  },
  幽灵: {
    light: 'from-indigo-200 to-purple-300',
    medium: 'from-indigo-300 to-purple-400',
    dark: 'from-indigo-400 to-purple-500',
  },
  钢: {
    light: 'from-gray-200 to-slate-300',
    medium: 'from-gray-300 to-slate-400',
    dark: 'from-gray-400 to-slate-500',
  },
  飞行: {
    light: 'from-sky-200 to-blue-200',
    medium: 'from-sky-300 to-blue-300',
    dark: 'from-sky-400 to-blue-400',
  },
  冰: {
    light: 'from-cyan-200 to-blue-200',
    medium: 'from-cyan-300 to-blue-300',
    dark: 'from-cyan-400 to-blue-400',
  },
  龙: {
    light: 'from-violet-300 to-purple-400',
    medium: 'from-violet-400 to-purple-500',
    dark: 'from-violet-500 to-purple-600',
  },
};

/** Default fallback gradient for unknown attributes. */
const DEFAULT_GRADIENTS: Record<GradientVariant, string> = {
  light: 'from-orange-100 to-yellow-200',
  medium: 'from-orange-200 to-yellow-300',
  dark: 'from-orange-300 to-yellow-400',
};

/**
 * Get the Tailwind gradient class for an attribute and variant.
 *
 * @param attribute - The card attribute name (e.g. '火', '水', '草')
 * @param variant - Color intensity: 'light', 'medium', or 'dark'
 * @returns Tailwind gradient class string
 */
export function getAttributeGradient(
  attribute: string,
  variant: GradientVariant = 'medium',
): string {
  return ATTRIBUTE_GRADIENTS[attribute]?.[variant] ?? DEFAULT_GRADIENTS[variant];
}
