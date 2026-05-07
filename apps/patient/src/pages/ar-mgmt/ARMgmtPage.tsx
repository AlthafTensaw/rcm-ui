/**
 * AR Mgmt Portal — main page.
 *
 * The page operates in two modes (locked decision):
 *   - 'working'         : claims already in active workflow
 *   - 'add-to-workflow' : claims candidates to be added to a workflow
 *
 * Both modes use the same archetype (search-list) and same primitives. The
 * mode flips the dataset and the bulk-action set:
 *
 *   Working mode bulk actions:        Set owner, Set due date, Open notes
 *   Add-to-workflow bulk actions:     Choose priority, Add to workflow
 *
 * Sort and pagination are server-side. Column visibility is per-user
 * persisted via @tensaw/worklist's useColumnVisibility hook. Selection is
 * kept in local component state — selection should NOT persist across
 * navigation (that's a different UX intent).
 */

import { useMemo, useState } from 'react';
import {
  FilterStrip,
  ModeToggle,
  MultiSelectComboboxFilter,
  WorklistShell,
  useColumnVisibility,
} from '@tensaw/worklist';
import {
  PageHeader,
  type SchemaDataGridColumn,
} from '@tensaw/composition';
import { Alert, Button, formatMoney } from '@tensaw/design-system';
import { useActionMutation, useActionQuery } from '@tensaw/actions';
import type {
  ARListResponse,
  ARRow,
  Priority,
  WorklistMode,
} from '@tensaw/mock-server';
import {
  BalanceCell,
  BilledCell,
  DueDateCell,
  OwnerCell,
  PriorityCell,
  StatusCell,
} from './cells';

// ---------------------------------------------------------------------------
// Constants — page id / grid id used for preference persistence keys.
// ---------------------------------------------------------------------------

const PAGE_ID = 'ar-mgmt';
const GRID_ID = 'main';

interface RefItem {
  id: string;
  label: string;
}
interface RefDataResponse {
  items: RefItem[];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export interface ARMgmtPageProps {
  /** Called when a row is clicked — typically navigates to /ar/:rowId. */
  onRowClick?: (rowId: string) => void;
}

export function ARMgmtPage({ onRowClick }: ARMgmtPageProps) {
  // ---- Mode --------------------------------------------------------------

  const [mode, setMode] = useState<WorklistMode>('working');

  // ---- Filters (controlled, owned by the page) --------------------------

  const [clinicIds, setClinicIds] = useState<readonly string[]>([]);
  const [providerIds, setProviderIds] = useState<readonly string[]>([]);
  const [payerIds, setPayerIds] = useState<readonly string[]>([]);
  const [ownerIds, setOwnerIds] = useState<readonly string[]>([]);

  const activeFilterCount =
    (clinicIds.length > 0 ? 1 : 0) +
    (providerIds.length > 0 ? 1 : 0) +
    (payerIds.length > 0 ? 1 : 0) +
    (ownerIds.length > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setClinicIds([]);
    setProviderIds([]);
    setPayerIds([]);
    setOwnerIds([]);
  };

  // ---- Sort + paging (controlled) ---------------------------------------

  const [sort, setSort] = useState<{
    columnId: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // ---- Selection --------------------------------------------------------

  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const selectedIds = useMemo(
    () => Object.entries(selection).filter(([, v]) => v).map(([k]) => k),
    [selection],
  );
  const clearSelection = () => {
    setSelection({});
  };

  // ---- Reference data (queries) ----------------------------------------

  const clinicsQ = useActionQuery<RefDataResponse>('ref.clinics', {});
  const providersQ = useActionQuery<RefDataResponse>('ref.providers', {});
  const payersQ = useActionQuery<RefDataResponse>('ref.payers', {});
  const ownersQ = useActionQuery<RefDataResponse>('ref.owners', {});

  // ---- AR list query ----------------------------------------------------

  const listRequest = useMemo(
    () => ({
      mode,
      clinicIds: clinicIds.length > 0 ? Array.from(clinicIds) : undefined,
      providerIds: providerIds.length > 0 ? Array.from(providerIds) : undefined,
      payerIds: payerIds.length > 0 ? Array.from(payerIds) : undefined,
      ownerIds: ownerIds.length > 0 ? Array.from(ownerIds) : undefined,
      sortColumn: sort?.columnId,
      sortDir: sort?.direction,
      pageIndex,
      pageSize,
    }),
    [mode, clinicIds, providerIds, payerIds, ownerIds, sort, pageIndex, pageSize],
  );

  const listQ = useActionQuery<ARListResponse>('ar.list', listRequest);
  const rows = listQ.data?.rows ?? [];
  const totalCount = listQ.data?.totalCount ?? 0;
  const totalBalance = listQ.data?.totalBalance ?? 0;

  // ---- Mutations -------------------------------------------------------

  const [bulkUpdateOwner] = useActionMutation('ar.bulk-update-owner');
  const [bulkUpdateDueDate] = useActionMutation('ar.bulk-update-due-date');
  const [addToWorkflow] = useActionMutation('claims.add-to-workflow');

  // ---- Columns ---------------------------------------------------------

  // Memoize owners so the columns useMemo (which depends on it) stays
  // stable when ownersQ.data is the same reference but its `items` field
  // is read on every render.
  const owners = useMemo(
    () => ownersQ.data?.items ?? [],
    [ownersQ.data],
  );

  const columns: SchemaDataGridColumn<ARRow>[] = useMemo(
    () => [
      {
        id: 'dos',
        header: 'DOS',
        accessorKey: 'dos',
        sortable: true,
        required: true,
        maxWidth: 100,
      },
      {
        id: 'patient',
        header: 'Patient',
        accessor: (r) => `${r.patientLastName}, ${r.patientFirstName}`,
        sortable: true,
        required: true,
        maxWidth: 180,
      },
      {
        id: 'mrn',
        header: 'MRN',
        accessorKey: 'mrn',
        sortable: true,
        maxWidth: 80,
      },
      {
        id: 'clinicName',
        header: 'Clinic',
        accessorKey: 'clinicName',
        sortable: true,
        maxWidth: 140,
      },
      {
        id: 'providerName',
        header: 'Provider',
        accessorKey: 'providerName',
        sortable: true,
        maxWidth: 130,
      },
      {
        id: 'primaryPayer',
        header: 'Primary Payer',
        accessorKey: 'primaryPayer',
        sortable: true,
        maxWidth: 140,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusCell row={row} />,
        sortable: true,
        maxWidth: 110,
      },
      {
        id: 'workflowName',
        header: 'Workflow',
        accessorKey: 'workflowName',
        sortable: true,
        maxWidth: 200,
        defaultHidden: false,
      },
      {
        id: 'currentTask',
        header: 'Current task',
        accessorKey: 'currentTask',
        maxWidth: 140,
        defaultHidden: false,
      },
      {
        id: 'priority',
        header: 'Priority',
        cell: ({ row }) => <PriorityCell row={row} />,
        sortable: true,
        maxWidth: 80,
        align: 'center',
      },
      {
        id: 'owner',
        header: 'Owner',
        cell: ({ row }) => <OwnerCell row={row} owners={owners} />,
        maxWidth: 150,
      },
      {
        id: 'dueAt',
        header: 'Due date',
        cell: ({ row }) => <DueDateCell row={row} />,
        sortable: true,
        maxWidth: 140,
      },
      {
        id: 'billed',
        header: 'Billed',
        cell: ({ row }) => <BilledCell row={row} />,
        sortable: true,
        maxWidth: 100,
        align: 'right',
        defaultHidden: true,
      },
      {
        id: 'balance',
        header: 'Balance',
        cell: ({ row }) => <BalanceCell row={row} />,
        sortable: true,
        maxWidth: 100,
        align: 'right',
        required: true,
      },
    ],
    [owners],
  );

  // ---- Column visibility (persisted) -----------------------------------

  const { visibility, setVisibility, reset: resetVisibility } = useColumnVisibility({
    pageId: PAGE_ID,
    gridId: GRID_ID,
    columns,
  });

  // ---- Mode counts (for the toggle) ------------------------------------

  const workingCountQ = useActionQuery<ARListResponse>('ar.list', {
    mode: 'working',
    pageIndex: 0,
    pageSize: 1, // we only need totalCount
  });
  const candidateCountQ = useActionQuery<ARListResponse>('ar.list', {
    mode: 'add-to-workflow',
    pageIndex: 0,
    pageSize: 1,
  });

  // ---- Filter strip composition -----------------------------------------

  const filterStrip = (
    <FilterStrip activeCount={activeFilterCount} onClearAll={clearAllFilters}>
      <MultiSelectComboboxFilter
        label="Clinic"
        items={clinicsQ.data?.items ?? []}
        selectedIds={clinicIds}
        onChange={(next) => {
          setClinicIds(next);
          setPageIndex(0);
        }}
      />
      <MultiSelectComboboxFilter
        label="Provider"
        items={providersQ.data?.items ?? []}
        selectedIds={providerIds}
        onChange={(next) => {
          setProviderIds(next);
          setPageIndex(0);
        }}
      />
      <MultiSelectComboboxFilter
        label="Payer"
        items={payersQ.data?.items ?? []}
        selectedIds={payerIds}
        onChange={(next) => {
          setPayerIds(next);
          setPageIndex(0);
        }}
      />
      {mode === 'working' ? (
        <MultiSelectComboboxFilter
          label="Owner"
          items={ownersQ.data?.items ?? []}
          selectedIds={ownerIds}
          onChange={(next) => {
            setOwnerIds(next);
            setPageIndex(0);
          }}
        />
      ) : null}
    </FilterStrip>
  );

  // ---- Bulk action bar composition --------------------------------------

  const bulkActionBar =
    mode === 'working' ? (
      <WorkingBulkActions
        selectedIds={selectedIds}
        owners={owners}
        onSelectOwner={(ownerId) => {
          void bulkUpdateOwner({ rowIds: selectedIds, ownerId }).then((r) => {
            if (r.ok) clearSelection();
          });
        }}
        onSetDueDate={(dueAt) => {
          void bulkUpdateDueDate({ rowIds: selectedIds, dueAt }).then((r) => {
            if (r.ok) clearSelection();
          });
        }}
        onClearSelection={clearSelection}
      />
    ) : (
      <AddToWorkflowBulkActions
        selectedIds={selectedIds}
        onAdd={(initialPriority) => {
          void addToWorkflow({
            claimIds: selectedIds,
            initialPriority,
          }).then((r) => {
            if (r.ok) clearSelection();
          });
        }}
        onClearSelection={clearSelection}
      />
    );

  // ---- Mode toggle ------------------------------------------------------

  const modeToggle = (
    <ModeToggle<WorklistMode>
      value={mode}
      onChange={(next) => {
        setMode(next);
        clearSelection();
        setPageIndex(0);
        setSort(null);
      }}
      options={[
        {
          id: 'working',
          label: 'Working list',
          count: workingCountQ.data?.totalCount,
        },
        {
          id: 'add-to-workflow',
          label: 'Add to workflow',
          count: candidateCountQ.data?.totalCount,
        },
      ]}
    />
  );

  // ---- Footer totals ---------------------------------------------------

  const totalsSlot = (
    <span>
      <span className="text-muted-foreground">Total balance: </span>
      <span className="font-semibold tabular-nums">
        {formatMoney(totalBalance)}
      </span>
    </span>
  );

  // ---- Loading / error states (handled inside the shell area) ---------

  if (listQ.error) {
    return (
      <div className="p-6">
        <Alert
          variant="error"
          title="Failed to load AR rows"
          description={listQ.error.message}
        />
      </div>
    );
  }

  // ---- Render ----------------------------------------------------------

  return (
    <div>
      <PageHeader
        title="AR Mgmt Portal"
        actions={modeToggle}
      />

      <WorklistShell<ARRow>
        topSlot={null}
        filterStrip={filterStrip}
        bulkActionBar={bulkActionBar}
        rows={rows}
        columns={columns}
        getRowId={(r) => r.id}
        selection={selection}
        onSelectionChange={setSelection}
        selectionMode="multi"
        onRowClick={(row) => {
          onRowClick?.(row.id);
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          setPageIndex(0);
        }}
        columnVisibility={visibility}
        onColumnVisibilityChange={setVisibility}
        onColumnVisibilityReset={resetVisibility}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={setPageIndex}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPageIndex(0);
        }}
        footerTotalsSlot={totalsSlot}
        density="compact"
      />

      {/* WorklistShell renders the column visibility menu internally. */}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bulk action panels — mode-specific
// ---------------------------------------------------------------------------

interface WorkingBulkActionsProps {
  selectedIds: string[];
  owners: readonly RefItem[];
  onSelectOwner: (ownerId: string | null) => void;
  onSetDueDate: (dueAt: string | null) => void;
  onClearSelection: () => void;
}

function WorkingBulkActions({
  selectedIds,
  owners,
  onSelectOwner,
  onSetDueDate,
  onClearSelection,
}: WorkingBulkActionsProps) {
  if (selectedIds.length === 0) return null;
  return (
    <div className={BULK_BAR_CLASS}>
      <span className={BULK_COUNT_CLASS}>{selectedIds.length} selected</span>
      <span className="text-accent/50">|</span>

      <select
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return;
          onSelectOwner(v === '__unassign__' ? null : v);
          e.target.value = '';
        }}
        className={BULK_FIELD_CLASS}
      >
        <option value="" disabled>
          Set owner…
        </option>
        <option value="__unassign__">Unassign</option>
        {owners.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>

      <input
        type="date"
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') return;
          onSetDueDate(new Date(`${v}T17:00:00Z`).toISOString());
        }}
        className={BULK_FIELD_CLASS}
      />

      <span className="flex-1" />

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear selection
      </Button>
    </div>
  );
}

interface AddToWorkflowBulkActionsProps {
  selectedIds: string[];
  onAdd: (initialPriority: Priority) => void;
  onClearSelection: () => void;
}

function AddToWorkflowBulkActions({
  selectedIds,
  onAdd,
  onClearSelection,
}: AddToWorkflowBulkActionsProps) {
  const [priority, setPriority] = useState<Priority>('P3');
  if (selectedIds.length === 0) return null;
  return (
    <div className={BULK_BAR_CLASS}>
      <span className={BULK_COUNT_CLASS}>{selectedIds.length} selected</span>
      <span className="text-accent/50">|</span>

      <span className="text-xs text-muted-foreground">
        Initial priority:
      </span>
      <select
        value={priority}
        onChange={(e) => {
          setPriority(e.target.value as Priority);
        }}
        className={BULK_FIELD_CLASS}
      >
        <option value="P1">P1 (12h)</option>
        <option value="P2">P2 (24h)</option>
        <option value="P3">P3 (48–72h)</option>
        <option value="P4">P4 (72h+)</option>
      </select>

      <Button
        size="sm"
        onClick={() => {
          onAdd(priority);
        }}
      >
        Add {selectedIds.length} to workflow
      </Button>

      <span className="flex-1" />

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Clear selection
      </Button>
    </div>
  );
}

// -- Styles -----------------------------------------------------------------

// Bulk bar uses a soft-tinted background rail with a subtle bottom border —
// scoped Tailwind classes rather than inline-style constants so theming
// flows through CSS variables consistently.
const BULK_BAR_CLASS =
  'flex items-center gap-3 border-b border-accent/30 bg-accent/5 px-5 py-2';

const BULK_COUNT_CLASS = 'text-xs font-semibold text-accent';

const BULK_FIELD_CLASS =
  'h-7 cursor-pointer rounded-md border border-input bg-background px-2 text-xs ' +
  'focus:outline-none focus:ring-2 focus:ring-ring/30';
