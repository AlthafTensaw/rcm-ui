/**
 * Icon — typed wrapper around Lucide-react icons.
 *
 * The `name` prop is narrowed to `keyof typeof Lucide`, so TypeScript
 * autocompletes every available icon. Sizes (`xs`/`sm`/`md`/`lg`/`xl`) map
 * to a fixed pixel scale.
 *
 * For decorative icons (next to a labeled control), pass `aria-hidden`. For
 * standalone informational icons, pass `aria-label` so screen readers read
 * the meaning.
 */
import type { FC } from 'react';
import * as Lucide from 'lucide-react';

export type IconName = keyof typeof Lucide;

const SIZE_MAP = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32 } as const;

export interface IconProps {
  name: IconName;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  /** For standalone icons that convey meaning; required if not aria-hidden. */
  'aria-label'?: string;
  /** For decorative icons accompanying a labeled control. */
  'aria-hidden'?: boolean;
}

export const Icon: FC<IconProps> = ({
  name,
  size = 'md',
  className,
  ...aria
}) => {
  const LucideIcon = Lucide[name] as Lucide.LucideIcon | undefined;
  // Lucide icons are React forwardRef components (objects with $$typeof),
  // not raw functions; check for renderable component shape rather than
  // `typeof === 'function'`.
  if (
    !LucideIcon ||
    (typeof LucideIcon !== 'function' && typeof LucideIcon !== 'object')
  ) {
    if (typeof console !== 'undefined') {
       
      console.warn(`[Icon] Unknown icon: ${name}`);
    }
    return null;
  }
  return (
    <LucideIcon
      size={SIZE_MAP[size]}
      className={className}
      {...aria}
    />
  );
};
Icon.displayName = 'Icon';
