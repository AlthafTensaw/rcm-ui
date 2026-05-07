/**
 * Bulk-retry modal — Phase B slice 2.
 *
 * Two phases, controlled by local state:
 *
 *   1. Confirm: shows the selected cases (case_id + case_type + state),
 *      a required reason field (10..1000 chars), and a "Retry N cases"
 *      submit button. First 10 cases are listed with "+N more" if the
 *      selection is larger (per kickoff Open Question 5 decision).
 *
 *   2. Results (only on partial-success or all-failed): switches the
 *      modal body to a per-case results table with friendly error code
 *      labels. The success path closes the modal directly; the
 *      partial/all-failed path holds the modal open so the operator can
 *      review before dismissing.
 *
 * Per kickoff Open Question 4 decision:
 *   - all-success → success toast, close modal (no results view)
 *   - partial    → warning toast + results view stays open until dismissed
 *   - all-failed → error toast + results view stays open
 *
 * Cache invalidation for `admin.stuck-cases` and friends is wired by
 * Phase A's pre-declared `cache.invalidatedBy` arrays — see
 * `actions/index.ts` (slice 2 added `admin.bulk-retry-cases` to the
 * same 5-query set that single-retry invalidates).
 */
import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  Form,
  FormError,
  FormField,
  Textarea,
} from '@tensaw/design-system';
import { useActionMutation } from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

import {
  BULK_RETRY_ERROR_LABELS,
  BulkRetryRequestSchema,
  type BulkRetryItem,
  type BulkRetryRequest,
  type BulkRetryResponse,
  type StuckCaseRow,
} from '../../actions/schemas';

/** How many selected cases to render before collapsing to "+N more". */
const PREVIEW_LIMIT = 10;

export interface BulkRetryModalProps {
  /**
   * Selected stuck cases, in selection order. The modal renders up to
   * the first PREVIEW_LIMIT and references the rest as a count.
   */
  selectedCases: readonly StuckCaseRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called with the response when the mutation completes (regardless of
   * partial-success). The parent typically clears the multi-select state
   * here. NOT called for transport-level failures.
   */
  onSuccess?: (data: BulkRetryResponse) => void;
}

interface BulkRetryFormShape {
  reason: string;
}

/**
 * Friendly summary row for one failure in the results view.
 */
function ResultsRow({ item }: { item: BulkRetryItem }) {
  const label = item.error_code
    ? BULK_RETRY_ERROR_LABELS[item.error_code]
    : 'Failed';
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs">{item.case_id}</div>
        {item.error_message ? (
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.error_message}
          </div>
        ) : null}
      </div>
      <Badge variant="warning" className="shrink-0 text-[10px]">
        {label}
      </Badge>
    </li>
  );
}

export function BulkRetryModal({
  selectedCases,
  open,
  onOpenChange,
  onSuccess,
}: BulkRetryModalProps): JSX.Element {
  const [fire, { isLoading }] = useActionMutation<
    BulkRetryRequest,
    BulkRetryResponse
  >('admin.bulk-retry-cases');
  const pushToast = useNotificationsStore((s) => s.pushToast);
  const [results, setResults] = useState<BulkRetryResponse | null>(null);

  const total = selectedCases.length;
  const previewCases = selectedCases.slice(0, PREVIEW_LIMIT);
  const overflowCount = total - previewCases.length;

  function handleClose(next: boolean) {
    if (isLoading) return;
    onOpenChange(next);
    // Clear results when the modal closes so a re-open starts fresh.
    if (!next) setResults(null);
  }

  async function handleSubmit(values: BulkRetryFormShape): Promise<void> {
    // Dedup case_ids before sending — backend defends against missed
    // dedup with DUPLICATE_IN_BATCH but treats the first occurrence
    // normally. Frontend dedup keeps the request honest.
    const uniqueIds = Array.from(
      new Set(selectedCases.map((c) => c.case_id)),
    );

    const candidate: BulkRetryRequest = {
      case_ids: uniqueIds,
      reason: values.reason,
    };
    const parsed = BulkRetryRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      pushToast({
        toastId: `bulk-retry-validation-${Date.now()}`,
        severity: 'error',
        title: 'Invalid input',
        body: parsed.error.issues[0]?.message ?? 'Validation failed',
      });
      return;
    }

    const result = await fire(parsed.data);
    if (!result.ok) {
      pushToast({
        toastId: `bulk-retry-error-${Date.now()}`,
        severity: 'error',
        title: 'Bulk retry failed',
        body: result.error.message,
      });
      return;
    }

    const { summary } = result.data;
    onSuccess?.(result.data);

    if (summary.failed === 0) {
      // All-success: toast + close. No results view.
      pushToast({
        toastId: `bulk-retry-success-${Date.now()}`,
        severity: 'success',
        title: `Retried ${summary.succeeded} case${
          summary.succeeded === 1 ? '' : 's'
        } successfully`,
      });
      handleClose(false);
      return;
    }

    if (summary.succeeded === 0) {
      // All-failed: error toast + hold the modal open with results.
      pushToast({
        toastId: `bulk-retry-failed-${Date.now()}`,
        severity: 'error',
        title: 'Bulk retry failed',
        body: `${summary.failed} case${
          summary.failed === 1 ? '' : 's'
        } could not be retried.`,
      });
      setResults(result.data);
      return;
    }

    // Partial-success: warning toast + show results view so operator can
    // review the failed subset.
    pushToast({
      toastId: `bulk-retry-partial-${Date.now()}`,
      severity: 'warning',
      title: `Retried ${summary.succeeded} of ${summary.total} cases`,
      body: `${summary.failed} failed. See details in the modal.`,
    });
    setResults(result.data);
  }

  // Branch: results view (post-submit, partial or all-failed) vs.
  // confirm view (pre-submit). The dialog title shifts between phases
  // so the heading reflects what the user is looking at.

  if (results !== null) {
    const failures = results.items.filter((it) => it.status === 'failed');
    const summary = results.summary;
    const allFailed = summary.succeeded === 0;
    return (
      <Dialog
        open={open}
        onOpenChange={handleClose}
        title={allFailed ? 'Bulk retry — all failed' : 'Bulk retry — partial success'}
        description={
          allFailed
            ? `${summary.failed} of ${summary.total} cases could not be retried. Review the per-case errors below.`
            : `${summary.succeeded} of ${summary.total} cases retried successfully. ${summary.failed} failed; per-case errors below.`
        }
        size="md"
      >
        <Alert
          variant={allFailed ? 'error' : 'warning'}
          title={
            allFailed
              ? 'No cases retried'
              : `${summary.succeeded} of ${summary.total} succeeded`
          }
          description={`Correlation id: ${results.correlation_id}`}
        />
        <ul className="mt-3 max-h-72 overflow-y-auto rounded-md border border-border px-3">
          {failures.map((item) => (
            <ResultsRow key={item.case_id} item={item} />
          ))}
        </ul>
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => { handleClose(false); }}>
            Close
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={`Retry ${total} case${total === 1 ? '' : 's'}`}
      description="Re-arm the selected cases. Each case is retried independently; partial success is possible."
      size="md"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <Form<BulkRetryFormShape>
        schema={BulkRetryRequestSchema.pick({ reason: true })}
        defaultValues={{ reason: '' }}
        onSubmit={handleSubmit}
      >
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
            Selected cases
          </div>
          <ul className="space-y-1.5">
            {previewCases.map((c) => (
              <li
                key={c.case_id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <span className="font-mono text-xs">{c.case_id}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {c.case_type}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {c.state_code}
                </Badge>
              </li>
            ))}
          </ul>
          {overflowCount > 0 ? (
            <div className="mt-2 text-xs italic text-muted-foreground">
              + {overflowCount} more case{overflowCount === 1 ? '' : 's'}
            </div>
          ) : null}
        </div>

        <FormField
          name="reason"
          label="Reason"
          required
          helperText="10–1000 characters. Stored in the audit log on every retried case."
        >
          {({ value, onChange, onBlur, error }) => (
            <Textarea
              id="bulk-retry-reason"
              rows={4}
              placeholder="e.g., Underlying handler v3.5 patch deployed; clearing the residual backlog."
              value={value as string}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onBlur={onBlur}
              error={Boolean(error)}
              aria-label="Bulk retry reason"
            />
          )}
        </FormField>
        <FormError />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { handleClose(false); }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isLoading} disabled={isLoading}>
            Retry {total} case{total === 1 ? '' : 's'}
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
