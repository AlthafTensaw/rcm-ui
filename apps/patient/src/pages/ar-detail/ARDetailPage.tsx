/**
 * AR Detail page.
 *
 * Reachable from the AR Mgmt grid via row click. Shows the row's fields
 * inside a `<Card>` with skeleton + error states. Real implementation will
 * be the three-panel detail archetype (left: navigator, center: claim form
 * + tabs, right: notes + audit) — for v1 we ship a clean read-only summary.
 */

import { useActionQuery } from '@tensaw/actions';
import { PageHeader } from '@tensaw/composition';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  formatMoney,
} from '@tensaw/design-system';
import type { ARRow } from '@tensaw/mock-server';

export interface ARDetailPageProps {
  rowId: string;
  onBack: () => void;
}

export function ARDetailPage({ rowId, onBack }: ARDetailPageProps) {
  const detailQ = useActionQuery<ARRow>('ar.get-detail', { rowId });
  const row = detailQ.data;

  return (
    <div>
      <PageHeader
        title={row ? `${row.patientLastName}, ${row.patientFirstName}` : 'Loading…'}
        subtitle={row ? `MRN ${row.mrn} · DOS ${row.dos}` : undefined}
        onBack={onBack}
      />
      <div className="p-6">
        {detailQ.isLoading ? (
          <Card className="max-w-xl">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : detailQ.error ? (
          <Alert
            variant="error"
            title="Failed to load detail"
            description={detailQ.error.message}
            className="max-w-xl"
          />
        ) : row ? (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Claim summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <Field label="Status" value={row.status} />
              <Field label="Workflow" value={row.workflowName ?? '—'} />
              <Field label="Current task" value={row.currentTask ?? '—'} />
              <Field label="Priority" value={row.priority} />
              <Field label="Owner" value={row.ownerName ?? 'Unassigned'} />
              <Field label="Clinic" value={row.clinicName} />
              <Field label="Provider" value={row.providerName} />
              <Field label="Primary payer" value={row.primaryPayer} />
              <Field
                label="Secondary payer"
                value={row.secondaryPayer ?? '—'}
              />
              <Field label="Billed" value={formatMoney(row.billed)} />
              <Field label="Balance" value={formatMoney(row.balance)} />
              <Field
                label="Due at"
                value={row.dueAt ? row.dueAt.slice(0, 10) : '—'}
              />
              <Field label="TFL" value={row.nextTfl ?? '—'} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-muted py-1.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}
