/**
 * SurfaceHost.
 *
 * Single root-level renderer for every modal, drawer, popup, fax composer,
 * email composer, and assistant pane. Mount it once near the top of the app
 * (after ThemeProvider, inside Provider).
 *
 * Surfaces are pushed onto the surfacesSlice stack via openSurface(). The
 * SurfaceHost subscribes to that slice and renders each surface in z-order —
 * the topmost surface gets the focus trap and Escape-to-close. Background
 * surfaces stay rendered (with their state preserved) but inert.
 *
 * Components that surfaces render are looked up in the same widget registry,
 * keyed by SurfaceInstance.componentId. This keeps surfaces and widgets on a
 * single resolution path — and means any registered widget can be opened as
 * a modal without extra wiring.
 *
 * Auto-cleanup: when a widget is disposed (unmounted), the surfacesSlice
 * extraReducer for markWidgetDisposed already prunes any surfaces that the
 * widget owned. SurfaceHost just renders whatever's on the stack.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import {
  useSurfacesStore,
  type SurfaceInstance,
  type SurfaceKind,
} from '@tensaw/runtime';
import { getWidgetRegistration } from '../registry/widgetRegistry';
import { ErrorState } from '../states';

export function SurfaceHost() {
  const stack = useSurfacesStore((state) => state.stack);

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((surface, idx) => (
        <SurfaceRenderer
          key={surface.surfaceId}
          surface={surface}
          isTop={idx === stack.length - 1}
          stackIndex={idx}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------

interface SurfaceRendererProps {
  surface: SurfaceInstance;
  isTop: boolean;
  stackIndex: number;
}

function SurfaceRenderer({ surface, isTop, stackIndex }: SurfaceRendererProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const registration = getWidgetRegistration(surface.componentId);

  // Lock background scroll while ANY surface is open. (We compute on stackIndex
  // so this effect runs the body-class-modify exactly once at index 0 and once
  // at unmount.)
  useEffect(() => {
    if (stackIndex !== 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [stackIndex]);

  // Focus management for the topmost surface: capture previous focus, focus
  // the dialog, restore on close.
  useEffect(() => {
    if (!isTop) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const focusedElement = previouslyFocusedRef.current;
    return () => {
      if (focusedElement && typeof focusedElement.focus === 'function') {
        focusedElement.focus();
      }
    };
  }, [isTop]);

  // Escape to close (topmost only).
  useEffect(() => {
    if (!isTop) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        useSurfacesStore.getState().closeSurface(surface.surfaceId);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); };
  }, [isTop, surface.surfaceId]);

  function handleClose() {
    useSurfacesStore.getState().closeSurface(surface.surfaceId);
  }

  // Resolve the component to render inside the surface frame.
  const Component = registration?.component;

  let inner: ReactNode;
  if (!Component) {
    inner = (
      <ErrorState
        title="Surface component not registered"
        body={`No component registered for "${surface.componentId}". Register it via registerWidget() to use it as a surface.`}
        errorCode="SURFACE_NOT_REGISTERED"
      />
    );
  } else {
    // Surfaces receive props directly from openSurface(props). They aren't
    // widgets in the strict sense (no instanceId), so we pass a synthetic
    // surface-scoped props object.
    inner = (
      <Component
        instanceId={surface.surfaceId}
        widgetId={surface.componentId}
        containerId="__surface__"
        pageId="__surface__"
        staticProps={{
          ...surface.props,
          /** Surface components can call this to dismiss themselves. */
          onClose: handleClose,
        }}
      />
    );
  }

  // Render appropriate frame chrome based on surface kind.
  return (
    <SurfaceFrame
      kind={surface.kind}
      isTop={isTop}
      stackIndex={stackIndex}
      onScrimClick={handleClose}
      dialogRef={dialogRef}
    >
      {inner}
    </SurfaceFrame>
  );
}

// ---------------------------------------------------------------------------

interface SurfaceFrameProps {
  kind: SurfaceKind;
  isTop: boolean;
  stackIndex: number;
  onScrimClick: () => void;
  dialogRef: React.RefObject<HTMLDivElement>;
  children: ReactNode;
}

function SurfaceFrame({ kind, isTop, stackIndex, onScrimClick, dialogRef, children }: SurfaceFrameProps) {
  const baseZ = 1000 + stackIndex * 10;

  const scrimStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--tw-color-scrim, rgba(17, 24, 39, 0.55))',
    zIndex: baseZ,
    opacity: isTop ? 1 : 0.6,
    transition: 'opacity 120ms ease',
  };

  const dialogBaseStyle: CSSProperties = {
    position: 'fixed',
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.18)',
    zIndex: baseZ + 1,
    pointerEvents: isTop ? 'auto' : 'none',
    fontFamily: 'system-ui, sans-serif',
    color: 'var(--tw-color-text-primary, #1F2937)',
    overflow: 'auto',
    outline: 'none',
  };

  let dialogStyle: CSSProperties;
  switch (kind) {
    case 'modal':
      dialogStyle = {
        ...dialogBaseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: 360,
        maxWidth: 'min(720px, 92vw)',
        maxHeight: '85vh',
        borderRadius: 12,
      };
      break;
    case 'drawer':
      dialogStyle = {
        ...dialogBaseStyle,
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(560px, 90vw)',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
      };
      break;
    case 'fax':
    case 'email':
    case 'assistant':
      // Right-docked tall pane — wider than a drawer, used for compose/chat surfaces.
      dialogStyle = {
        ...dialogBaseStyle,
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(640px, 92vw)',
      };
      break;
    case 'popup':
    default:
      // Generic centered popup — smaller than a modal, no scrim.
      dialogStyle = {
        ...dialogBaseStyle,
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        minWidth: 280,
        maxWidth: 'min(420px, 90vw)',
        borderRadius: 10,
      };
      break;
  }

  const showScrim = kind !== 'popup';

  return (
    <>
      {showScrim ? (
        <div
          style={scrimStyle}
          onClick={onScrimClick}
          aria-hidden
        />
      ) : null}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal={isTop}
        tabIndex={-1}
        style={dialogStyle}
      >
        {children}
      </div>
    </>
  );
}
