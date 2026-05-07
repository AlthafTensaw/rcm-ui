/**
 * Case List — paginated browser of workflow cases.
 *
 * Per frontend tech spec §5.2 + BRD §2.4 wireframes.
 *
 * URL params drive the view; filter changes update the URL via
 * `setSearchParams` (no navigation). This makes the page bookmarkable
 * and shareable — "send me the link to your DRAFTING_APPEAL view".
 *
 * Multi-clinic scoping per kickoff §16.1 + frontend tech spec §5.2:
 *   - Clinic-scoped users (CLINIC_ADMIN/USER): the `clinic_ids` param
 *     is auto-set to their `user.clinicIds` and the dropdown is locked
 *     to those entries.
 *   - Cross-clinic roles (TENSAW_*, TENANT_ADMIN, RCM_OPS_*): no auto
 *     scope; dropdown is free-text in Phase A (a tenant-wide clinic-
 *     listing endpoint is a Phase B follow-up — see kickoff §16.1).
 *
 * Stuck indicator: the `is_stuck` field comes back on every row from
 * the backend (per AdminCaseRow.is_stuck), so we don't need the
 * separate `admin.stuck-cases` cross-reference the spec mentioned.
 */

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { useActionQuery } from '@tensaw/actions';
import { useAuthStore } from '@tensaw/runtime';
import {
  Badge,
  Button,
  Link,
  Pill,
  Select,
} from '@tensaw/design-system';
import { DataExplorer } from '@tensaw/composition/data-display';
import type { SchemaDataGridColumn } from '@tensaw/composition/grids';

import {
  type AdminCaseRow,
  type PaginatedAdminCasesResponse,
  CASE_SORT_OPTIONS,
  DEMO_STATE_CODES,
} from '../../actions/schemas';
import { isCrossClinicUser } from '../../auth/permissions';

const PAGE_SIZE = 50;

interface ParsedFilters {
  state_code?: string;
  case_type?: string;
  clinic_ids?: string;
  payer_id?: string;
  owner_user_id?: string;
  include_closed: boolean;
  offset: number;
  limit: number;
  sort: (typeof CASE_SORT_OPTIONS)[number];
}

function parseFilters(params: URLSearchParams): ParsedFilters {
  const sort = (params.get('sort') ?? 'age_desc') as ParsedFilters['sort'];
  return {
    state_code: params.get('state_code') ?? undefined,
    case_type: params.get('case_type') ?? undefined,
    clinic_ids: params.get('clinic_ids') ?? undefined,
    payer_id: params.get('payer_id') ?? undefined,
    owner_user_id: params.get('owner_user_id') ?? undefined,
    include_closed: params.get('include_closed') === 'true',
    offset: Number.parseInt(params.get('offset') ?? '0', 10) || 0,
    limit: Number.parseInt(params.get('limit') ?? String(PAGE_SIZE), 10) || PAGE_SIZE,
    sort: CASE_SORT_OPTIONS.includes(sort) ? sort : 'age_desc',
  };
}

function formatRelativeAge(opened: string | null): string {
  if (!opened) return '—';
  const ageMs = Date.now() - Date.parse(opened);
  const min = Math.round(ageMs / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h`;
  const days = Math.round(hr / 24);
  return `${days}d`;
}

const COLUMNS: SchemaDataGridColumn<AdminCaseRow>[] = [
  {
    id: 'case_id',
    header: 'Case ID',
    accessorKey: 'case_id',
    width: 140,
    sortable: true,
    required: true,
    cell: ({ row }) => (
      <Link to={`/cases/${row.case_id}`} className="font-mono text-xs">
        {row.case_id}
      </Link>
    ),
  },
  {
    id: 'state_code',
    header: 'State',
    accessorKey: 'state_code',
    width: 180,
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        {row.is_stuck ? (
          <span title={row.stuck_reason ?? 'stuck'}>
            <AlertTriangle size={14} className="text-amber-600" />
          </span>
        ) : null}
        <span>{row.state_code}</span>
      </div>
    ),
  },
  {
    id: 'case_type',
    header: 'Type',
    accessorKey: 'case_type',
    width: 100,
  },
  {
    id: 'clinic_id',
    header: 'Clinic',
    accessorKey: 'clinic_id',
    width: 120,
    cell: ({ row }) => row.clinic_id ?? '—',
  },
  {
    id: 'payer_id',
    header: 'Payer',
    accessorKey: 'payer_id',
    width: 120,
    cell: ({ row }) => row.payer_id ?? '—',
  },
  {
    id: 'owner_user_id',
    header: 'Owner',
    accessorKey: 'owner_user_id',
    width: 220,
    cell: ({ row }) =>
      row.owner_user_id ? (
        <span className="text-xs">{row.owner_user_id}</span>
      ) : (
        <Badge variant="warning">unassigned</Badge>
      ),
  },
  {
    id: 'open_task_count',
    header: 'Open tasks',
    accessorKey: 'open_task_count',
    align: 'right',
    width: 110,
  },
  {
    id: 'opened_at',
    header: 'Age',
    accessorKey: 'opened_at',
    width: 90,
    sortable: true,
    cell: ({ row }) => formatRelativeAge(row.opened_at),
  },
  {
    id: 'attempts',
    header: 'Attempts',
    width: 110,
    cell: ({ row }) =>
      row.max_attempts !== null
        ? `${row.attempt_count}/${row.max_attempts}`
        : String(row.attempt_count),
  },
];

export function CaseListPage() {
  const [params, setParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);

  const filters = useMemo(() => parseFilters(params), [params]);

  const userIsCrossClinic = user ? isCrossClinicUser(user.roles) : false;

  // For clinic-scoped users, force the clinic_ids filter to their
  // accessible clinics. This is a UX gate; the server enforces too.
  const effectiveClinicIds = useMemo(() => {
    if (filters.clinic_ids) return filters.clinic_ids;
    if (!userIsCrossClinic && user && user.clinicIds.length > 0) {
      return user.clinicIds.join(',');
    }
    return undefined;
  }, [filters.clinic_ids, userIsCrossClinic, user]);

  const { data, isLoading } = useActionQuery<PaginatedAdminCasesResponse>(
    'admin.list-cases',
    {
      ...filters,
      clinic_ids: effectiveClinicIds,
    },
  );

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value === undefined || value === '') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Reset offset when filters change.
    if (key !== 'offset') next.delete('offset');
    setParams(next);
  };

  const handleClearFilters = () => {
    setParams(new URLSearchParams());
  };

  const stateOptions = [
    { value: '__all__', label: 'All states' },
    ...DEMO_STATE_CODES.map((s) => ({ value: s, label: s })),
  ];

  const sortOptions = [
    { value: 'age_desc', label: 'Oldest first' },
    { value: 'age_asc', label: 'Newest first' },
    { value: 'last_activity_desc', label: 'Recent activity' },
    { value: 'case_id_asc', label: 'Case ID' },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">State</label>
        <Select
          aria-label="Filter by state"
          value={filters.state_code ?? '__all__'}
          onValueChange={(v) => {
            updateParam('state_code', v === '__all__' ? undefined : v);
          }}
          options={stateOptions}
          width={180}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Sort</label>
        <Select
          aria-label="Sort order"
          value={filters.sort}
          onValueChange={(v) => {
            updateParam('sort', v);
          }}
          options={sortOptions}
          width={180}
        />
      </div>
      {!userIsCrossClinic && user && user.clinicIds.length > 0 ? (
        <div className="flex flex-wrap items-end gap-1">
          <span className="mb-2 text-xs text-muted-foreground">Your clinics:</span>
          {user.clinicIds.map((c) => (
            <Pill key={c}>{c}</Pill>
          ))}
        </div>
      ) : null}
      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cases</h1>
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading cases…'
            : `${data?.total ?? 0} case${data?.total === 1 ? '' : 's'} match the current filters.`}
        </p>
      </header>

      <DataExplorer<AdminCaseRow>
        rows={data?.items ?? []}
        columns={COLUMNS}
        totalRows={data?.total ?? 0}
        getRowId={(row) => row.case_id}
        loading={isLoading}
        empty={{
          title: 'No cases',
          description:
            'Either no cases match the filters, or you don\'t have access to view them.',
        }}
        filters={filterBar}
        pageIndex={Math.floor(filters.offset / filters.limit)}
        pageSize={filters.limit}
        onPageChange={(page) => {
          updateParam('offset', String(page * filters.limit));
        }}
        aria-label="Workflow cases"
      />
    </div>
  );
}
