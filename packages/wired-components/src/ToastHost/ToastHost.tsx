/**
 * ToastHost — subscribes to `useNotificationsStore` and renders the
 * platform's toast queue.
 *
 * Mount once at AppShell level. Every `pushToast(...)` from anywhere in
 * the app surfaces here. Auto-dismiss timing comes from each toast's
 * `durationMs`; the host wires `onDismiss` to `dismissToast(toastId)` so
 * the queue stays in sync with what the user sees.
 *
 * The store's severity vocabulary is exactly the Toast component's variant
 * vocabulary minus 'default', which the host never produces (every store
 * entry has an explicit severity).
 */
import { Toast } from '@tensaw/design-system';
import { useNotificationsStore } from '@tensaw/runtime';

export interface ToastHostProps {
  /**
   * Tailwind-class override for the fixed-position viewport. Default is
   * bottom-right, stacked vertically with gap.
   */
  className?: string;
}

const DEFAULT_VIEWPORT_CLASS =
  'pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4';

export function ToastHost({
  className = DEFAULT_VIEWPORT_CLASS,
}: ToastHostProps): JSX.Element | null {
  const toasts = useNotificationsStore((s) => s.toasts);
  const dismiss = useNotificationsStore((s) => s.dismissToast);

  if (toasts.length === 0) {
    // Render an empty viewport region so screen readers can find it
    // consistently; no children means nothing visual.
    return (
      <div
        role="region"
        aria-label="Notifications"
        className={className}
        data-testid="toast-host"
      />
    );
  }

  return (
    <div
      role="region"
      aria-label="Notifications"
      className={className}
      data-testid="toast-host"
    >
      {toasts.map((t) => (
        <div key={t.toastId} className="pointer-events-auto w-full max-w-sm">
          <Toast
            id={t.toastId}
            variant={t.severity}
            title={t.title}
            description={t.body ?? undefined}
            duration={t.durationMs ?? null}
            onDismiss={() => { dismiss(t.toastId); }}
          />
        </div>
      ))}
    </div>
  );
}
ToastHost.displayName = 'ToastHost';
