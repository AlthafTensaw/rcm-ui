/**
 * Dashboard — landing page for the Operations Console.
 *
 * Per frontend tech spec §5.1 + BRD §2.4 wireframes.
 *
 * Composition:
 *   - 3 KPI cards: Active cases, Stuck cases, Polling lag
 *   - "Cases by state" horizontal BarChart driven by group_by
 *   - Recent activity panel (last hour, capped at 15 rows)
 *
 * Refresh: TanStack Query polls every 30s when the tab is visible.
 * Per the action contract layer, the dispatcher caches results
 * keyed by (actionId, requestKey); `useActionQuery`'s freshFor
 * window controls staleness.
 *
 * Edge cases:
 *   - Empty `groups` map (no cases) renders the chart's emptyMessage
 *   - Empty recent-activity list shows a positive empty-state message
 *   - Errors surface via TanStack Query's global onError → toast
 */
import { useActionQuery } from '@tensaw/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@tensaw/design-system';
import { BarChart, KpiCard } from '@tensaw/visualization';

import type {
  PaginatedAdminCasesResponse,
  RecentActivityResponse,
  SchedulerHealth,
  StuckCasesResponse,
} from '../../actions/schemas';
import { HistoryTimeline, type TimelineRow } from '../../components/timeline/HistoryTimeline';

const REFRESH_INTERVAL_MS = 30_000;

export function DashboardPage() {
  // 1) Active case groups by state — limit:0 so we just get the groups
  const { data: caseGroups, isLoading: groupsLoading } =
    useActionQuery<PaginatedAdminCasesResponse>(
      'admin.list-cases',
      { group_by: 'state_code', limit: 0 },
      { freshFor: REFRESH_INTERVAL_MS },
    );

  // 2) Stuck cases — limit:1 because we only need the total count
  const { data: stuck, isLoading: stuckLoading } =
    useActionQuery<StuckCasesResponse>(
      'admin.stuck-cases',
      { limit: 1 },
      { freshFor: REFRESH_INTERVAL_MS },
    );

  // 3) Scheduler health — drives the polling-lag KPI
  const { data: scheduler, isLoading: schedulerLoading } =
    useActionQuery<SchedulerHealth>(
      'admin.health-scheduler',
      {},
      { freshFor: REFRESH_INTERVAL_MS },
    );

  // 4) Recent activity panel (last hour, top 15)
  const { data: recent, isLoading: recentLoading } =
    useActionQuery<RecentActivityResponse>(
      'admin.recent-activity',
      { since: 'PT1H', limit: 15 },
      { freshFor: REFRESH_INTERVAL_MS },
    );

  const activeCount = caseGroups?.total ?? 0;
  const stuckCount = stuck?.total ?? 0;
  const lagSeconds = scheduler?.polling_lag_seconds ?? null;

  const chartData = caseGroups?.groups
    ? Object.entries(caseGroups.groups).map(([state, count]) => ({
        state,
        count,
      }))
    : [];

  const recentRows: TimelineRow[] = (recent?.items ?? []).map((r) => ({
    id: r.history_id,
    occurredAt: r.occurred_at,
    stateFrom: r.state_code_from,
    stateTo: r.state_code_to,
    triggerType: r.trigger_type,
    outcome: r.trigger_outcome,
    actorEmail: r.actor_email,
    consoleActionType: r.console_action_type,
    reason: r.reason,
    caseId: r.case_id,
  }));

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of active workflow cases. Refreshes every 30 seconds.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {groupsLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <KpiCard
            label="Active cases"
            value={activeCount}
            format="integer"
            direction="neutral"
          />
        )}
        {stuckLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <KpiCard
            label="Stuck cases"
            value={stuckCount}
            format="integer"
            direction="inverse"
          />
        )}
        {schedulerLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <KpiCard
            label="Polling lag (sec)"
            value={lagSeconds}
            format="integer"
            direction="inverse"
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases by state</CardTitle>
          <CardDescription>
            Distribution of open cases across workflow states.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {groupsLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <BarChart
              data={chartData}
              xAxisKey="state"
              series={[
                { dataKey: 'count', label: 'Cases', format: 'integer' },
              ]}
              yAxisFormat="integer"
              layout="horizontal"
              height={320}
              emptyMessage="No active cases."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            State transitions in the last hour.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <HistoryTimeline
              rows={recentRows}
              showCaseId
              emptyMessage="Nothing happened in the last hour. Workflows are idle."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
