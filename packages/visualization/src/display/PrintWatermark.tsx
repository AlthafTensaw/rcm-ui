/**
 * PrintWatermark — HIPAA-required print/export attribution.
 *
 * Per v3 plan §2.4: "Print/Export views must show user identity and timestamp
 * watermark."
 *
 * Two pieces:
 *
 * 1. <PrintWatermark> — a React component that renders identity + timestamp
 *    only when the page is being printed. Uses CSS `@media print` so it's
 *    invisible on screen and visible in the print preview/output.
 *
 * 2. `applyPrintWatermarkStyles()` — injects the @media print stylesheet into
 *    <head> exactly once. Calls dispatch a PHI_PRINTED audit event when
 *    `beforeprint` fires.
 *
 * Usage:
 *
 *   import { PrintWatermark, usePrintAudit } from '@tensaw/visualization';
 *
 *   function PatientDetailPage({ patientId }) {
 *     usePrintAudit({ recordType: 'patient', recordId: patientId });
 *     return (
 *       <>
 *         <PrintWatermark userIdentity="alex.smith@tensaw.health" />
 *         {/* page content *\/}
 *       </>
 *     );
 *   }
 */

import { useEffect, type CSSProperties } from 'react';
import { buildEvent, publishEvent, auditPHI } from '@tensaw/runtime';

export interface PrintWatermarkProps {
  /** Who is printing — usually the signed-in user's email or full name. */
  userIdentity: string;
  /** Optional context string. e.g. "Patient: 11403 · Encounter: 2024-08-12". */
  context?: string;
  /** Override the timestamp. Default: now (formatted ISO + locale). */
  timestamp?: Date;
  /** Additional disclaimer text (right edge). */
  disclaimer?: string;
}

/**
 * Renders a print-only header with identity + timestamp. Hidden on screen.
 */
export function PrintWatermark({
  userIdentity,
  context,
  timestamp,
  disclaimer = 'Confidential — contains protected health information (PHI).',
}: PrintWatermarkProps) {
  const ts = timestamp ?? new Date();
  const formatted = formatPrintTimestamp(ts);

  // The class name + the global stylesheet (added once) toggles visibility.
  // We inject the stylesheet on first render of any PrintWatermark.
  useEffect(() => {
    ensurePrintWatermarkStylesInjected();
  }, []);

  const containerStyle: CSSProperties = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 10,
    color: '#374151',
  };

  return (
    <div className="tensaw-print-watermark" style={containerStyle} aria-hidden>
      <div className="tensaw-print-watermark-row">
        <span className="tensaw-print-watermark-identity">
          Printed by <strong>{userIdentity}</strong>
        </span>
        <span className="tensaw-print-watermark-timestamp">{formatted}</span>
      </div>
      {context ? (
        <div className="tensaw-print-watermark-context">{context}</div>
      ) : null}
      <div className="tensaw-print-watermark-disclaimer">{disclaimer}</div>
    </div>
  );
}

/**
 * Hook: dispatches PHI_PRINTED on `beforeprint` and PHI_EXPORTED if the page
 * is being saved as PDF (we can't reliably distinguish, so we audit print).
 *
 * Pass at the top of any page that displays PHI and supports print.
 */
export function usePrintAudit(args: {
  recordType: string;
  recordId: string;
  sourcePageId?: string;
}) {
  useEffect(() => {
    function handleBeforePrint() {
      const event = auditPHI({
        kind: 'printed',
        recordType: args.recordType,
        recordId: args.recordId,
        meta: {
          sourcePageId: args.sourcePageId ?? args.recordType,
        },
      });
      publishEvent(event);
    }
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, [args.recordType, args.recordId, args.sourcePageId]);
}

/**
 * Programmatic export-audit helper for code paths that bypass the browser's
 * print dialog (CSV download, PDF generation, fax send).
 */
export function auditExport(args: {
  recordType: string;
  recordId: string;
  format: string;
  sourcePageId?: string;
}): void {
  publishEvent(
    buildEvent(
      'PHI_EXPORTED',
      {
        recordType: args.recordType,
        recordId: args.recordId,
        format: args.format,
      },
      {
        sourcePageId: args.sourcePageId ?? args.recordType,
        correlationId:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2),
      },
    ),
  );
}

// -- Internals ---------------------------------------------------------------

const STYLE_ID = 'tensaw-print-watermark-styles';

function ensurePrintWatermarkStylesInjected(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.tensaw-print-watermark {
  display: none;
}
@media print {
  .tensaw-print-watermark {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 8px 12px;
    border-bottom: 1px solid #D1D5DB;
    background: #FFFFFF;
    z-index: 9999;
  }
  .tensaw-print-watermark-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .tensaw-print-watermark-context {
    margin-top: 2px;
    font-size: 9px;
    color: #6B7280;
  }
  .tensaw-print-watermark-disclaimer {
    margin-top: 2px;
    font-size: 9px;
    color: #991B1B;
    font-weight: 500;
  }
  /* Push page content down so the fixed watermark doesn't overlap. */
  body {
    padding-top: 60px;
  }
}
`.trim();
  document.head.appendChild(style);
}

function formatPrintTimestamp(d: Date): string {
  // Locale-aware short timestamp + ISO for unambiguous record.
  const pad = (n: number) => String(n).padStart(2, '0');
  const localStr = d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const iso = `${String(d.getUTCFullYear())}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
  return `${localStr} (${iso})`;
}
