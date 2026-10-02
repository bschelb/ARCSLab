/**
 * The page's query string as React state, for statically rendered pages (Phase 5 explorer
 * and timeline). The server snapshot is always "" so the static HTML is the unfiltered page;
 * after hydration the real query applies. Updates use history.replaceState, which Next 16
 * integrates with its router (no navigation, no new history entries while typing).
 */
import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
  };
}

export function useUrlSearch(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => '',
  );
}

/** Replace the query string ("" clears it) and notify every subscriber. */
export function replaceSearch(search: string): void {
  const { pathname, hash } = window.location;
  window.history.replaceState(null, '', `${pathname}${search}${hash}`);
  listeners.forEach((l) => l());
}
