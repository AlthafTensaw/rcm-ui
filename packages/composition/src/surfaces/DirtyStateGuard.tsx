/**
 * DirtyStateGuard.
 *
 * Watches `dirtyState.pendingTransition` from the runtime. When non-null, a
 * context-changing event was blocked by one or more dirty widgets and is
 * waiting on user confirmation.
 *
 * The guard renders a modal asking: "You have unsaved changes. Discard or
 * stay?" — and:
 *
 *   - "Discard changes" → clears all dirty entries, clears pendingTransition,
 *     and dispatches the originally-blocked event so the workflow continues.
 *   - "Keep editing" → just clears pendingTransition. Widgets stay dirty,
 *     event is dropped.
 *
 * Mount it once near the top of the app (after Provider, alongside
 * SurfaceHost). It renders nothing when there is no pending transition.
 *
 * Note: the actual "block-the-event" logic lives in a runtime middleware that
 * isn't shipped yet — Phase 2 deferred. This component is the UI half;
 * wiring it to the runtime is two lines in the dirty-state middleware.
 */

import {
  buildEvent,
  publishEvent,
  useDirtyStateStore,
} from '@tensaw/runtime';
import { useEffect, useRef, type CSSProperties } from 'react';

export function DirtyStateGuard() {
  const pending = useDirtyStateStore((state) => state.pendingTransition);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the dialog when it appears.
  useEffect(() => {
    if (pending) dialogRef.current?.focus();
  }, [pending]);

  // Escape = stay (safer default — never lose work to a stray key).
  useEffect(() => {
    if (!pending) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleStay();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => { window.removeEventListener('keydown', onKeyDown); };
     
  }, [pending]);

  if (!pending) return null;

  function handleDiscard() {
    if (!pending) return;
    // Clear all dirty entries.
    useDirtyStateStore.getState().clearAllDirty();
    // Re-publish the originally-blocked event so the workflow continues.
    // We rebuild from the persisted pending data — the new event handlers
    // will see it. Clear pending first, then publish.
    const blockedName = pending.eventName;
    const blockedPayload = pending.payload as Record<string, unknown>;
    const correlationId = pending.correlationId;
    useDirtyStateStore.getState().clearPendingTransition();
    // The buildEvent type-checker requires a known event name. We cast
    // because the blocked event was already validated when it was first
    // dispatched. The typed contract for `buildEvent` requires a known
    // event name and matching payload shape; the cast is intentional and
    // we suppress both the `no-explicit-any` source and the downstream
    // `no-unsafe-argument` that flows into `publishEvent`.
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    publishEvent(
      buildEvent(blockedName as any, blockedPayload as any, {
        sourcePageId: 'platform',
        correlationId,
      }),
    );
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
  }

  function handleStay() {
    useDirtyStateStore.getState().clearPendingTransition();
  }

  const scrimStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'var(--tw-color-scrim, rgba(17, 24, 39, 0.55))',
    zIndex: 9000,
  };

  const dialogStyle: CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(420px, 90vw)',
    background: 'var(--tw-color-surface-raised, #FFFFFF)',
    borderRadius: 12,
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
    zIndex: 9001,
    padding: 20,
    fontFamily: 'system-ui, sans-serif',
    color: 'var(--tw-color-text-primary, #1F2937)',
    outline: 'none',
  };

  const titleStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
    marginBottom: 6,
  };

  const bodyStyle: CSSProperties = {
    fontSize: 13,
    color: 'var(--tw-color-text-secondary, #4B5563)',
    lineHeight: 1.5,
    margin: 0,
    marginBottom: 16,
  };

  const buttonRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  };

  const buttonStyle = (variant: 'primary' | 'danger' | 'ghost'): CSSProperties => {
    const base: CSSProperties = {
      border: 'none',
      borderRadius: 6,
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
    };
    if (variant === 'primary') {
      return {
        ...base,
        background: 'var(--tw-color-brand-primary, #14B8A6)',
        color: 'white',
      };
    }
    if (variant === 'danger') {
      return {
        ...base,
        background: 'var(--tw-color-status-danger-fg, #DC2626)',
        color: 'white',
      };
    }
    return {
      ...base,
      background: 'transparent',
      color: 'var(--tw-color-text-primary, #1F2937)',
      border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    };
  };

  return (
    <>
      <div style={scrimStyle} onClick={handleStay} aria-hidden />
      <div
        ref={dialogRef}
        style={dialogStyle}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dirty-guard-title"
        tabIndex={-1}
      >
        <h2 id="dirty-guard-title" style={titleStyle}>
          You have unsaved changes
        </h2>
        <p style={bodyStyle}>
          You have unsaved changes that will be lost if you continue. Do you want
          to discard them?
        </p>
        <div style={buttonRowStyle}>
          <button type="button" style={buttonStyle('ghost')} onClick={handleStay}>
            Keep editing
          </button>
          <button type="button" style={buttonStyle('danger')} onClick={handleDiscard}>
            Discard changes
          </button>
        </div>
      </div>
    </>
  );
}
