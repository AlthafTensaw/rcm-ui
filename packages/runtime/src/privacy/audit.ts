/**
 * PHI audit helper.
 *
 * Phase 2 of the v3 plan, HIPAA primitive. Builds a properly-shaped audit event
 * for any PHI access. Components that reveal PHI (e.g., <PrivacyField> on
 * unmask) call `auditPHI(...)` to get a PlatformEvent ready for dispatch.
 *
 * The event payload is intentionally minimal — only the field key, record type,
 * and record id. No PHI values flow into the audit trail itself; the audit
 * answers "who looked at what record's what field, when" — not "what was the
 * value."
 */

import { buildEvent } from '../events/publish';
import type { PlatformEvent } from '../events/types';

interface AuditMetaInput {
  sourcePageId: string;
  sourceWidgetId?: string;
  sourceInstanceId?: string;
  sourceContainerId?: string;
  correlationId?: string;
  userId?: string;
  clinicId?: string | number;
}

interface AuditPHIArgs {
  /** What PHI activity is being audited. */
  kind: 'viewed' | 'revealed' | 'exported' | 'printed';
  /** Field key (e.g. 'ssn', 'dob'). */
  fieldKey?: string;
  /** Record type (e.g. 'patient', 'account'). */
  recordType: string;
  /** Record id. */
  recordId: string;
  /** For exports: the format ('csv', 'pdf'). */
  format?: string;
  meta: AuditMetaInput;
}

/**
 * Build a PHI audit event ready for `dispatch(publishEvent(event))`.
 */
export function auditPHI(args: AuditPHIArgs): PlatformEvent {
  const correlationId = args.meta.correlationId ?? generateCorrelationId();
  const baseMeta = {
    sourcePageId: args.meta.sourcePageId,
    sourceWidgetId: args.meta.sourceWidgetId,
    sourceInstanceId: args.meta.sourceInstanceId,
    sourceContainerId: args.meta.sourceContainerId,
    correlationId,
    userId: args.meta.userId,
    clinicId: args.meta.clinicId,
  };

  switch (args.kind) {
    case 'viewed':
      return buildEvent(
        'PHI_VIEWED',
        {
          fieldKey: args.fieldKey ?? 'unknown',
          recordType: args.recordType,
          recordId: args.recordId,
        },
        baseMeta,
      );
    case 'revealed':
      return buildEvent(
        'PHI_REVEALED',
        {
          fieldKey: args.fieldKey ?? 'unknown',
          recordType: args.recordType,
          recordId: args.recordId,
        },
        baseMeta,
      );
    case 'exported':
      return buildEvent(
        'PHI_EXPORTED',
        {
          recordType: args.recordType,
          recordId: args.recordId,
          format: args.format ?? 'unknown',
        },
        baseMeta,
      );
    case 'printed':
      return buildEvent(
        'PHI_PRINTED',
        {
          recordType: args.recordType,
          recordId: args.recordId,
        },
        baseMeta,
      );
  }
}

function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
