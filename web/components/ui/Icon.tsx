import { createElement } from 'react';
import { ICON_PATHS } from '@/lib/icon-paths';
import type { IconName } from '@/lib/icons';

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  className?: string;
}

/** Inline 24px line icon (stroke = currentColor). Decorative: always aria-hidden. */
export default function Icon({ name, size = 24, stroke = 1.6, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name].map(([tag, attrs], i) => createElement(tag, { key: i, ...attrs }))}
    </svg>
  );
}
