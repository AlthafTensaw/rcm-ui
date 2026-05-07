/**
 * ConfirmDialog — "Are you sure?" prompt.
 *
 * A specialized Dialog with a built-in confirm + cancel footer. When
 * `onConfirm` returns a promise, the confirm button enters its loading
 * state automatically until the promise settles (caller can override with
 * the explicit `loading` prop). The dialog stays open during pending
 * confirms so the user sees progress; on success it closes.
 *
 * `variant: 'destructive'` styles the confirm button in destructive red —
 * use it for irreversible actions ("Delete claim?", "Withdraw appeal?").
 */
import { useState, type ReactNode } from 'react';

import { Button } from '../../primitives/Button';
import { Dialog } from '../Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  /** Override automatic pending tracking. */
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading: loadingProp,
}: ConfirmDialogProps): JSX.Element {
  const [pending, setPending] = useState(false);
  const isLoading = loadingProp ?? pending;

  async function handleConfirm() {
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setPending(true);
        await result;
      }
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  function handleCancel() {
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && isLoading) return; // block close while pending
        onOpenChange(o);
      }}
      title={title}
      description={description}
      closeOnEscape={!isLoading}
      closeOnOverlayClick={!isLoading}
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            loading={isLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {/* Body intentionally empty — title + description carry the message. */}
      <span aria-hidden="true" />
    </Dialog>
  );
}
ConfirmDialog.displayName = 'ConfirmDialog';
