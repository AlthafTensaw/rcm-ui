/**
 * ActionButton — `<Button>` wired to an action.
 *
 * On click: validates `beforeDispatch` (if any), resolves `request`
 * (static or function form), then fires the action via
 * `useActionMutation`. Loading state propagates to the underlying Button.
 * Errors are reported via the `onError` callback; default error display is
 * the platform's notifications store (the dispatcher already pushes a
 * toast for failed mutations per the action's policy, so we don't push a
 * second one).
 *
 * `toastOnSuccess` lets a caller override the action's default success
 * toast policy: pass `true` for the action's default-formatted toast,
 * a string for a custom title, or `false` to suppress. (The action's
 * own declaration is the policy of record; this prop is the
 * call-site override.)
 *
 * `optimistic` is reserved for a future override; the current dispatcher
 * always uses the action declaration's optimistic pattern and there's no
 * per-call API yet. Set to `'inherit'` (the default) until the dispatcher
 * grows that knob.
 */
import {
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
  useCallback,
} from 'react';
import {
  Button,
  type ButtonProps,
} from '@tensaw/design-system';
import {
  useActionMutation,
  type ActionError,
  type ActionResult,
} from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

export interface ActionButtonProps<TRequest, TResponse>
  extends Omit<ButtonProps, 'onClick' | 'loading' | 'children' | 'onError'> {
  /** Action ID registered via `defineAction`. */
  actionId: string;
  /** Request payload. Either static or a function called on click. */
  request: TRequest | (() => TRequest | Promise<TRequest>);
  /** Called on success. */
  onSuccess?: (data: TResponse) => void;
  /** Called on error. The dispatcher already surfaces a toast per the action's policy. */
  onError?: (error: ActionError) => void;
  /**
   * Override the action's default success-toast policy.
   *   - `true`        : show a generic "Success" toast
   *   - `string`      : show a toast with this title
   *   - `false`       : suppress the success toast
   *   - `undefined`   : defer to the action's declared policy
   */
  toastOnSuccess?: boolean | string;
  /**
   * Override the action's default optimistic pattern. Currently advisory
   * only — the dispatcher does not yet expose a per-call optimistic
   * override, so values other than `'inherit'` are documented but not
   * acted on until the dispatcher grows that knob.
   */
  optimistic?: 'inherit' | 'off';
  /** Called before dispatch; returning false cancels the dispatch. */
  beforeDispatch?: () => boolean | Promise<boolean>;
  children: ReactNode;
}

export function ActionButton<TRequest = unknown, TResponse = unknown>({
  actionId,
  request,
  onSuccess,
  onError,
  toastOnSuccess,
  optimistic,
  beforeDispatch,
  disabled,
  children,
  ...buttonProps
}: ActionButtonProps<TRequest, TResponse>): JSX.Element {
  const [fire, { isLoading }] = useActionMutation<TRequest, TResponse>(
    actionId,
  );
  const pushToast = useNotificationsStore((s) => s.pushToast);

  // Advisory only — see prop docs.
  void optimistic;

  const handleClick = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (beforeDispatch) {
        const ok = await beforeDispatch();
        if (!ok) return;
      }
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
      } else {
        onError?.(result.error);
      }
    },
    [
      actionId,
      beforeDispatch,
      fire,
      onError,
      onSuccess,
      pushToast,
      request,
      toastOnSuccess,
    ],
  );

  return (
    <Button
      {...buttonProps}
      onClick={(e) => {
        void handleClick(e);
      }}
      loading={isLoading}
      disabled={disabled || isLoading}
    >
      {children}
    </Button>
  );
}
ActionButton.displayName = 'ActionButton';
