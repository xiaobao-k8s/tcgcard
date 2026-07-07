/**
 * Mapping from card attribute names to their display emoji.
 * Covers all 18 Pokemon-type attributes.
 */
export const ATTRIBUTE_EMOJI: Record<string, string> = {
  // Already defined
  火: "🔥",
  草: "🌿",
  水: "💧",
  // Previously missing (fell back to ✨)
  雷: "⚡",
  超能力: "🔮",
  格斗: "🥊",
  毒: "☠️",
  地面: "🌍",
  岩石: "🪨",
  虫: "🐛",
  幽灵: "👻",
  钢: "⚙️",
  飞行: "🐦",
  冰: "❄️",
  龙: "🐉",
  // Additional standard Pokemon-type attributes
  一般: "⭐",
  妖精: "🎀",
  恶: "🌑",
};

/**
 * Default emoji shown when an attribute is not in the mapping.
 */
export const DEFAULT_ATTRIBUTE_EMOJI = "✨";

/**
 * Get the emoji for a given attribute name.
 * Returns the default emoji if the attribute is not mapped.
 */
export function getAttributeEmoji(attribute: string): string {
  return ATTRIBUTE_EMOJI[attribute] ?? DEFAULT_ATTRIBUTE_EMOJI;
}
