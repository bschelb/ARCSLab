/** Funding helpers. Totals are always computed from `data/funding.json`, never typed by hand. */
import type { Grant } from './schemas';

/** Statuses the site displays. Pending and not-funded proposals stay in data, hidden here. */
export const DISPLAYED_STATUSES: readonly Grant['status'][] = ['active', 'completed'];

export function displayedGrants(grants: Grant[]): Grant[] {
  return grants.filter((g) => DISPLAYED_STATUSES.includes(g.status));
}

export function grantsByStatus(grants: Grant[], status: Grant['status']): Grant[] {
  return grants.filter((g) => g.status === status);
}

/** Displayed grants split into external sponsors and internal UTK awards, data order kept. */
export function splitInternal(grants: Grant[]): { external: Grant[]; internal: Grant[] } {
  const shown = displayedGrants(grants);
  return { external: shown.filter((g) => !g.internal), internal: shown.filter((g) => g.internal) };
}

/** Total awarded with Dr. Schelble as PI: active and completed grants where the role is PI. */
export function piTotal(grants: Grant[]): number {
  return displayedGrants(grants)
    .filter((g) => g.role === 'PI')
    .reduce((sum, g) => sum + g.amount, 0);
}
