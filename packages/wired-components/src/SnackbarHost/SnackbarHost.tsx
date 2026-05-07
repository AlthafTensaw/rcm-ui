/**
 * SnackbarHost — placeholder until the notifications store grows a
 * dedicated snackbar slot.
 *
 * The current `useNotificationsStore` (in `@tensaw/runtime`) has a single
 * `toasts[]` queue; there's no separate snackbar queue or severity
 * channel. The wired-component layer can't synthesize one without
 * coordinating with the store, so this component renders an empty
 * viewport region today and emits a single dev-mode warning so consumers
 * know the queue isn't actually wired up.
 *
 * Once the store grows a `snackbars[]` slot (or a flag on toast entries),
 * this becomes a parallel of `<ToastHost>` mapping store entries to
 * `<Snackbar>` components.
 *
 * Mount once at AppShell level alongside `<ToastHost>`.
 */
import { useEffect, useRef } from 'react';

let devWarnedOnce = false;

export interface SnackbarHostProps {
  className?: string;
}

const DEFAULT_VIEWPORT_CLASS =
  'pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4';

export function SnackbarHost({
  className = DEFAULT_VIEWPORT_CLASS,
}: SnackbarHostProps): JSX.Element {
  const warnedRef = useRef(false);
  useEffect(() => {
    if (devWarnedOnce || warnedRef.current) return;
    warnedRef.current = true;
    devWarnedOnce = true;
    if (typeof console !== 'undefined') {
       
      console.warn(
        '[SnackbarHost] Rendered, but no snackbar queue exists in @tensaw/runtime yet. ' +
          'This component is a placeholder; nothing will appear here until the store grows a snackbar slot. ' +
          'Use <ToastHost> for non-blocking notifications today.',
      );
    }
  }, []);

  return (
    <div
      role="region"
      aria-label="Snackbars"
      className={className}
      data-testid="snackbar-host"
    />
  );
}
SnackbarHost.displayName = 'SnackbarHost';

/** Reset for tests — not part of the public API. */
export function _resetSnackbarHostWarnedFlag(): void {
  devWarnedOnce = false;
}
