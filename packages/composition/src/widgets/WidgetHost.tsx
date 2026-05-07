/**
 * WidgetHost — the most important platform component.
 *
 * Resolves a WidgetEntry into a rendered widget. Responsibilities:
 *
 *   1. Component resolution.
 *      - If entry.component is set, use it directly (escape hatch).
 *      - Otherwise look up entry.widgetId in the widget registry.
 *      - If neither resolves, render an ErrorState ("widget not registered").
 *
 *   2. Permission gate.
 *      - Permission key resolved in priority order:
 *          entry.permission || registration.defaultPermission || none
 *      - If a key is required and the user lacks it, render
 *        <PermissionDeniedState> and DO NOT mount the widget.
 *
 *   3. Lifecycle.
 *      - On mount: dispatches widgets/registerWidget with instanceId, widgetId,
 *        containerId, pageId.
 *      - On unmount: dispatches widgets/markWidgetDisposed.
 *      - The runtime's widgetsSlice + cross-slice listeners take care of
 *        cleanup (dirty state entry, owned surfaces).
 *
 *   4. Error boundary.
 *      - A widget that throws renders <ErrorState> instead of crashing the
 *        whole page.
 *
 * Loading and empty states are NOT rendered by the host; widgets render their
 * own loading/empty states because they own the data fetch. The host shows
 * only mounting/error/permission-denied lifecycle states.
 */

import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
} from 'react';
import {
  useAuthStore,
  useWidgetsStore,
} from '@tensaw/runtime';
import { getWidgetRegistration } from '../registry/widgetRegistry';
import { ErrorState, PermissionDeniedState } from '../states';
import type { WidgetEntry, WidgetProps } from '../types';

export interface WidgetHostProps {
  entry: WidgetEntry;
  containerId: string;
  pageId: string;
}

export function WidgetHost({ entry, containerId, pageId }: WidgetHostProps) {
  const registration = useMemo(
    () => getWidgetRegistration(entry.widgetId),
    [entry.widgetId],
  );

  const Component: ComponentType<WidgetProps> | undefined =
    entry.component ?? registration?.component;

  const requiredPermission =
    entry.permission ?? registration?.defaultPermission ?? null;

  const userPermissions = useAuthStore(
    (state) => state.user?.permissions ?? [],
  );

  const hasPermission =
    requiredPermission === null || userPermissions.includes(requiredPermission);

  // Lifecycle registration. Effect runs on mount and cleans up on unmount.
  useEffect(() => {
    if (!Component || !hasPermission) return;
    useWidgetsStore.getState().registerWidget({
      instanceId: entry.instanceId,
      widgetId: entry.widgetId,
      containerId,
      pageId,
    });
    return () => {
      useWidgetsStore.getState().markWidgetDisposed(entry.instanceId);
    };
  }, [Component, hasPermission, entry.instanceId, entry.widgetId, containerId, pageId]);

  // Resolution failure → ErrorState.
  if (!Component) {
    return (
      <ErrorState
        title="Widget not available"
        body={`No component registered for widget "${entry.widgetId}". Either register it via registerWidget(), or pass a direct component reference in the manifest.`}
        errorCode="WIDGET_NOT_REGISTERED"
        compact
      />
    );
  }

  // Permission denied → PermissionDeniedState. By this point requiredPermission
  // is narrowed to `string` (the `null` case satisfies hasPermission above).
  if (!hasPermission) {
    return (
      <PermissionDeniedState
        missingPermission={requiredPermission}
        compact
      />
    );
  }

  // All good — render the widget inside an error boundary.
  const widgetProps: WidgetProps = {
    instanceId: entry.instanceId,
    widgetId: entry.widgetId,
    containerId,
    pageId,
    staticProps: entry.props ?? {},
  };

  return (
    <WidgetErrorBoundary
      instanceId={entry.instanceId}
      widgetId={entry.widgetId}
    >
      <Component {...widgetProps} />
    </WidgetErrorBoundary>
  );
}

// ---------------------------------------------------------------------------

/**
 * Per-widget error boundary. A widget that throws during render will render
 * <ErrorState> instead of crashing the whole page. The error is dispatched
 * to widgetsSlice so the runtime audit/telemetry path sees it.
 */
class WidgetErrorBoundaryInner extends Component<
  {
    instanceId: string;
    widgetId: string;
    onError: (errorCode: string, errorMessage: string) => void;
    children: ReactNode;
  },
  { hasError: boolean; errorMessage: string }
> {
  override state = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, errorMessage: message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
     
    console.error(`[WidgetHost] Widget "${this.props.widgetId}" threw:`, error, info);
    this.props.onError('WIDGET_RENDER_ERROR', error.message);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="This widget failed to render"
          body={this.state.errorMessage || 'An unexpected error occurred.'}
          errorCode="WIDGET_RENDER_ERROR"
          compact
        />
      );
    }
    return this.props.children;
  }
}

function WidgetErrorBoundary({
  instanceId,
  widgetId,
  children,
}: {
  instanceId: string;
  widgetId: string;
  children: ReactNode;
}) {
  return (
    <WidgetErrorBoundaryInner
      instanceId={instanceId}
      widgetId={widgetId}
      onError={(errorCode, errorMessage) => {
        useWidgetsStore.getState().setWidgetError({
          instanceId,
          errorCode,
          errorMessage,
        });
      }}
    >
      {children}
    </WidgetErrorBoundaryInner>
  );
}
