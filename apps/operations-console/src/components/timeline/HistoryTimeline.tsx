/**
 * HistoryTimeline — vertical timeline of state transitions.
 *
 * Used by:
 *   - Case Detail (`pages/case-detail/CaseDetailPage.tsx`)
 *   - Activity Stream (`pages/activity/ActivityStreamPage.tsx`)
 *
 * Wire shape: each row has `state_before/from`, `state_after/to`,
 * `trigger_type`, `outcome` (optional), `actor` (optional, populated
 * for CONSOLE_* triggers in Phase B), `error_code` (optional),
 * `started/occurred_at`, plus an optional `case_id` for cross-case views.
 *
 * Console-action rendering (per BRD §3.4): rows whose `trigger_type`
 * starts with `CONSOLE_` show with the ⊕ glyph and surface the actor
 * + reason inline. Handler-driven transitions show with the ● glyph.
 */
import { CircleDot, PlusCircle, AlertCircle } from 'lucide-react';

export interface TimelineRow {
  /** Stable key — history_id from backend. */
  id: string | number;
  occurredAt: string | null;
  stateFrom: string | null;
  stateTo: string | null;
  triggerType: string;
  outcome?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  /** Populated for CONSOLE_* triggers in Phase B. */
  actorEmail?: string | null;
  consoleActionType?: string | null;
  reason?: string | null;
  /** When set, the row links to or labels the originating case. */
  caseId?: string | null;
}

export interface HistoryTimelineProps {
  rows: TimelineRow[];
  /** When true, render the case_id label (Activity Stream cross-case view). */
  showCaseId?: boolean;
  /** Empty-state message when rows is empty. */
  emptyMessage?: string;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isConsoleTrigger(trigger: string): boolean {
  return trigger.startsWith('CONSOLE_');
}

export function HistoryTimeline({
  rows,
  showCaseId = false,
  emptyMessage = 'No history yet.',
}: HistoryTimelineProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {rows.map((r) => {
        const console = isConsoleTrigger(r.triggerType);
        const fatal =
          r.outcome === 'FATAL' || (r.errorCode !== undefined && r.errorCode !== null);
        const Icon = console ? PlusCircle : fatal ? AlertCircle : CircleDot;
        const iconColor = console
          ? 'text-blue-600'
          : fatal
            ? 'text-red-600'
            : 'text-muted-foreground';

        return (
          <li
            key={r.id}
            className="flex gap-3 border-l-2 border-border pl-3"
            data-testid="history-timeline-row"
          >
            <div className={`mt-0.5 ${iconColor}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(r.occurredAt)}
                </span>
                {showCaseId && r.caseId ? (
                  <span className="font-mono text-xs text-foreground">
                    {r.caseId}
                  </span>
                ) : null}
                <span className="text-sm font-medium">
                  {console
                    ? `${r.consoleActionType ?? r.triggerType.replace('CONSOLE_', '')} (console action)`
                    : r.stateFrom && r.stateTo
                      ? `${r.stateFrom} → ${r.stateTo}`
                      : r.stateTo ?? r.triggerType}
                </span>
              </div>
              {console && r.actorEmail ? (
                <div className="text-xs text-muted-foreground">
                  by {r.actorEmail}
                  {r.reason ? (
                    <>
                      {' · '}
                      <span className="italic">"{r.reason}"</span>
                    </>
                  ) : null}
                </div>
              ) : null}
              {fatal && r.errorMessage ? (
                <div className="text-xs text-red-600">
                  {r.errorCode ? `${r.errorCode}: ` : ''}
                  {r.errorMessage}
                </div>
              ) : null}
              {!console && r.triggerType ? (
                <div className="text-xs text-muted-foreground">
                  trigger: {r.triggerType}
                  {r.outcome ? ` · outcome: ${r.outcome}` : ''}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
