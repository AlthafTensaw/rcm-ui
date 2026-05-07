/**
 * Widget — card-shaped container with built-in state shells.
 *
 * Per F2 of the buildout spec, "Widget" in the design-system means a
 * card-shaped container for grouping primitives — a richer cousin of
 * `<Card>` with title / actions / loading / error / empty states pre-wired.
 *
 * Platform widget-lifecycle integration is **opt-in** via `instanceId` plus
 * the surrounding context (`widgetId`, `containerId`, `pageId`). When all
 * four are present, the Widget calls `useWidgetsStore.registerWidget` on
 * mount, transitions through `mounting → mounted → unmounting`, and
 * surfaces `setWidgetError` / `clearWidgetError` automatically based on
 * the `error` prop. Without those props it's a pure presentational shell.
 *
 * The four states are mutually exclusive and resolved in this priority:
 *   error  >  loading  >  empty (when no children)  >  children
 */
import { useEffect, type ReactNode } from 'react';
import {
  useWidgetsStore,
  type WidgetLifecycle,
} from '@tensaw/runtime';

import { Alert } from '../../feedback/Alert';
import { EmptyState } from '../../feedback/EmptyState';
import { Spinner } from '../../feedback/Spinner';
import { Button } from '../../primitives/Button';
import { cn } from '../../utils/cn';

const PADDING_CLASS = {
  none: '',
  sm: 'p-2',
  md: 'p-3',
  lg: 'p-4',
} as const;

export interface WidgetLifecycleContext {
  /** Required if `instanceId` is set. */
  widgetId: string;
  /** Required if `instanceId` is set. */
  containerId: string;
  /** Required if `instanceId` is set. */
  pageId: string;
}

export interface WidgetProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Top-right action slot (menu, refresh, etc). */
  actions?: ReactNode;
  loading?: boolean;
  error?: { message: string; onRetry?: () => void };
  empty?: { title: ReactNode; description?: ReactNode };
  padding?: keyof typeof PADDING_CLASS;
  children?: ReactNode;
  className?: string;

  /**
   * Opt-in platform widget-lifecycle integration. When set, the Widget
   * registers via `useWidgetsStore.registerWidget` on mount and reports
   * `mounting → mounted → unmounting` lifecycle states. Requires
   * `lifecycleContext` to also be provided.
   */
  instanceId?: string;
  /**
   * Required when `instanceId` is set. Carries the `widgetId`, `containerId`,
   * `pageId` that `registerWidget` needs.
   */
  lifecycleContext?: WidgetLifecycleContext;
}

export function Widget({
  title,
  subtitle,
  actions,
  loading,
  error,
  empty,
  padding = 'md',
  children,
  className,
  instanceId,
  lifecycleContext,
}: WidgetProps): JSX.Element {
  // Lifecycle integration when both instanceId and context are set.
  useWidgetLifecycle(instanceId, lifecycleContext, loading, error?.message);

  const showError = !!error;
  const showLoading = !showError && loading;
  const showEmpty = !showError && !showLoading && empty && !children;

  const headerVisible = title !== undefined || subtitle !== undefined || actions !== undefined;

  return (
    <section
      data-widget-instance-id={instanceId}
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {headerVisible && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-col gap-0.5">
            {title !== undefined && (
              <h3 className="text-sm font-semibold leading-tight">{title}</h3>
            )}
            {subtitle !== undefined && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn('flex flex-1 flex-col', PADDING_CLASS[padding])}>
        {showError ? (
          <Alert
            variant="error"
            description={error.message}
            action={
              error.onRetry ? (
                <Button size="sm" variant="outline" onClick={error.onRetry}>
                  Retry
                </Button>
              ) : undefined
            }
          />
        ) : showLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center py-8 text-muted-foreground"
          >
            <Spinner size="md" />
            <span className="ml-2 text-sm">Loading…</span>
          </div>
        ) : showEmpty ? (
          <EmptyState
            title={empty.title}
            {...(empty.description !== undefined
              ? { description: empty.description }
              : {})}
            size="sm"
          />
        ) : (
          children
        )}
      </div>
    </section>
  );
}
Widget.displayName = 'Widget';

/**
 * Side-effect hook that integrates with `useWidgetsStore` when both
 * `instanceId` and `lifecycleContext` are present. Mounts → register +
 * mounted; unmounts → unmounting + dispose; error toggles → set/clear.
 *
 * If `instanceId` is set but `lifecycleContext` is missing, this is a
 * misuse; we log once in dev and skip integration so the visual still
 * renders.
 */
function useWidgetLifecycle(
  instanceId: string | undefined,
  ctx: WidgetLifecycleContext | undefined,
  loading: boolean | undefined,
  errorMessage: string | undefined,
): void {
  const registerWidget = useWidgetsStore((s) => s.registerWidget);
  const setWidgetLifecycle = useWidgetsStore((s) => s.setWidgetLifecycle);
  const setWidgetError = useWidgetsStore((s) => s.setWidgetError);
  const clearWidgetError = useWidgetsStore((s) => s.clearWidgetError);
  const markWidgetDisposed = useWidgetsStore((s) => s.markWidgetDisposed);

  // Register + dispose
  useEffect(() => {
    if (!instanceId) return;
    if (!ctx) {
      if (typeof console !== 'undefined') {
         
        console.warn(
          `[Widget] instanceId="${instanceId}" set without lifecycleContext; skipping store integration.`,
        );
      }
      return;
    }
    registerWidget({
      instanceId,
      widgetId: ctx.widgetId,
      containerId: ctx.containerId,
      pageId: ctx.pageId,
    });
    setWidgetLifecycle({ instanceId, lifecycle: 'mounted' as WidgetLifecycle });
    return () => {
      setWidgetLifecycle({
        instanceId,
        lifecycle: 'unmounting' as WidgetLifecycle,
      });
      markWidgetDisposed(instanceId);
    };
    // ctx fields are intentionally read once at mount; instanceId is the key
    // identity. If callers change ctx between renders for the same
    // instanceId, that's a misuse — register-then-update isn't a use case
    // we need to support per F2.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  // Mirror error state into the store
  useEffect(() => {
    if (!instanceId || !ctx) return;
    if (errorMessage) {
      setWidgetError({
        instanceId,
        errorCode: 'WIDGET_RENDER_ERROR',
        errorMessage,
      });
    } else {
      clearWidgetError(instanceId);
    }
  }, [
    instanceId,
    ctx,
    errorMessage,
    setWidgetError,
    clearWidgetError,
  ]);

  // Loading is informational for now — we don't have a 'loading' lifecycle
  // state, so this is a no-op but kept in the signature so future
  // lifecycle expansions can pick it up without an API break.
  void loading;
}
