/**
 * Close case modal — Phase B Tier 2.
 *
 * Dispatches `admin.close-case` (POST /v1/admin/cases/{id}/close). Collects:
 *   - `close_reason_code` (required, one of 5 enum values per spec §3.4)
 *   - `reason` (required, 10..1000 chars)
 *
 * Per ADR-OC-3, close does NOT change `state_code` — the closed-vs-open
 * indicator is `closed_at IS NOT NULL`. The `close_reason_code` is stored
 * in `last_error_code` (column reuse documented in spec §3.4 / handback).
 *
 * Visually emphasized (destructive variant on the confirm button) because
 * close is one-way per ADR-OC-3 and policy puts it behind the senior
 * reviewer permission (BRD §3.8).
 */
import { useState } from 'react';
import {
  Button,
  Dialog,
  Form,
  FormError,
  FormField,
  Select,
  Textarea,
} from '@tensaw/design-system';
import { dispatchAction } from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

import {
  CloseCaseRequestSchema,
  CLOSE_REASON_CODES,
  CLOSE_REASON_LABELS,
  type CloseCaseRequest,
  type CloseCaseResponse,
  type CloseReasonCode,
} from '../../actions/schemas';

export interface CloseCaseModalProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: CloseCaseResponse) => void;
}

const CLOSE_REASON_OPTIONS = CLOSE_REASON_CODES.map((code) => ({
  value: code,
  label: CLOSE_REASON_LABELS[code],
}));

export function CloseCaseModal({
  caseId,
  open,
  onOpenChange,
  onSuccess,
}: CloseCaseModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  async function handleSubmit(values: CloseCaseRequest): Promise<void> {
    setSubmitting(true);
    try {
      const result = await dispatchAction<CloseCaseResponse>(
        'admin.close-case',
        { ...values, case_id: caseId },
      );
      if (result.ok) {
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        const err = result.error;
        pushToast({
          toastId: `close-error-${Date.now()}`,
          severity: 'error',
          title: 'Close failed',
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
      title="Close case"
      description="Permanently close this case. The state code is preserved for forensics; closed_at is set so the case no longer advances."
      size="md"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <Form<CloseCaseRequest>
        schema={CloseCaseRequestSchema}
        defaultValues={{
          case_id: caseId,
          close_reason_code: 'MANUAL_CLOSE_OPS',
          reason: '',
        }}
        onSubmit={handleSubmit}
      >
        <FormField name="close_reason_code" label="Close reason" required>
          {({ value, onChange, error }) => (
            <Select<CloseReasonCode>
              id="close-reason-code"
              value={(value as CloseReasonCode | null) ?? null}
              onValueChange={(next) => {
                onChange(next);
              }}
              options={CLOSE_REASON_OPTIONS}
              placeholder="Select a reason"
              error={Boolean(error)}
              aria-label="Close reason code"
            />
          )}
        </FormField>
        <FormField
          name="reason"
          label="Notes"
          required
          helperText="10–1000 characters. Stored in the audit log."
        >
          {({ value, onChange, onBlur, error }) => (
            <Textarea
              id="close-reason"
              rows={4}
              placeholder="e.g., Customer withdrew the appeal request via phone call 2026-05-03"
              value={value as string}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onBlur={onBlur}
              error={Boolean(error)}
              aria-label="Close reason notes"
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
          <Button
            type="submit"
            variant="destructive"
            loading={submitting}
            disabled={submitting}
          >
            Close case
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
