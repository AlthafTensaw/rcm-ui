/**
 * Platform event catalog.
 *
 * Phase 1.4 of the v3 plan. Single source of truth for every event the
 * platform recognizes. Adding an event = adding it here. Events not in this
 * catalog are rejected by the event middleware in dev mode.
 *
 * Each event has:
 *   - A Zod payload schema (validated in dev)
 *   - A category (enables broad subscription)
 *
 * Payload types are inferred from the schemas — callers get full type safety
 * without writing 30 separate exported types.
 */

import { z } from 'zod';
import type { EventCategory } from './types';

// -- Payload schemas ---------------------------------------------------------

// Common payload pieces
const idPayload = (idKey: string) =>
  z.object({
    [idKey]: z.string(),
  });

const containerKeyPayload = z.object({
  pageId: z.string(),
  containerId: z.string(),
});

export const EVENT_SCHEMAS = {
  // -- Context -------------------------------------------------------------
  PATIENT_SELECTED: z.object({
    patientId: z.string(),
    patientDisplayName: z.string().optional(),
    mrn: z.string().optional(),
  }),
  ACCOUNT_SELECTED: idPayload('accountId'),
  CLAIM_SELECTED: idPayload('claimId'),
  ENCOUNTER_SELECTED: idPayload('encounterId'),
  APPOINTMENT_SELECTED: idPayload('appointmentId'),
  REMIT_SELECTED: idPayload('remitId'),
  CLINIC_SWITCHED: z.object({
    clinicId: z.union([z.string(), z.number()]),
    clinicName: z.string().optional(),
  }),

  // -- UI ------------------------------------------------------------------
  LEFT_PANEL_WIDTH_CHANGED: z.object({
    pageId: z.string(),
    width: z.number().nonnegative(),
  }),
  RIGHT_PANEL_WIDTH_CHANGED: z.object({
    pageId: z.string(),
    width: z.number().nonnegative(),
  }),
  CONTAINER_EXPANDED: containerKeyPayload,
  CONTAINER_COLLAPSED: containerKeyPayload,
  CONTAINER_TAB_CHANGED: containerKeyPayload.extend({
    tabId: z.string(),
  }),
  FILTERS_CHANGED: z.object({
    pageId: z.string(),
    widgetInstanceId: z.string(),
    filters: z.record(z.unknown()),
  }),
  SORT_CHANGED: z.object({
    pageId: z.string(),
    widgetInstanceId: z.string(),
    sortBy: z.string(),
    direction: z.enum(['asc', 'desc']),
  }),
  DATE_RANGE_CHANGED: z.object({
    pageId: z.string(),
    widgetInstanceId: z.string(),
    from: z.string(),
    to: z.string(),
  }),

  // -- Surface -------------------------------------------------------------
  MODAL_OPEN_REQUESTED: z.object({
    componentId: z.string(),
    props: z.record(z.unknown()).optional(),
  }),
  MODAL_CLOSED: z.object({
    surfaceId: z.string(),
  }),
  DRAWER_OPENED: z.object({
    componentId: z.string(),
    props: z.record(z.unknown()).optional(),
  }),
  DRAWER_CLOSED: z.object({
    surfaceId: z.string(),
  }),
  ASSISTANT_PANE_TOGGLED: z.object({
    open: z.boolean(),
  }),

  // -- Workflow ------------------------------------------------------------
  WIDGET_REFRESH_REQUESTED: z.object({
    widgetInstanceId: z.string(),
  }),
  WIDGET_DATA_LOADED: z.object({
    widgetInstanceId: z.string(),
    rowCount: z.number().int().nonnegative().optional(),
  }),
  WORKLIST_ROW_OPENED: z.object({
    domain: z.string(),
    rowId: z.string(),
  }),

  // -- Data ----------------------------------------------------------------
  PAYMENT_POSTED: z.object({
    accountId: z.string(),
    amount: z.number(),
    paymentMethod: z.string(),
  }),
  CLAIM_SUBMITTED: idPayload('claimId'),
  NOTE_ADDED: z.object({
    targetType: z.enum(['patient', 'account', 'claim', 'encounter']),
    targetId: z.string(),
    noteId: z.string(),
  }),
  FAX_SENT: z.object({
    targetType: z.string(),
    targetId: z.string(),
    recipient: z.string(),
  }),
  EMAIL_SENT: z.object({
    targetType: z.string(),
    targetId: z.string(),
    recipient: z.string(),
  }),

  // -- System --------------------------------------------------------------
  PREFERENCE_SAVE_REQUESTED: z.object({
    keys: z.array(z.string()),
  }),
  PREFERENCE_SAVE_SUCCEEDED: z.object({
    keys: z.array(z.string()),
    savedAt: z.string(),
  }),
  PREFERENCE_SAVE_FAILED: z.object({
    keys: z.array(z.string()),
    errorCode: z.string(),
    errorMessage: z.string(),
  }),
  DIRTY_STATE_BLOCKED_CONTEXT_CHANGE: z.object({
    blockedEventName: z.string(),
    dirtyInstanceIds: z.array(z.string()),
  }),
  TOAST_REQUESTED: z.object({
    severity: z.enum(['info', 'success', 'warning', 'error']),
    title: z.string(),
    body: z.string().nullable().optional(),
    durationMs: z.number().int().positive().nullable().optional(),
  }),
  ERROR_RECEIVED: z.object({
    code: z.string(),
    message: z.string(),
    httpStatus: z.number().int().optional(),
  }),
  SESSION_EXPIRED: z.object({}).strict(),

  // -- Audit (HIPAA) -------------------------------------------------------
  PHI_VIEWED: z.object({
    fieldKey: z.string(),
    recordType: z.string(),
    recordId: z.string(),
  }),
  PHI_REVEALED: z.object({
    fieldKey: z.string(),
    recordType: z.string(),
    recordId: z.string(),
  }),
  PHI_EXPORTED: z.object({
    recordType: z.string(),
    recordId: z.string(),
    format: z.string(),
  }),
  PHI_PRINTED: z.object({
    recordType: z.string(),
    recordId: z.string(),
  }),
} as const satisfies Record<string, z.ZodTypeAny>;

export type EventName = keyof typeof EVENT_SCHEMAS;

export type EventPayload<E extends EventName> = z.infer<(typeof EVENT_SCHEMAS)[E]>;

// -- Categories --------------------------------------------------------------

export const EVENT_CATEGORIES: Record<EventName, EventCategory> = {
  PATIENT_SELECTED: 'context',
  ACCOUNT_SELECTED: 'context',
  CLAIM_SELECTED: 'context',
  ENCOUNTER_SELECTED: 'context',
  APPOINTMENT_SELECTED: 'context',
  REMIT_SELECTED: 'context',
  CLINIC_SWITCHED: 'context',

  LEFT_PANEL_WIDTH_CHANGED: 'ui',
  RIGHT_PANEL_WIDTH_CHANGED: 'ui',
  CONTAINER_EXPANDED: 'ui',
  CONTAINER_COLLAPSED: 'ui',
  CONTAINER_TAB_CHANGED: 'ui',
  FILTERS_CHANGED: 'ui',
  SORT_CHANGED: 'ui',
  DATE_RANGE_CHANGED: 'ui',

  MODAL_OPEN_REQUESTED: 'surface',
  MODAL_CLOSED: 'surface',
  DRAWER_OPENED: 'surface',
  DRAWER_CLOSED: 'surface',
  ASSISTANT_PANE_TOGGLED: 'surface',

  WIDGET_REFRESH_REQUESTED: 'workflow',
  WIDGET_DATA_LOADED: 'workflow',
  WORKLIST_ROW_OPENED: 'workflow',

  PAYMENT_POSTED: 'data',
  CLAIM_SUBMITTED: 'data',
  NOTE_ADDED: 'data',
  FAX_SENT: 'data',
  EMAIL_SENT: 'data',

  PREFERENCE_SAVE_REQUESTED: 'system',
  PREFERENCE_SAVE_SUCCEEDED: 'system',
  PREFERENCE_SAVE_FAILED: 'system',
  DIRTY_STATE_BLOCKED_CONTEXT_CHANGE: 'system',
  TOAST_REQUESTED: 'system',
  ERROR_RECEIVED: 'system',
  SESSION_EXPIRED: 'system',

  PHI_VIEWED: 'audit',
  PHI_REVEALED: 'audit',
  PHI_EXPORTED: 'audit',
  PHI_PRINTED: 'audit',
};

// -- Catalog membership helpers ----------------------------------------------

export function isCatalogedEvent(name: string): name is EventName {
  return name in EVENT_SCHEMAS;
}

export function validatePayload<E extends EventName>(
  name: E,
  payload: unknown,
): { ok: true; payload: EventPayload<E> } | { ok: false; issues: string[] } {
  const schema = EVENT_SCHEMAS[name];
  const result = schema.safeParse(payload);
  if (result.success) {
    return { ok: true, payload: result.data };
  }
  return {
    ok: false,
    issues: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  };
}
