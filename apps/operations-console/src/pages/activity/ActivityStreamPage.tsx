/**
 * Activity Stream — cross-case timeline of recent transitions.
 *
 * Per frontend tech spec §5.5 + BRD §2.4 wireframes.
 *
 * URL params:
 *   - since (ISO-8601 duration: PT15M, PT1H, PT6H, P1D, P7D)
 *   - state_code_to (filter by destination state)
 *   - trigger_type (POLL, SIGNAL, MANUAL_ADVANCE, RECLAIM, CONSOLE_RETRY,
 *     CONSOLE_CLOSE) — per backend handback deviation #1
 *
 * Refresh: 30s when the tab is visible, matching the Dashboard.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useActionQuery } from '@tensaw/actions';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Select,
  Skeleton,
} from '@tensaw/design-system';

import {
  type RecentActivityResponse,
  TRIGGER_TYPES,
  DEMO_STATE_CODES,
} from '../../actions/schemas';
import { HistoryTimeline, type TimelineRow } from '../../components/timeline/HistoryTimeline';

const SINCE_OPTIONS = [
  { value: 'PT15M', label: 'Last 15 min' },
  { value: 'PT1H', label: 'Last hour' },
  { value: 'PT6H', label: 'Last 6 hours' },
  { value: 'P1D', label: 'Last day' },
  { value: 'P7D', label: 'Last 7 days' },
];

const REFRESH_INTERVAL_MS = 30_000;

export function ActivityStreamPage() {
  const [params, setParams] = useSearchParams();

  const since = params.get('since') ?? 'PT1H';
  const stateCodeTo = params.get('state_code_to') ?? '';
  const triggerType = params.get('trigger_type') ?? '';

  const request = useMemo(
    () => ({
      since,
      ...(stateCodeTo ? { state_code_to: stateCodeTo } : {}),
      ...(triggerType ? { trigger_type: triggerType } : {}),
      limit: 200,
    }),
    [since, stateCodeTo, triggerType],
  );

  const { data, isLoading, error } = useActionQuery<RecentActivityResponse>(
    'admin.recent-activity',
    request,
    { freshFor: REFRESH_INTERVAL_MS },
  );

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setParams(next);
  };

  const handleClear = () => {
    setParams(new URLSearchParams({ since: 'PT1H' }));
  };

  const stateOptions = [
    { value: '__all__', label: 'All destination states' },
    ...DEMO_STATE_CODES.map((s) => ({ value: s, label: s })),
  ];

  const triggerOptions = [
    { value: '__all__', label: 'All trigger types' },
    ...TRIGGER_TYPES.map((t) => ({ value: t, label: t })),
  ];

  const rows: TimelineRow[] = (data?.items ?? []).map((r) => ({
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
    <div className="space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading recent activity…'
            : `${data?.total ?? 0} transition${data?.total === 1 ? '' : 's'} in the selected window.`}
        </p>
      </header>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Time window
              </label>
              <Select
                aria-label="Time window"
                value={since}
                onValueChange={(v) => {
                  updateParam('since', v);
                }}
                options={SINCE_OPTIONS}
                width={160}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Destination state
              </label>
              <Select
                aria-label="Destination state"
                value={stateCodeTo === '' ? '__all__' : stateCodeTo}
                onValueChange={(v) => {
                  updateParam('state_code_to', v === '__all__' ? '' : v);
                }}
                options={stateOptions}
                width={200}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Trigger type
              </label>
              <Select
                aria-label="Trigger type"
                value={triggerType === '' ? '__all__' : triggerType}
                onValueChange={(v) => {
                  updateParam('trigger_type', v === '__all__' ? '' : v);
                }}
                options={triggerOptions}
                width={200}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {error ? (
            <Alert
              variant="error"
              title="Failed to load activity"
              description={error.message}
            />
          ) : isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <HistoryTimeline
              rows={rows}
              showCaseId
              emptyMessage="No transitions in the selected window."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
