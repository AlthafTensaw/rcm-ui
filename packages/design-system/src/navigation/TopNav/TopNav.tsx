/**
 * TopNav — app-level top bar.
 *
 * Three slots: `logo` on the far left, `primaryNav` left-aligned (typically
 * a row of `<TopNavItem>`s), `utilityNav` right-aligned (search, notifications,
 * user menu). Height is sm (48 px), md (56 px, default), or lg (64 px).
 *
 * Sub-components:
 *   - `<TopNavItem>` — single nav item; can be internal route, external link,
 *     or just a button (no `to`/`href`)
 *   - `<TopNavUserMenu>` — avatar + name trigger that opens a DropdownMenu
 *     populated from `items`
 */
import { type ReactNode } from 'react';

import { Avatar } from '../../primitives/Avatar';
import { ExternalLink } from '../../primitives/ExternalLink';
import { Link } from '../../primitives/Link';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '../../overlays/DropdownMenu';
import { cn } from '../../utils/cn';

const HEIGHT_CLASS = {
  sm: 'h-12',
  md: 'h-14',
  lg: 'h-16',
} as const;

export interface TopNavProps {
  logo?: ReactNode;
  primaryNav?: ReactNode;
  utilityNav?: ReactNode;
  height?: keyof typeof HEIGHT_CLASS;
  variant?: 'default' | 'minimal';
  className?: string;
  'aria-label'?: string;
}

export function TopNav({
  logo,
  primaryNav,
  utilityNav,
  height = 'md',
  variant = 'default',
  className,
  'aria-label': ariaLabel = 'Primary navigation',
}: TopNavProps): JSX.Element {
  return (
    <header
      role="banner"
      className={cn(
        'flex w-full items-center gap-4 bg-background px-4',
        HEIGHT_CLASS[height],
        variant === 'default' && 'border-b border-border',
        className,
      )}
    >
      {logo && <div className="flex items-center">{logo}</div>}
      {primaryNav && (
        <nav
          aria-label={ariaLabel}
          className="flex items-center gap-1"
        >
          {primaryNav}
        </nav>
      )}
      {utilityNav && (
        <div className="ml-auto flex items-center gap-2">{utilityNav}</div>
      )}
    </header>
  );
}
TopNav.displayName = 'TopNav';

// -- TopNavItem -------------------------------------------------------------

export interface TopNavItemProps {
  /** Internal route (uses `<Link>`). */
  to?: string;
  /** External URL (uses `<ExternalLink>`). */
  href?: string;
  active?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const ITEM_BASE_CLASS =
  'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function TopNavItem({
  to,
  href,
  active,
  icon,
  badge,
  children,
  className,
  onClick,
}: TopNavItemProps): JSX.Element {
  const composed = cn(
    ITEM_BASE_CLASS,
    active
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    className,
  );
  const inner = (
    <>
      {icon && (
        <span className="inline-flex h-4 w-4 items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{children}</span>
      {badge && <span className="ml-1 inline-flex">{badge}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={composed} aria-current={active ? 'page' : undefined}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <ExternalLink href={href} className={composed} showIcon={false}>
        {inner}
      </ExternalLink>
    );
  }
  return (
    <button type="button" className={composed} onClick={onClick}>
      {inner}
    </button>
  );
}
TopNavItem.displayName = 'TopNavItem';

// -- TopNavUserMenu --------------------------------------------------------

/**
 * Shape that callers pass for each menu item. Mirrors the public surface
 * of `<DropdownMenuItem>` props but lighter — keeps consumers from having
 * to know about that component directly.
 */
export interface TopNavUserMenuItem {
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect: () => void;
}

export interface TopNavUserMenuProps {
  user: { name: string; email: string; avatar?: string };
  items: TopNavUserMenuItem[];
  className?: string;
}

export function TopNavUserMenu({
  user,
  items,
  className,
}: TopNavUserMenuProps): JSX.Element {
  return (
    <DropdownMenu
      align="end"
      trigger={
        <button
          type="button"
          aria-label={`User menu for ${user.name}`}
          className={cn(
            'inline-flex items-center gap-2 rounded-md px-2 py-1 text-left transition-colors',
            'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
        >
          <Avatar
            size="sm"
            alt={user.name}
            {...(user.avatar ? { src: user.avatar } : {})}
          />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </span>
        </button>
      }
    >
      <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {items.map((item, idx) => (
        <DropdownMenuItem
          key={idx}
          icon={item.icon}
          shortcut={item.shortcut}
          variant={item.variant}
          disabled={item.disabled}
          onSelect={item.onSelect}
        >
          {item.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}
TopNavUserMenu.displayName = 'TopNavUserMenu';
