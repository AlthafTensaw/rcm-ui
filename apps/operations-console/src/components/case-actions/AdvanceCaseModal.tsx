/**
 * Force-advance modal — Phase B Tier 2.
 *
 * Dispatches `admin.advance-case` (POST /v1/cases/{id}/advance). Reason is
 * optional per spec; when provided it must still be 10..1000 chars.
 *
 * NOTE the path: this is the v0.1.0-carryover endpoint at the case CRUD
 * path (`/v1/cases/...`), NOT the admin path (`/v1/admin/cases/...`).
 * The semantics are the same: move the case one state forward in the
 * workflow's state machine, bypassing the polling cadence.
 */
import { useState } from 'react';
import {
  Button,
  Dialog,
  Form,
  FormError,
  FormField,
  Textarea,
} from '@tensaw/design-system';
import { dispatchAction } from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

import {
  AdvanceCaseRequestSchema,
  type AdvanceCaseRequest,
  type AdvanceCaseResponse,
} from '../../actions/schemas';

export interface AdvanceCaseModalProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: AdvanceCaseResponse) => void;
}

export function AdvanceCaseModal({
  caseId,
  open,
  onOpenChange,
  onSuccess,
}: AdvanceCaseModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  async function handleSubmit(values: AdvanceCaseRequest): Promise<void> {
    setSubmitting(true);
    try {
      // The Zod schema treats an empty string as "missing optional field"
      // is NOT correct — empty strings would fail the .min(10) on optional.
      // Strip empty reason to undefined before dispatch so the backend
      // sees no field, not a too-short string.
      const reason =
        values.reason && values.reason.trim().length > 0
          ? values.reason
          : undefined;
      const payload: AdvanceCaseRequest = { case_id: caseId };
      if (reason !== undefined) payload.reason = reason;
      const result = await dispatchAction<AdvanceCaseResponse>(
        'admin.advance-case',
        payload,
      );
      if (result.ok) {
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        const err = result.error;
        pushToast({
          toastId: `advance-error-${Date.now()}`,
          severity: 'error',
          title: 'Force-advance failed',
          body: err.message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
      title="Force-advance case"
      description="Move this case to its next state synchronously, bypassing the polling cadence. Reason is optional but recommended."
      size="md"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <Form<AdvanceCaseRequest>
        schema={AdvanceCaseRequestSchema}
        defaultValues={{ case_id: caseId, reason: '' }}
        onSubmit={handleSubmit}
      >
        <FormField
          name="reason"
          label="Reason (optional)"
          helperText="If provided: 10–1000 characters."
        >
          {({ value, onChange, onBlur, error }) => (
            <Textarea
              id="advance-reason"
              rows={3}
              placeholder="e.g., Manual nudge after engineer confirmed downstream readiness"
              value={(value as string | undefined) ?? ''}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onBlur={onBlur}
              error={Boolean(error)}
              aria-label="Advance reason"
            />
          )}
        </FormField>
        <FormError />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { onOpenChange(false); }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={submitting}>
            Force-advance
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
