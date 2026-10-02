/** Primary navigation (current items; Join and the "News & Talks" label arrive in Phase 5, D9). */
export const NAV_ITEMS = [
  { href: '/research', label: 'Research' },
  { href: '/publications', label: 'Publications' },
  { href: '/team', label: 'Team' },
  { href: '/pi', label: 'PI' },
  { href: '/funding', label: 'Funding' },
  { href: '/talks', label: 'Talks' },
] as const;

export const NAV_CTA = { href: '/contact', label: 'Contact' } as const;

/** Active when the path is the item or below it (/papers/* counts as Publications). */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/publications' && pathname.startsWith('/papers/')) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
