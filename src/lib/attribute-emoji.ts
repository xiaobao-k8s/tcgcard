/**
 * Mapping from card attribute names to their display emoji.
 */
export const ATTRIBUTE_EMOJI: Record<string, string> = {
  火: "🔥",
  草: "🌿",
  水: "💧",
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
