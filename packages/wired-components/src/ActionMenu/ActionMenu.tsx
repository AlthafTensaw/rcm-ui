/**
 * ActionMenu — DropdownMenu where each item dispatches an action.
 *
 * Each item carries an `actionId`, `request`, label, and optional confirm
 * gate. Selecting an item dispatches the action via `dispatchAction` (the
 * imperative form — we don't have a per-item `useActionMutation` because
 * that would require a top-level hook per item, which doesn't compose
 * with a dynamic `items` array).
 *
 * `confirmBefore` shows a `ConfirmDialog` between selection and dispatch.
 * Useful for destructive items (delete, void). The dialog is rendered at
 * the menu level (one shared dialog instance), keyed to the currently
 * pending item.
 */
import { useCallback, useState, type ReactNode } from 'react';
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuItem,
} from '@tensaw/design-system';
import { dispatchAction } from '@tensaw/actions';

export interface ActionMenuItem {
  actionId: string;
  /**
   * Request payload for the action. May be either an immediate value or a
   * thunk `() => value | Promise<value>` that resolves on demand. The type
   * is `unknown` because the action's Zod schema validates the actual
   * shape at dispatch time; runtime distinguishes the two by `typeof`.
   */
  request: unknown;
  label: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'destructive';
  shortcut?: string;
  disabled?: boolean;
  /** If set, shows a ConfirmDialog before dispatch. */
  confirmBefore?: { title: ReactNode; description: ReactNode };
}

export interface ActionMenuProps {
  trigger: ReactNode;
  items: ActionMenuItem[];
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function ActionMenu({
  trigger,
  items,
  align,
  side,
}: ActionMenuProps): JSX.Element {
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const pending = pendingIndex !== null ? items[pendingIndex] : null;

  const resolveAndDispatch = useCallback(async (item: ActionMenuItem) => {
    const payload =
      typeof item.request === 'function'
        ? await (item.request as () => unknown)()
        : item.request;
    await dispatchAction(item.actionId, payload);
  }, []);

  const handleSelect = useCallback(
    (idx: number) => {
      const item = items[idx];
      if (!item) return;
      if (item.confirmBefore) {
        setPendingIndex(idx);
      } else {
        void resolveAndDispatch(item);
      }
    },
    [items, resolveAndDispatch],
  );

  const handleConfirm = useCallback(async () => {
    if (!pending) return;
    await resolveAndDispatch(pending);
    setPendingIndex(null);
  }, [pending, resolveAndDispatch]);

  return (
    <>
      <DropdownMenu
        trigger={trigger}
        {...(align !== undefined ? { align } : {})}
        {...(side !== undefined ? { side } : {})}
      >
        {items.map((item, idx) => (
          <DropdownMenuItem
            key={`${item.actionId}-${idx}`}
            onSelect={() => { handleSelect(idx); }}
            disabled={item.disabled ?? false}
            {...(item.icon !== undefined ? { icon: item.icon } : {})}
            {...(item.variant !== undefined ? { variant: item.variant } : {})}
            {...(item.shortcut !== undefined ? { shortcut: item.shortcut } : {})}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
      {pending?.confirmBefore && (
        <ConfirmDialog
          open={pendingIndex !== null}
          onOpenChange={(o) => {
            if (!o) setPendingIndex(null);
          }}
          title={pending.confirmBefore.title}
          description={pending.confirmBefore.description}
          variant={pending.variant === 'destructive' ? 'destructive' : 'default'}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
ActionMenu.displayName = 'ActionMenu';
