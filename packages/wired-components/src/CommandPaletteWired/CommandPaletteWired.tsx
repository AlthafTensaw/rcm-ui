/**
 * CommandPaletteWired — CommandPalette + actions registry integration.
 *
 * Auto-populates with every registered action whose permission (if any)
 * the current user holds. Items are grouped by the action ID's domain
 * prefix (`claim.retry` → group "claim"); the trailing verb becomes the
 * default label, but each item still uses the action's stored `description`
 * (when present) so consumers see human-readable text.
 *
 * Selecting an item dispatches the action with an empty request payload —
 * this is the right default for navigate-kind actions and trivial mutations
 * (e.g. `app.toggle-dark-mode`). Actions whose request schema requires
 * fields will fail their schema check at dispatch time; callers wanting a
 * pre-dispatch arg-collection dialog should declare those actions outside
 * the palette or pass a custom `filter` to hide them.
 *
 * `extraGroups` is rendered after auto-discovered action groups; consumers
 * use it for navigation shortcuts, recent items, etc.
 */
import { useMemo } from 'react';
import {
  CommandPalette,
  type CommandGroup,
  type CommandItem,
} from '@tensaw/design-system';
import {
  dispatchAction,
  getActionPermission,
  listActions,
} from '@tensaw/actions';
import { useAuthStore } from '@tensaw/runtime';

export interface CommandPaletteWiredProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Filter which actions appear. Receives the actionId; return false to hide. */
  filter?: (actionId: string) => boolean;
  /** Additional non-action groups (navigation, recent items). */
  extraGroups?: CommandGroup[];
  placeholder?: string;
  emptyText?: string;
}

/** Convert "claim.retry" → "Retry"; "admin.list-cases" → "List cases". */
function humanizeVerb(actionId: string): string {
  const verb = actionId.includes('.')
    ? actionId.slice(actionId.indexOf('.') + 1)
    : actionId;
  const spaced = verb.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function domainOf(actionId: string): string {
  const dot = actionId.indexOf('.');
  return dot >= 0 ? actionId.slice(0, dot) : 'general';
}

export function CommandPaletteWired({
  open,
  onOpenChange,
  filter,
  extraGroups,
  placeholder,
  emptyText,
}: CommandPaletteWiredProps): JSX.Element {
  // Subscribe to permissions so the palette re-evaluates if the user's
  // permissions change while it's open.
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const actionGroups = useMemo<CommandGroup[]>(() => {
    const allActions = listActions();
    const byDomain = new Map<string, CommandItem[]>();

    for (const decl of allActions) {
      if (filter && !filter(decl.actionId)) continue;
      const required = getActionPermission(decl.actionId);
      if (required && !permissions.includes(required)) continue;

      const item: CommandItem = {
        id: decl.actionId,
        label: decl.description ?? humanizeVerb(decl.actionId),
        description: decl.description ? decl.actionId : undefined,
        keywords: [decl.actionId, domainOf(decl.actionId)],
        onSelect: () => {
          onOpenChange(false);
          // Empty payload — see component header for the rationale.
          void dispatchAction(decl.actionId, {});
        },
      };
      const dom = domainOf(decl.actionId);
      const arr = byDomain.get(dom);
      if (arr) arr.push(item);
      else byDomain.set(dom, [item]);
    }

    return Array.from(byDomain.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dom, items]) => ({
        label: dom.charAt(0).toUpperCase() + dom.slice(1),
        items: items.sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }, [filter, permissions, onOpenChange]);

  const groups = useMemo<CommandGroup[]>(() => {
    return extraGroups ? [...actionGroups, ...extraGroups] : actionGroups;
  }, [actionGroups, extraGroups]);

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      {...(placeholder !== undefined ? { placeholder } : {})}
      {...(emptyText !== undefined ? { emptyText } : {})}
    />
  );
}
CommandPaletteWired.displayName = 'CommandPaletteWired';
