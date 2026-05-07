/**
 * AR Mgmt Portal — actions registry.
 *
 * Defines every action the page can dispatch. Aligns 1:1 with the spec
 * examples in §13 of ACTION_CONTRACT.md and exercises §15:
 *
 *   - `claims.add-to-workflow` declares `timeoutMs: 120_000` because adding
 *     500+ claims may take well past the 30s default.
 *   - `ar.list` keeps the default cache key (deterministic stringify).
 *   - All mutations declare optimistic patterns for inline editing.
 *
 * Actions to register at app boot:
 *
 *   import { registerARActions } from './pages/ar-mgmt/actions';
 *   registerARActions();
 */

import { z } from 'zod';
import { defineAction } from '@tensaw/actions';
import {
  ARRowSchema,
  ARListRequestSchema,
  ARListResponseSchema,
  PriorityEnum,
} from '@tensaw/mock-server';

/**
 * Register all AR Mgmt actions. Idempotent on the registry side
 * (defineAction throws on duplicate id, but for a single-app boot path
 * that's the right behavior — duplicates indicate a programming error).
 */
export function registerARActions(): void {
  // ---- Queries -----------------------------------------------------------

  defineAction({
    actionId: 'ar.list',
    kind: 'query',
    endpoint: 'GET /api/v1/ar',
    permission: 'ar.read',
    description: 'List AR rows with filter, sort, and pagination.',
    request: ARListRequestSchema,
    response: ARListResponseSchema,
    cache: {
      tag: 'ar-list',
      invalidatedBy: [
        'ar.update-owner',
        'ar.update-due-date',
        'ar.bulk-update-owner',
        'ar.bulk-update-due-date',
        'claims.add-to-workflow',
      ],
    },
  });

  defineAction({
    actionId: 'ar.get-detail',
    kind: 'query',
    endpoint: 'GET /api/v1/ar/{rowId}',
    permission: 'ar.read',
    description: 'Fetch a single AR row by id.',
    request: z.object({ rowId: z.string() }),
    response: ARRowSchema,
    cache: { tag: 'ar-detail' },
  });

  defineAction({
    actionId: 'ref.clinics',
    kind: 'query',
    endpoint: 'GET /api/v1/ref/clinics',
    permission: 'ar.read',
    description: 'Reference-data lookup: clinics.',
    request: z.object({}),
    response: z.object({ items: z.array(z.object({ id: z.string(), label: z.string() })) }),
    cache: { tag: 'ref-clinics' },
  });

  defineAction({
    actionId: 'ref.providers',
    kind: 'query',
    endpoint: 'GET /api/v1/ref/providers',
    permission: 'ar.read',
    description: 'Reference-data lookup: providers.',
    request: z.object({}),
    response: z.object({ items: z.array(z.object({ id: z.string(), label: z.string() })) }),
    cache: { tag: 'ref-providers' },
  });

  defineAction({
    actionId: 'ref.payers',
    kind: 'query',
    endpoint: 'GET /api/v1/ref/payers',
    permission: 'ar.read',
    description: 'Reference-data lookup: payers.',
    request: z.object({}),
    response: z.object({ items: z.array(z.object({ id: z.string(), label: z.string() })) }),
    cache: { tag: 'ref-payers' },
  });

  defineAction({
    actionId: 'ref.owners',
    kind: 'query',
    endpoint: 'GET /api/v1/ref/owners',
    permission: 'ar.read',
    description: 'Reference-data lookup: owners (assignable users).',
    request: z.object({}),
    response: z.object({ items: z.array(z.object({ id: z.string(), label: z.string() })) }),
    cache: { tag: 'ref-owners' },
  });

  // ---- Single-row mutations ---------------------------------------------

  defineAction({
    actionId: 'ar.update-owner',
    kind: 'mutation',
    endpoint: 'PATCH /api/v1/ar/{rowId}/owner',
    permission: 'ar.write',
    description: 'Assign or unassign the owner for a single AR row.',
    request: z.object({
      rowId: z.string(),
      ownerId: z.string().nullable(),
    }),
    response: ARRowSchema,
    optimistic: {
      pattern: 'update-row-field',
      target: 'ar-list',
      rowIdFrom: (req) => (req as { rowId: string }).rowId,
      fields: (req) => ({ ownerId: (req as { ownerId: string | null }).ownerId }),
    },
    onSuccess: { toast: 'Owner updated' },
    onError: { toast: { kind: 'error-message' } },
  });

  defineAction({
    actionId: 'ar.update-due-date',
    kind: 'mutation',
    endpoint: 'PATCH /api/v1/ar/{rowId}/due-date',
    permission: 'ar.write',
    description: 'Update the due date for a single AR row.',
    request: z.object({
      rowId: z.string(),
      dueAt: z.string().nullable(),
    }),
    response: ARRowSchema,
    optimistic: {
      pattern: 'update-row-field',
      target: 'ar-list',
      rowIdFrom: (req) => (req as { rowId: string }).rowId,
      fields: (req) => ({ dueAt: (req as { dueAt: string | null }).dueAt }),
    },
    onSuccess: { toast: 'Due date updated' },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Bulk mutations ---------------------------------------------------
  //
  // Bulk mutations skip the "update-row-field" optimistic pattern (it
  // doesn't model "patch many rows at once"). The cache invalidation listed
  // in `ar.list` will refetch the page after the mutation resolves.

  defineAction({
    actionId: 'ar.bulk-update-owner',
    kind: 'mutation',
    endpoint: 'PATCH /api/v1/ar:bulk-update-owner',
    permission: 'ar.write',
    description: 'Assign owner to many AR rows in one call.',
    request: z.object({
      rowIds: z.array(z.string()).min(1),
      ownerId: z.string().nullable(),
    }),
    response: z.object({ updated: z.number(), rows: z.array(ARRowSchema) }),
    onSuccess: {
      toast: (res) =>
        `Owner updated on ${String((res as { updated: number }).updated)} rows`,
    },
    onError: { toast: { kind: 'error-message' } },
  });

  defineAction({
    actionId: 'ar.bulk-update-due-date',
    kind: 'mutation',
    endpoint: 'PATCH /api/v1/ar:bulk-update-due-date',
    permission: 'ar.write',
    description: 'Set due date on many AR rows in one call.',
    request: z.object({
      rowIds: z.array(z.string()).min(1),
      dueAt: z.string().nullable(),
    }),
    response: z.object({ updated: z.number(), rows: z.array(ARRowSchema) }),
    onSuccess: {
      toast: (res) =>
        `Due date updated on ${String((res as { updated: number }).updated)} rows`,
    },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Add to workflow (long-running — uses §15.2 timeout override) ----

  defineAction({
    actionId: 'claims.add-to-workflow',
    kind: 'mutation',
    endpoint: 'POST /api/v1/workflow/cases:bulk',
    permission: 'workflow.write',
    description: 'Promote a set of candidate claims into active workflow.',
    request: z.object({
      claimIds: z.array(z.string()).min(1),
      initialPriority: PriorityEnum,
    }),
    response: z.object({ added: z.number(), rows: z.array(ARRowSchema) }),
    // §15.2 — bulk add can take up to 2 minutes for a few hundred claims.
    timeoutMs: 120_000,
    onSuccess: {
      toast: (res) =>
        `${String((res as { added: number }).added)} claims added to workflow`,
    },
    onError: { toast: { kind: 'error-message' } },
  });

  // ---- Navigate ---------------------------------------------------------

  defineAction({
    actionId: 'ar.open-detail',
    kind: 'navigate',
    permission: 'ar.read',
    description: 'Navigate to the AR row detail page.',
    request: z.object({ rowId: z.string() }),
    to: (args) => `/ar/${args.rowId}`,
  });
}
