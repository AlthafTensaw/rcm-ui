/**
 * Stuck Cases — operations triage dashboard.
 *
 * Per frontend tech spec §5.4 + BRD §2.4 wireframes.
 *
 * Cases group by `stuck_reason` (fatal_error / max_attempts / overdue).
 * Each group is an Accordion section (default-open) listing the cards.
 * Card click → navigate to Case Detail.
 *
 * Empty state has positive framing: "Workflows are running smoothly."
 *
 * Note: this screen is one of the auth-widening targets — backend
 * Phase A widened `GET /v1/admin/stuck-cases` from ALL_ADMIN_ROLES to
 * CONSOLE_READ_ROLES so all read-capable users (including CLINIC_*)
 * can reach it.
 *
 * Slice 2 additions: when the user holds `console.retry` permission,
 * each card row gains a checkbox for multi-select, the page header
 * shows a "Select all visible" control, and a "Retry selected (N)"
 * button appears once at least one case is checked. Clicking it
 * opens `BulkRetryModal`. Per kickoff Open Question 3 decision,
 * select-all is visible-only — paginated select-all is confusing
 * UX and the bulk-retry max is 100 anyway. Users without
 * `console.retry` see the original read-only layout unchanged.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';

import { useActionQuery } from '@tensaw/actions';
import { useAuthStore } from '@tensaw/runtime';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  Skeleton,
} from '@tensaw/design-system';

import type {
  StuckCaseRow,
  StuckCasesResponse,
} from '../../actions/schemas';
import { BulkRetryModal } from '../../components/case-actions/BulkRetryModal';

const REASON_LABELS: Record<string, string> = {
  fatal_error: 'Fatal error',
  max_attempts: 'Max attempts exhausted',
  overdue: 'Overdue (no recent activity)',
};

const REASON_ORDER = ['fatal_error', 'max_attempts', 'overdue'];

function ReasonIcon({ reason }: { reason: string }) {
  switch (reason) {
    case 'fatal_error':
      return <XCircle size={18} className="text-red-600" />;
    case 'max_attempts':
      return <AlertTriangle size={18} className="text-amber-600" />;
    case 'overdue':
      return <Clock size={18} className="text-orange-600" />;
    default:
      return <AlertTriangle size={18} className="text-muted-foreground" />;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function StuckCasesPage() {
  const { data, isLoading, error } = useActionQuery<StuckCasesResponse>(
    'admin.stuck-cases',
    { limit: 200 },
  );

  // Permission gate for the multi-select column. Hide-don't-disable per
  // slice 1's pattern (kickoff §"Open questions" item 1).
  const canBulkRetry = useAuthStore((s) =>
    (s.user?.permissions ?? []).includes('console.retry'),
  );

  // Selection state — flat Set keyed by case_id. Cleared on every load
  // because case_ids could disappear from the response (case progressed
  // out of stuck state mid-session).
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Memoize the selected rows so passing them to the modal is stable.
  // MUST be declared before any conditional `return` below — React
  // requires hooks to be called in the same order every render. The
  // intermediate `items` const is also memoized so the `useMemo` below
  // sees a stable array identity across renders where `data` didn't
  // change (otherwise `data?.items ?? []` allocates a fresh empty array
  // every render and defeats the memoization).
  const items = useMemo(() => data?.items ?? [], [data]);
  const selectedRows = useMemo(() => {
    if (selected.size === 0) return [] as StuckCaseRow[];
    return items.filter((r) => selected.has(r.case_id));
  }, [items, selected]);

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stuck cases</h1>
        <Alert
          variant="error"
          title="Failed to load stuck cases"
          description={error.message}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stuck cases</h1>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const total = data?.total ?? 0;

  if (total === 0) {
    return (
      <div className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Stuck cases</h1>
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<CheckCircle size={32} className="text-green-600" />}
              title="No stuck cases"
              description="Workflows are running smoothly."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group by stuck_reason
  const groups = new Map<string, StuckCaseRow[]>();
  for (const r of items) {
    const reason = r.stuck_reason || 'overdue';
    const existing = groups.get(reason);
    if (existing) {
      existing.push(r);
    } else {
      groups.set(reason, [r]);
    }
  }

  // Order groups deterministically by REASON_ORDER, then alpha for any
  // unknown reasons.
  const orderedReasons = [
    ...REASON_ORDER.filter((r) => groups.has(r)),
    ...[...groups.keys()]
      .filter((r) => !REASON_ORDER.includes(r))
      .sort(),
  ];

  // ---- Selection helpers (only when canBulkRetry) ----
  const visibleCaseIds = items.map((r) => r.case_id);
  const allVisibleSelected =
    visibleCaseIds.length > 0 &&
    visibleCaseIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleCaseIds.some((id) => selected.has(id));

  function toggleOne(caseId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(caseId)) next.delete(caseId);
      else next.add(caseId);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        // Clear only the visible subset; preserve any selections that
        // somehow live outside the current page (defensive — visibility
        // and selection align in this page today).
        const next = new Set(prev);
        for (const id of visibleCaseIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleCaseIds) next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // Selection cap matches the backend (1..100 per request). Beyond 100,
  // the submit button surfaces a hint instead of dispatching.
  const selectedCount = selected.size;
  const exceedsBatchMax = selectedCount > 100;

  return (
    <div className="space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Stuck cases</h1>
        <p className="text-sm text-muted-foreground">
          {total} case{total === 1 ? '' : 's'} need attention.
        </p>
      </header>

      {canBulkRetry ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
          data-testid="stuck-cases-bulk-bar"
        >
          <label
            className="flex items-center gap-2 text-sm"
            title="Selects only the cases visible on this page (capped at 100)."
          >
            <Checkbox
              aria-label="Select all visible stuck cases"
              checked={allVisibleSelected}
              onCheckedChange={toggleAllVisible}
            />
            <span>
              {allVisibleSelected
                ? 'All visible selected'
                : someVisibleSelected
                  ? `${selectedCount} selected`
                  : 'Select all visible'}
            </span>
          </label>
          {selectedCount > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">
                {exceedsBatchMax
                  ? 'Limit: 100 cases per bulk retry.'
                  : `${selectedCount} ready to retry.`}
              </span>
              <div className="ml-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={exceedsBatchMax}
                  onClick={() => { setBulkModalOpen(true); }}
                >
                  Retry selected ({selectedCount})
                </Button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <Accordion type="multiple" defaultValue={orderedReasons}>
        {orderedReasons.map((reason) => {
          const rows = groups.get(reason) ?? [];
          return (
            <AccordionItem key={reason} value={reason}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <ReasonIcon reason={reason} />
                  <span className="font-medium">
                    {REASON_LABELS[reason] ?? reason}
                  </span>
                  <Badge variant="warning">{rows.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2 pt-2">
                  {rows.map((row) => {
                    const isSelected = selected.has(row.case_id);
                    return (
                      <li
                        key={row.case_id}
                        className={
                          'flex items-stretch gap-2 rounded-md border border-border ' +
                          (isSelected ? 'bg-muted/40' : 'hover:bg-muted/30')
                        }
                      >
                        {canBulkRetry ? (
                          <div
                            className="flex items-center px-2"
                            // The wrapper captures clicks so the Link doesn't
                            // navigate when the operator is selecting.
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Checkbox
                              aria-label={`Select ${row.case_id}`}
                              checked={isSelected}
                              onCheckedChange={() => {
                                toggleOne(row.case_id);
                              }}
                            />
                          </div>
                        ) : null}
                        <Link
                          to={`/cases/${row.case_id}`}
                          className="block flex-1 p-3"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-mono text-sm">
                              {row.case_id}
                            </span>
                            <Badge variant="secondary">{row.state_code}</Badge>
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                            <div>Type: {row.case_type}</div>
                            <div>
                              Attempts:{' '}
                              {row.max_attempts !== null
                                ? `${row.attempt_count}/${row.max_attempts}`
                                : row.attempt_count}
                            </div>
                            <div>Opened: {formatDateTime(row.opened_at)}</div>
                            <div>
                              Next action: {formatDateTime(row.next_action_at)}
                            </div>
                          </div>
                          {row.last_error_code ? (
                            <div className="mt-1 text-xs text-red-600">
                              {row.last_error_code}
                              {row.last_error_retryable === false
                                ? ' (terminal)'
                                : ''}
                            </div>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* The modal owns its own results phase; we close + clear selection
          here only after a clean (all-success) flow. Partial / all-failed
          surfaces stay open for review and the user dismisses manually. */}
      <BulkRetryModal
        selectedCases={selectedRows}
        open={bulkModalOpen}
        onOpenChange={(next) => { setBulkModalOpen(next); }}
        onSuccess={(data) => {
          if (data.summary.failed === 0) {
            // Clear selection on full success — those cases will be gone
            // from the next refetch anyway (they're no longer stuck).
            clearSelection();
          }
        }}
      />
    </div>
  );
}
