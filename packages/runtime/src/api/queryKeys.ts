/**
 * Query key registry.
 *
 * Replaces RTK Query's `tagTypes` array (Patient, Account, Claim, ...). Each
 * domain owns a small group of factories. Invalidation by prefix:
 *
 *   queryClient.invalidateQueries({ queryKey: queryKeys.patient.all });
 *   // invalidates everything under ['patient', ...]
 *
 *   queryClient.invalidateQueries({ queryKey: queryKeys.patient.detail('p-1') });
 *   // invalidates exactly one query
 *
 * The 13 RTK Query tag types map 1-to-1:
 *   Patient        → queryKeys.patient
 *   Account        → queryKeys.account
 *   Claim          → queryKeys.claim
 *   Encounter      → queryKeys.encounter
 *   Appointment    → queryKeys.appointment
 *   Remit          → queryKeys.remit
 *   Note           → queryKeys.note
 *   Document       → queryKeys.document
 *   Insurance      → queryKeys.insurance
 *   Authorization  → queryKeys.authorization
 *   UserPreferences → queryKeys.preferences
 *   Permission     → queryKeys.permission
 *   Notification   → queryKeys.notification
 *
 * Action-domain queries (the `@tensaw/actions` dispatcher's per-action keys)
 * use a separate prefix `['action', actionId, ...]` — see queryKeys.action.
 */

export const queryKeys = {
  patient: {
    all: ['patient'] as const,
    detail: (id: string) => ['patient', 'detail', id] as const,
    list: (filters: Record<string, unknown>) =>
      ['patient', 'list', filters] as const,
  },
  account: {
    all: ['account'] as const,
    detail: (id: string) => ['account', 'detail', id] as const,
    list: (filters: Record<string, unknown>) =>
      ['account', 'list', filters] as const,
  },
  claim: {
    all: ['claim'] as const,
    detail: (id: string) => ['claim', 'detail', id] as const,
    list: (filters: Record<string, unknown>) =>
      ['claim', 'list', filters] as const,
  },
  encounter: {
    all: ['encounter'] as const,
    detail: (id: string) => ['encounter', 'detail', id] as const,
  },
  appointment: {
    all: ['appointment'] as const,
    detail: (id: string) => ['appointment', 'detail', id] as const,
  },
  remit: {
    all: ['remit'] as const,
    detail: (id: string) => ['remit', 'detail', id] as const,
  },
  note: {
    all: ['note'] as const,
    forEntity: (entityType: string, entityId: string) =>
      ['note', entityType, entityId] as const,
  },
  document: {
    all: ['document'] as const,
    detail: (id: string) => ['document', 'detail', id] as const,
  },
  insurance: {
    all: ['insurance'] as const,
    forPatient: (patientId: string) =>
      ['insurance', 'patient', patientId] as const,
  },
  authorization: {
    all: ['authorization'] as const,
    detail: (id: string) => ['authorization', 'detail', id] as const,
  },
  preferences: {
    all: ['preferences'] as const,
  },
  permission: {
    all: ['permission'] as const,
  },
  notification: {
    all: ['notification'] as const,
  },

  /**
   * Action dispatcher's per-action keys. Each query/mutation in the
   * `@tensaw/actions` registry uses
   *   ['action', actionId, requestStringified]
   * The dispatcher composes this internally; pages don't reach for it.
   *
   * Invalidation by action's `cache.tag` is done via the invalidationsByTag
   * map maintained by `@tensaw/actions/registry`.
   */
  action: {
    all: ['action'] as const,
    forActionId: (actionId: string) => ['action', actionId] as const,
    forActionWithRequest: (actionId: string, requestKey: string) =>
      ['action', actionId, requestKey] as const,
  },
} as const;

/**
 * Helpers used by `@tensaw/actions` to compose action keys uniformly.
 *
 * The dispatcher imports these so its key shape stays consistent with the
 * platform-wide convention.
 */
export type ActionQueryKey = readonly ['action', string, string];

export function buildActionQueryKey(
  actionId: string,
  requestKey: string,
): ActionQueryKey {
  return ['action', actionId, requestKey] as const;
}
