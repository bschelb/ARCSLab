/**
 * Names in the inline SVG line-icon set ported from `astro-site/src/components/Icon.astro`.
 * Data files reference icons by these names; emoji are never used as icons.
 * Phase 3 builds `components/ui/Icon.tsx` over the same set.
 */
export const ICON_NAMES = [
  'network',
  'shield',
  'layers',
  'radar',
  'bot',
  'flask',
  'target',
  'factory',
  'pulse',
  'alert',
  'lock',
  'briefcase',
  'scale',
  'brain',
  'chart',
  'message',
  'cpu',
  'pin',
  'mail',
  'globe',
  'user',
  'building',
  'link',
  'book',
  'star',
  'mic',
  'doc',
  'cap',
  'wrench',
  'school',
  'calendar',
  'award',
  'trophy',
  'arrow',
] as const;

export type IconName = (typeof ICON_NAMES)[number];
