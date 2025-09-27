/**
 * Utility functions for filtering tags in the UI
 */

// Technical tags that should not be displayed to users
const HIDDEN_TAGS = [
  'culture-bridge-shop',
  'product-deletion',
];

/**
 * Filter out technical/system tags that shouldn't be shown in the UI
 * @param tags Array of tags to filter
 * @returns Array of tags with technical tags removed
 */
export const filterVisibleTags = (tags: string[]): string[] => {
  return tags.filter(tag => !HIDDEN_TAGS.includes(tag));
};

/**
 * Check if a tag should be hidden from UI
 * @param tag Tag to check
 * @returns true if tag should be hidden
 */
export const isHiddenTag = (tag: string): boolean => {
  return HIDDEN_TAGS.includes(tag);
};
