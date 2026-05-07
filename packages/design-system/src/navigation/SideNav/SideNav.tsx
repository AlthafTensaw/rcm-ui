/**
 * SideNav — vertical menu with collapsible sections and content search.
 *
 * The operations console's left rail. Renders a fixed-width column that
 * the user can collapse to icons-only. Children are typically a mix of
 * `<SideNavGroup>` (with `<SideNavItem>` children) and the standalone
 * `<SideNavSearch>` per F10(b).
 *
 * Active state on items can be controlled (`active` prop) or auto-detected
 * from the current location via `useLocation()` (matched against `to`).
 *
 * `<SideNavSearch>` is critical for case lookup — debounces a `query`,
 * calls `onSearch`, and surfaces `<SearchResult>` rows the user can click
 * to invoke `onResultSelect`.
 */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Search as SearchIcon } from 'lucide-react';

import { Link } from '../../primitives/Link';
import { Spinner } from '../../feedback/Spinner';
import { cn } from '../../utils/cn';

// -- Root -------------------------------------------------------------------

interface SideNavContextValue {
  collapsed: boolean;
}
const SideNavContext = createContext<SideNavContextValue>({ collapsed: false });
function useSideNavContext(): SideNavContextValue {
  return useContext(SideNavContext);
}

export interface SideNavProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  /** Px. Default 240 (expanded) / 64 (collapsed). */
  width?: number;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function SideNav({
  collapsed = false,
  // onCollapseChange currently unused by the component itself — kept in
  // the API so future built-in toggles can wire it. Suppress TS unused.
  onCollapseChange,
  width,
  children,
  className,
  'aria-label': ariaLabel = 'Side navigation',
}: SideNavProps): JSX.Element {
  void onCollapseChange;
  const w = width ?? (collapsed ? 64 : 240);
  return (
    <SideNavContext.Provider value={{ collapsed }}>
      <nav
        aria-label={ariaLabel}
        data-collapsed={collapsed || undefined}
        className={cn(
          'flex h-full flex-col border-r border-border bg-background py-2',
          className,
        )}
        style={{ width: w }}
      >
        {children}
      </nav>
    </SideNavContext.Provider>
  );
}
SideNav.displayName = 'SideNav';

// -- SideNavGroup ----------------------------------------------------------

export interface SideNavGroupProps {
  label: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export function SideNavGroup({
  label,
  collapsible = false,
  defaultExpanded = true,
  children,
  className,
}: SideNavGroupProps): JSX.Element {
  const { collapsed } = useSideNavContext();
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Auto-expand when collapsible is off; hide labels entirely when SideNav is collapsed.
  const showChildren = !collapsible || expanded;

  const headerLabel = collapsed ? null : (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );

  return (
    <div className={cn('flex flex-col px-2 py-1', className)} role="group">
      {!collapsed && (
        collapsible ? (
          <button
            type="button"
            onClick={() => { setExpanded((e) => !e); }}
            aria-expanded={expanded}
            className={cn(
              'flex w-full items-center justify-between gap-1 rounded px-1 py-1',
              'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {headerLabel}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform',
                !expanded && '-rotate-90',
              )}
              aria-hidden="true"
            />
          </button>
        ) : (
          <div className="px-1 py-1">{headerLabel}</div>
        )
      )}
      {showChildren && (
        <div className="mt-1 flex flex-col gap-0.5">{children}</div>
      )}
    </div>
  );
}
SideNavGroup.displayName = 'SideNavGroup';

// -- SideNavItem -----------------------------------------------------------

export interface SideNavItemProps {
  to: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Controlled. Omit for auto-detect via current route prefix match. */
  active?: boolean;
  children: ReactNode;
  className?: string;
}

export function SideNavItem({
  to,
  icon,
  badge,
  active: activeProp,
  children,
  className,
}: SideNavItemProps): JSX.Element {
  const { collapsed } = useSideNavContext();
  const location = useLocation();
  const autoActive =
    location.pathname === to ||
    (to !== '/' && location.pathname.startsWith(`${to}/`));
  const active = activeProp ?? autoActive;

  return (
    <Link
      to={to}
      variant="subtle"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
        'no-underline hover:no-underline',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
        collapsed && 'justify-center',
        className,
      )}
      title={collapsed && typeof children === 'string' ? children : undefined}
    >
      {icon && (
        <span className="inline-flex h-4 w-4 shrink-0 items-center" aria-hidden="true">
          {icon}
        </span>
      )}
      {!collapsed && <span className="flex-1 truncate">{children}</span>}
      {!collapsed && badge && <span className="ml-1 inline-flex">{badge}</span>}
    </Link>
  );
}
SideNavItem.displayName = 'SideNavItem';

// -- SideNavSearch ---------------------------------------------------------

export interface SearchResult {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  metadata?: ReactNode;
}

export interface SideNavSearchProps {
  placeholder?: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onResultSelect: (result: SearchResult) => void;
  debounceMs?: number;
  emptyText?: string;
  className?: string;
}

export function SideNavSearch({
  placeholder = 'Search…',
  onSearch,
  onResultSelect,
  debounceMs = 250,
  emptyText = 'No results.',
  className,
}: SideNavSearchProps): JSX.Element | null {
  const { collapsed } = useSideNavContext();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!touched) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const reqId = ++reqIdRef.current;
      void onSearch(query).then((r) => {
        if (reqId !== reqIdRef.current) return;
        setResults(r);
        setLoading(false);
      });
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, touched, debounceMs, onSearch]);

  const showResults = touched && (loading || results.length > 0 || query.length > 0);

  if (collapsed) {
    // Collapsed rail shows only an icon button; the search UI surfaces
    // through the parent's expand state. Keep simple for v1.
    return (
      <button
        type="button"
        aria-label="Search"
        className={cn(
          'mx-2 my-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground',
          className,
        )}
      >
        <SearchIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={cn('px-2 py-2', className)}>
      <div className="relative">
        <SearchIcon
          className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setTouched(true);
            setQuery(e.target.value);
          }}
          onFocus={() => { setTouched(true); }}
          aria-label={placeholder}
          className={cn(
            'flex h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-sm shadow-sm',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          )}
        />
      </div>
      {showResults && (
        <div
          role="listbox"
          aria-label="Search results"
          className="mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-sm"
        >
          {loading && (
            <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
              <Spinner size="xs" /> Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          )}
          {!loading &&
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onResultSelect(r);
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:bg-accent',
                )}
              >
                {r.icon && (
                  <span className="inline-flex h-4 w-4 shrink-0 items-center" aria-hidden="true">
                    {r.icon}
                  </span>
                )}
                <span className="flex flex-1 flex-col leading-tight">
                  <span className="font-medium">{r.label}</span>
                  {r.description && (
                    <span className="text-xs text-muted-foreground">
                      {r.description}
                    </span>
                  )}
                </span>
                {r.metadata && (
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {r.metadata}
                  </span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
SideNavSearch.displayName = 'SideNavSearch';
