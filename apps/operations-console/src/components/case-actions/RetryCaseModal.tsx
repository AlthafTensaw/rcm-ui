/**
 * Retry case modal — Phase B Tier 2.
 *
 * Dispatches `admin.retry-case` (POST /v1/admin/cases/{id}/retry).
 * Collects a reason string (10..1000 chars per backend v0.1.2 spec §3.3).
 *
 * Layout: Dialog with title + descriptive blurb, Form inside with a single
 * required Textarea for `reason`, footer with Cancel + Retry buttons. Submit
 * shows a spinner; the dialog stays open on error so the user can fix and
 * retry. On success: toast (declared on the action), modal closes, parent
 * `onSuccess` fires (we use it on Case Detail to keep the user on the page;
 * TanStack Query auto-refetches via Phase A's pre-wired `invalidatedBy`).
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
  RetryCaseRequestSchema,
  type RetryCaseRequest,
  type RetryCaseResponse,
} from '../../actions/schemas';

export interface RetryCaseModalProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: RetryCaseResponse) => void;
}

export function RetryCaseModal({
  caseId,
  open,
  onOpenChange,
  onSuccess,
}: RetryCaseModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  async function handleSubmit(values: RetryCaseRequest): Promise<void> {
    setSubmitting(true);
    try {
      const result = await dispatchAction<RetryCaseResponse>(
        'admin.retry-case',
        // The form's case_id is from the page; we set it as the default below.
        { ...values, case_id: caseId },
      );
      if (result.ok) {
        // The action's onSuccess.toast also fires via the dispatcher; we
        // call onSuccess for parent-driven cleanup (modal close, etc.)
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        // Surface error inline. The dispatcher's onError.toast policy already
        // pushed an error toast; we just need to keep the modal open.
        const err = result.error;
        pushToast({
          toastId: `retry-error-${Date.now()}`,
          severity: 'error',
          title: 'Retry failed',
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
      title="Retry case"
      description="Re-arm this case so the engine takes another swing on the current task. The attempt counter is preserved."
      size="md"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <Form<RetryCaseRequest>
        schema={RetryCaseRequestSchema}
        defaultValues={{ case_id: caseId, reason: '' }}
        onSubmit={handleSubmit}
      >
        <FormField
          name="reason"
          label="Reason"
          required
          helperText="10–1000 characters. Stored in the audit log."
        >
          {({ value, onChange, onBlur, error }) => (
            <Textarea
              id="retry-reason"
              rows={4}
              placeholder="e.g., Underlying PHI redaction issue fixed in upstream skill v3.5"
              value={value as string}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onBlur={onBlur}
              error={Boolean(error)}
              aria-label="Retry reason"
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
            Retry
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
