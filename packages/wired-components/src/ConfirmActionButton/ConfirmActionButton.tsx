/**
 * ConfirmActionButton — Button + ConfirmDialog + action dispatch.
 *
 * Click the button → ConfirmDialog opens → user confirms → action fires.
 * Cancel or click outside the dialog and nothing dispatches.
 *
 * Mirrors ActionButton's contract on top of an extra confirmation step.
 * Especially useful for destructive actions (delete, close, void).
 *
 * Implementation:
 *   - The button itself is the trigger; clicking it sets `open=true`
 *   - The dialog's `onConfirm` runs the same dispatch flow that
 *     `ActionButton` uses (resolve request, fire mutation, surface result)
 *   - Loading state lives on the dialog's confirm button until the
 *     mutation settles, then the dialog auto-closes on success
 *   - Errors keep the dialog open so the user can retry; `onError` callback
 *     still fires.
 */
import {
  useCallback,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import {
  Button,
  ConfirmDialog,
  type ButtonProps,
} from '@tensaw/design-system';
import {
  useActionMutation,
  type ActionError,
  type ActionResult,
} from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

export interface ConfirmActionButtonProps<TRequest, TResponse>
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'children' | 'onError'> {
  /** Action ID registered via `defineAction`. */
  actionId: string;
  /** Request payload. Either static or a function called on confirm. */
  request: TRequest | (() => TRequest | Promise<TRequest>);
  /** Called on success. */
  onSuccess?: (data: TResponse) => void;
  /** Called on error. */
  onError?: (error: ActionError) => void;
  /** Override the action's default success-toast policy. */
  toastOnSuccess?: boolean | string;
  /** Reserved for a future per-call optimistic override. */
  optimistic?: 'inherit' | 'off';
  /** Called before the dialog opens; returning false cancels. */
  beforeDispatch?: () => boolean | Promise<boolean>;

  // Dialog-specific
  confirmTitle: ReactNode;
  confirmDescription: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'default' | 'destructive';

  children: ReactNode;
}

export function ConfirmActionButton<TRequest = unknown, TResponse = unknown>({
  actionId,
  request,
  onSuccess,
  onError,
  toastOnSuccess,
  optimistic,
  beforeDispatch,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'default',
  disabled,
  children,
  ...buttonProps
}: ConfirmActionButtonProps<TRequest, TResponse>): JSX.Element {
  const [open, setOpen] = useState(false);
  const [fire, { isLoading }] = useActionMutation<TRequest, TResponse>(
    actionId,
  );
  const pushToast = useNotificationsStore((s) => s.pushToast);

  // Advisory only — see ActionButton.
  void optimistic;

  const handleTriggerClick = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (beforeDispatch) {
        const ok = await beforeDispatch();
        if (!ok) return;
      }
      setOpen(true);
    },
    [beforeDispatch],
  );

  const handleConfirm = useCallback(async () => {
    const payload = (
      typeof request === 'function'
        ? await (request as () => TRequest | Promise<TRequest>)()
        : request
    );
    const result: ActionResult<TResponse> = await fire(payload);
    if (result.ok) {
      if (toastOnSuccess !== undefined && toastOnSuccess !== false) {
        pushToast({
          toastId: `${actionId}-${Date.now()}`,
          severity: 'success',
          title:
            typeof toastOnSuccess === 'string' ? toastOnSuccess : 'Success',
        });
      }
      onSuccess?.(result.data);
      // ConfirmDialog auto-closes after onConfirm resolves.
    } else {
      onError?.(result.error);
      // ConfirmDialog's `handleConfirm` always calls `onOpenChange(false)`
      // after the awaited promise resolves. We can't suppress that without
      // throwing (which becomes an unhandled rejection in the dialog's
      // try/finally). Instead, schedule a re-open after the close finishes
      // so the user can retry from a still-open dialog.
      setTimeout(() => { setOpen(true); }, 0);
    }
  }, [actionId, fire, onError, onSuccess, pushToast, request, toastOnSuccess]);

  return (
    <>
      <Button
        {...buttonProps}
        onClick={(e) => {
          void handleTriggerClick(e);
        }}
        disabled={disabled}
      >
        {children}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmDescription}
        {...(confirmLabel !== undefined ? { confirmLabel } : {})}
        {...(cancelLabel !== undefined ? { cancelLabel } : {})}
        variant={confirmVariant}
        loading={isLoading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
ConfirmActionButton.displayName = 'ConfirmActionButton';
