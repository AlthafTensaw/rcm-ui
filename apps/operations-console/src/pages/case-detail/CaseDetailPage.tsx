/**
 * Case Detail — single case deep-dive (read-only in Phase A).
 *
 * Per frontend tech spec §5.3 + BRD §2.4 wireframes.
 *
 * Layout:
 *   - Summary card (case fields in a labeled grid)
 *   - Tabs: Tasks | Facts | History
 *
 * Phase A: NO action panel. Phase B will add 4 buttons (Force advance,
 * Retry, Reassign, Close) below Summary. The kickoff says explicitly
 * not to scaffold them now.
 *
 * PHI: the backend redacts server-side ("[redacted-PHI]" string). The
 * frontend renders whatever the API returns — no client-side redaction.
 *
 * Data: 2 parallel queries (case-detail + case-history). Both use the
 * default cache freshness; the case detail screen doesn't auto-refresh
 * since it's a focus view.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { useActionQuery } from '@tensaw/actions';
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Pill,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@tensaw/design-system';

import type {
  CaseDetailResponse,
  CaseHistoryResponse,
} from '../../actions/schemas';
import { HistoryTimeline, type TimelineRow } from '../../components/timeline/HistoryTimeline';
import { CaseActionPanel } from '../../components/case-actions/CaseActionPanel';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const safeCaseId = caseId ?? '';
  const [activeTab, setActiveTab] = useState<string>('tasks');

  const { data: detail, isLoading: detailLoading, error: detailError } =
    useActionQuery<CaseDetailResponse>(
      'admin.case-detail',
      { case_id: safeCaseId },
      { skip: safeCaseId === '' },
    );

  const { data: history, isLoading: historyLoading } =
    useActionQuery<CaseHistoryResponse>(
      'admin.case-history',
      { case_id: safeCaseId, limit: 50 },
      { skip: safeCaseId === '' },
    );

  if (detailError) {
    return (
      <div className="space-y-4 p-6">
        <Link to="/cases" className="inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Cases
        </Link>
        <Alert
          variant="error"
          title="Failed to load case"
          description={detailError.message}
        />
      </div>
    );
  }

  if (detailLoading || !detail) {
    return (
      <div className="space-y-4 p-6">
        <Link to="/cases" className="inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Cases
        </Link>
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const c = detail.case;
  const isClosed = c.closed_at !== null;
  const isStuck =
    c.last_error_retryable === false ||
    (c.max_attempts !== null && c.attempt_count >= c.max_attempts);

  const historyRows: TimelineRow[] = (history?.items ?? []).map((r) => ({
    id: r.step_history_id,
    occurredAt: r.started_at,
    stateFrom: r.state_before,
    stateTo: r.state_after,
    triggerType: r.trigger_type,
    outcome: r.outcome_code,
    errorCode: r.error_code,
    errorMessage: r.error_message,
  }));

  return (
    <div className="space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <Link
            to="/cases"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} /> Cases
          </Link>
          <h1 className="font-mono text-2xl font-semibold">{c.case_id}</h1>
        </div>
        <div className="flex items-center gap-2">
          {isClosed ? <Badge variant="default">closed</Badge> : null}
          {isStuck && !isClosed ? (
            <Badge variant="warning">
              <AlertTriangle size={12} className="mr-1 inline" /> stuck
            </Badge>
          ) : null}
          <Badge variant="secondary">{c.state_code}</Badge>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            Workflow: {c.workflow_name}
            {c.workflow_version ? ` · ${c.workflow_version}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <FieldRow label="Case type" value={c.case_type} />
            <FieldRow label="State" value={c.state_code} />
            <FieldRow label="Substate" value={c.substate_code ?? '—'} />
            <FieldRow label="Priority" value={c.priority_code ?? '—'} />
            <FieldRow label="Clinic" value={c.clinic_id ?? '—'} />
            <FieldRow label="Payer" value={c.payer_id ?? '—'} />
            <FieldRow label="Provider" value={c.provider_id ?? '—'} />
            <FieldRow
              label="Owner"
              value={c.owner_user_id ?? <em className="text-muted-foreground">unassigned</em>}
            />
            <FieldRow label="Opened" value={formatDateTime(c.opened_at)} />
            <FieldRow label="Updated" value={formatDateTime(c.updated_at)} />
            <FieldRow
              label="Next action"
              value={formatDateTime(c.next_action_at)}
            />
            <FieldRow label="Closed" value={formatDateTime(c.closed_at)} />
            <FieldRow
              label="Attempts"
              value={
                c.max_attempts !== null
                  ? `${c.attempt_count} / ${c.max_attempts}`
                  : String(c.attempt_count)
              }
            />
            {c.last_error_code ? (
              <FieldRow
                label="Last error"
                value={
                  <span className="text-red-600">
                    {c.last_error_code}
                    {c.last_error_retryable === false ? ' (terminal)' : ''}
                  </span>
                }
              />
            ) : null}
          </dl>
        </CardContent>
      </Card>

      {/* Phase B — Tier 2 action panel. Hidden when user has no
          permissions, or when the case is closed (no actions apply). */}
      <CaseActionPanel
        caseId={c.case_id}
        currentOwner={c.owner_user_id}
        closedAt={c.closed_at}
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tasks">
                Tasks ({detail.tasks.length})
              </TabsTrigger>
              <TabsTrigger value="facts">
                Facts ({detail.facts.length})
              </TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="pt-4">
              {detail.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No open tasks.
                </p>
              ) : (
                <ul className="space-y-2">
                  {detail.tasks.map((t) => (
                    <li
                      key={t.task_id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-medium">{t.task_type}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {t.intent_key}
                          </span>
                        </div>
                        <Badge variant="secondary">{t.state_code}</Badge>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-4">
                        <div>Priority: {t.priority_code ?? '—'}</div>
                        <div>Attempts: {t.attempt_count}</div>
                        <div>Due: {formatDateTime(t.due_at)}</div>
                        <div>Next action: {formatDateTime(t.next_action_at)}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="facts" className="pt-4">
              {detail.facts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No facts captured.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Key</th>
                      <th className="py-2">Value</th>
                      <th className="py-2">Source</th>
                      <th className="py-2">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.facts.map((f) => {
                      const value =
                        f.fact_value_str ??
                        (f.fact_value_num !== null ? String(f.fact_value_num) : null) ??
                        (f.fact_value_bool !== null ? String(f.fact_value_bool) : null) ??
                        f.fact_value_date ??
                        '—';
                      return (
                        <tr
                          key={f.fact_key}
                          className="border-b border-border/50"
                        >
                          <td className="py-2 font-mono text-xs">{f.fact_key}</td>
                          <td className="py-2">{value}</td>
                          <td className="py-2">
                            {f.source ? <Pill>{f.source}</Pill> : '—'}
                          </td>
                          <td className="py-2 text-xs text-muted-foreground">
                            {formatDateTime(f.updated_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </TabsContent>

            <TabsContent value="history" className="pt-4">
              {historyLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <HistoryTimeline rows={historyRows} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
