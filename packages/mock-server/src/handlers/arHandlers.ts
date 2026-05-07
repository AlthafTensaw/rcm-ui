/**
 * MSW handlers for the AR Mgmt Portal.
 *
 * Implements every endpoint the AR actions registry references:
 *
 *   GET    /api/v1/ar                          — list with filter/sort/page
 *   PATCH  /api/v1/ar/{rowId}/owner            — single owner update
 *   PATCH  /api/v1/ar/{rowId}/due-date         — single due-date update
 *   PATCH  /api/v1/ar:bulk-update-owner        — bulk owner update
 *   PATCH  /api/v1/ar:bulk-update-due-date     — bulk due-date update
 *   POST   /api/v1/workflow/cases:bulk         — add claims to workflow
 *   GET    /api/v1/ref/clinics                 — ref data
 *   GET    /api/v1/ref/providers
 *   GET    /api/v1/ref/payers
 *   GET    /api/v1/ref/owners
 *
 * Every response is wrapped in the platform `{ success, data, meta }` envelope.
 */

import { http, HttpResponse } from 'msw';
import { buildErrorEnvelope, buildSuccessEnvelope } from '@tensaw/runtime';
import type { ARListRequest, ARListResponse, ARRow } from '../schemas/ar';
import { ARListRequestSchema } from '../schemas/ar';
import {
  CLINICS,
  OWNERS,
  PAYERS,
  PROVIDERS,
} from '../fixtures/refData';
import {
  findRow,
  getRowsForMode,
  moveToWorking,
  patchRow,
} from './arState';

// ---------------------------------------------------------------------------
// Local envelope wrappers — thin adapters over @tensaw/runtime helpers that
// keep this module's existing call shapes unchanged. `envelope(data)` returns
// the plain envelope (callers wrap with HttpResponse.json themselves).
// `errorEnvelope(code, message, status)` returns a fully-formed HttpResponse
// with status set, since the call sites here use it as a return value.
// ---------------------------------------------------------------------------

const envelope = buildSuccessEnvelope;

function errorEnvelope(code: string, message: string, status: number) {
  return HttpResponse.json(buildErrorEnvelope(code, message), { status });
}

// ---------------------------------------------------------------------------
// List filtering / sorting / paging
// ---------------------------------------------------------------------------

function applyFilters(rows: ARRow[], req: ARListRequest): ARRow[] {
  let filtered = rows;
  if (req.clinicIds?.length) {
    const set = new Set(req.clinicIds);
    filtered = filtered.filter((r) => set.has(r.clinicId));
  }
  if (req.providerIds?.length) {
    const set = new Set(req.providerIds);
    filtered = filtered.filter((r) => set.has(r.providerId));
  }
  if (req.payerIds?.length) {
    // We compare by label since payer is stored as a label in the AR row;
    // a real backend would store an id and join. Acceptable for the mock.
    const ids = new Set(req.payerIds);
    const labels = new Set(
      PAYERS.filter((p) => ids.has(p.id)).map((p) => p.label),
    );
    filtered = filtered.filter((r) => labels.has(r.primaryPayer));
  }
  if (req.ownerIds?.length) {
    const ids = new Set(req.ownerIds);
    filtered = filtered.filter((r) => r.ownerId !== null && ids.has(r.ownerId));
  }
  if (req.statuses?.length) {
    const set = new Set(req.statuses);
    filtered = filtered.filter((r) => set.has(r.status));
  }
  if (req.priorities?.length) {
    const set = new Set(req.priorities);
    filtered = filtered.filter((r) => set.has(r.priority));
  }
  if (req.dosFrom !== undefined) {
    const dosFrom = req.dosFrom;
    filtered = filtered.filter((r) => r.dos >= dosFrom);
  }
  if (req.dosTo !== undefined) {
    const dosTo = req.dosTo;
    filtered = filtered.filter((r) => r.dos <= dosTo);
  }
  if (req.agingMinDays !== undefined) {
    const cutoff = Date.now() - req.agingMinDays * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(
      (r) => new Date(r.dos).getTime() <= cutoff,
    );
  }
  if (req.search) {
    const q = req.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.patientLastName.toLowerCase().includes(q) ||
        r.patientFirstName.toLowerCase().includes(q) ||
        r.mrn.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    );
  }
  return filtered;
}

function applySort(rows: ARRow[], req: ARListRequest): ARRow[] {
  if (!req.sortColumn) return rows;
  const column = req.sortColumn;
  const dir = req.sortDir ?? 'asc';
  const factor = dir === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[column];
    const bv = (b as Record<string, unknown>)[column];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1; // nulls last
    if (bv === null || bv === undefined) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * factor;
    }
    // ARRow's sortable columns are only number/string/boolean/null. For any
    // value that isn't already a string, coerce via JSON so we never fall
    // back to "[object Object]" stringification.
    const aStr = typeof av === 'string' ? av : JSON.stringify(av);
    const bStr = typeof bv === 'string' ? bv : JSON.stringify(bv);
    return aStr.localeCompare(bStr) * factor;
  });
}

function applyPaging(rows: ARRow[], req: ARListRequest): ARRow[] {
  const start = req.pageIndex * req.pageSize;
  return rows.slice(start, start + req.pageSize);
}

// ---------------------------------------------------------------------------
// Note on the mock's request-shape leniency
//
// MSW handlers run on the browser side against requests built by the actions
// dispatcher. The dispatcher's `runHttp` serializes filter arrays as repeated
// query keys for GET — `?statuses=denied&statuses=rejected`. URLSearchParams
// then makes them readable via getAll(). For other shapes (numbers, sort) we
// parse into the ARListRequestSchema, which uses default() for pageIndex /
// pageSize / mode. The schema is the source of truth.
// ---------------------------------------------------------------------------

function parseListRequest(url: URL): ARListRequest {
  const params = url.searchParams;
  const raw: Record<string, unknown> = {};

  const single = ['mode', 'dosFrom', 'dosTo', 'search', 'sortColumn', 'sortDir'];
  for (const k of single) {
    const v = params.get(k);
    if (v !== null) raw[k] = v;
  }
  const multi = [
    'clinicIds',
    'providerIds',
    'payerIds',
    'ownerIds',
    'statuses',
    'priorities',
  ];
  for (const k of multi) {
    const all = params.getAll(k);
    if (all.length > 0) raw[k] = all;
  }
  const numeric = ['agingMinDays', 'pageIndex', 'pageSize'];
  for (const k of numeric) {
    const v = params.get(k);
    if (v !== null) {
      const n = Number(v);
      if (!Number.isNaN(n)) raw[k] = n;
    }
  }
  // Schema applies defaults for mode / pageIndex / pageSize.
  return ARListRequestSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export function buildARHandlers(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, '');

  return [
    // ---- List ------------------------------------------------------------

    http.get(`${base}/api/v1/ar`, ({ request }) => {
      let parsed: ARListRequest;
      try {
        parsed = parseListRequest(new URL(request.url));
      } catch (e) {
        return errorEnvelope(
          'VALIDATION_FAILED',
          e instanceof Error ? e.message : 'Bad request',
          400,
        );
      }
      const rows = getRowsForMode(parsed.mode);
      const filtered = applyFilters(rows, parsed);
      const sorted = applySort(filtered, parsed);
      const paged = applyPaging(sorted, parsed);
      const totalBalance = filtered.reduce((sum, r) => sum + r.balance, 0);
      const body: ARListResponse = {
        rows: paged,
        totalCount: filtered.length,
        totalBalance,
      };
      return HttpResponse.json(envelope(body));
    }),

    // ---- Single mutations ------------------------------------------------

    http.patch(`${base}/api/v1/ar/:rowId/owner`, async ({ params, request }) => {
      const rowId = String(params.rowId);
      const body = (await request.json()) as { ownerId: string | null };
      const ownerName =
        body.ownerId === null
          ? null
          : OWNERS.find((o) => o.id === body.ownerId)?.label ?? null;
      const updated = patchRow(rowId, { ownerId: body.ownerId, ownerName });
      if (!updated) return errorEnvelope('ROW_NOT_FOUND', `Row ${rowId} not found`, 404);
      return HttpResponse.json(envelope(updated));
    }),

    http.patch(`${base}/api/v1/ar/:rowId/due-date`, async ({ params, request }) => {
      const rowId = String(params.rowId);
      const body = (await request.json()) as { dueAt: string | null };
      const updated = patchRow(rowId, { dueAt: body.dueAt });
      if (!updated) return errorEnvelope('ROW_NOT_FOUND', `Row ${rowId} not found`, 404);
      return HttpResponse.json(envelope(updated));
    }),

    // ---- Bulk mutations --------------------------------------------------

    http.patch(`${base}/api/v1/ar:bulk-update-owner`, async ({ request }) => {
      const body = (await request.json()) as { rowIds: string[]; ownerId: string | null };
      const ownerName =
        body.ownerId === null
          ? null
          : OWNERS.find((o) => o.id === body.ownerId)?.label ?? null;
      const updated: ARRow[] = [];
      for (const id of body.rowIds) {
        const r = patchRow(id, { ownerId: body.ownerId, ownerName });
        if (r) updated.push(r);
      }
      return HttpResponse.json(envelope({ updated: updated.length, rows: updated }));
    }),

    http.patch(`${base}/api/v1/ar:bulk-update-due-date`, async ({ request }) => {
      const body = (await request.json()) as { rowIds: string[]; dueAt: string | null };
      const updated: ARRow[] = [];
      for (const id of body.rowIds) {
        const r = patchRow(id, { dueAt: body.dueAt });
        if (r) updated.push(r);
      }
      return HttpResponse.json(envelope({ updated: updated.length, rows: updated }));
    }),

    // ---- Add to workflow -------------------------------------------------

    http.post(`${base}/api/v1/workflow/cases:bulk`, async ({ request }) => {
      const body = (await request.json()) as {
        claimIds: string[];
        initialPriority: ARRow['priority'];
      };
      const moved = moveToWorking(body.claimIds, body.initialPriority);
      return HttpResponse.json(envelope({ added: moved.length, rows: moved }));
    }),

    // ---- Single row detail (for the row-click navigation target) --------

    http.get(`${base}/api/v1/ar/:rowId`, ({ params }) => {
      const rowId = String(params.rowId);
      const found = findRow(rowId);
      if (!found) return errorEnvelope('ROW_NOT_FOUND', `Row ${rowId} not found`, 404);
      return HttpResponse.json(envelope(found.row));
    }),

    // ---- Reference data --------------------------------------------------

    http.get(`${base}/api/v1/ref/clinics`, () =>
      HttpResponse.json(envelope({ items: CLINICS })),
    ),
    http.get(`${base}/api/v1/ref/providers`, () =>
      HttpResponse.json(envelope({ items: PROVIDERS })),
    ),
    http.get(`${base}/api/v1/ref/payers`, () =>
      HttpResponse.json(envelope({ items: PAYERS })),
    ),
    http.get(`${base}/api/v1/ref/owners`, () =>
      HttpResponse.json(envelope({ items: OWNERS })),
    ),
  ];
}
