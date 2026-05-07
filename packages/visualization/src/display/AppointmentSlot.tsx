/**
 * AppointmentSlot — time-slotted row item for the scheduler.
 *
 * Pattern from the calendar/scheduler screens: time on left, patient and
 * appointment details in the middle, status/balance/icons on the right.
 *
 * Designed for vertical stacking in a day-view column. Selectable.
 */

import type { CSSProperties, ReactNode } from 'react';
import { StatusBadge } from '../status/StatusBadge';

export interface AppointmentSlotProps {
  /** Slot time. e.g. "8:00 AM". */
  time: string;
  /** Patient name. e.g. "Andrews, Jenny". */
  patientName: string;
  /** Patient DOB or age. e.g. "07/14/1991", "47 yrs". */
  patientDob?: string;
  /** Provider abbreviation. e.g. "Dr. Aligeti". */
  provider?: string;
  /** Visit type. e.g. "Stress Echo", "Office-Establish", "Echo". */
  visitType?: string;
  /** Location. e.g. "BSW Frisco", "Office". */
  location?: string;
  /** Optional MRN for caller side. Not displayed by default. */
  mrn?: string;
  /** Status taxonomy + key (uses the 'appointment' taxonomy by default). */
  status?: { taxonomy: string; status: string };
  /** Optional financial summary line. e.g. "Co:$40 Ded:$700 Bal:-$164.86". */
  financialSummary?: string;
  /** Trailing icon slot (e-prescribe / R / E indicators from screens). */
  trailingIcons?: ReactNode;
  /** Selected state. */
  selected?: boolean;
  /** Click handler. */
  onClick?: () => void;
  /** Compact density for narrow columns. */
  compact?: boolean;
}

export function AppointmentSlot({
  time,
  patientName,
  patientDob,
  provider,
  visitType,
  location,
  status,
  financialSummary,
  trailingIcons,
  selected = false,
  onClick,
  compact = false,
}: AppointmentSlotProps) {
  const containerStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(60px, auto) 1fr auto',
    gap: 12,
    padding: compact ? '6px 10px' : '10px 12px',
    background: selected
      ? 'var(--tw-color-brand-tint, #EBF7F6)'
      : 'var(--tw-color-surface-raised, #FFFFFF)',
    border: '1px solid',
    borderColor: selected
      ? 'var(--tw-color-brand-accent, #218D8D)'
      : 'var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 8,
    cursor: onClick ? 'pointer' : 'default',
    fontFamily: 'system-ui, sans-serif',
    alignItems: 'flex-start',
    transition: 'background 120ms ease',
  };

  const timeStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    paddingTop: 2,
    whiteSpace: 'nowrap',
  };

  const patientNameStyle: CSSProperties = {
    fontSize: compact ? 12 : 13,
    fontWeight: 600,
    color: 'var(--tw-color-text-primary, #1F2937)',
    lineHeight: 1.3,
  };

  const detailsStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-muted, #6B7280)',
    marginTop: 2,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  };

  const financialStyle: CSSProperties = {
    fontSize: 11,
    color: 'var(--tw-color-text-secondary, #4B5563)',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    marginTop: 2,
  };

  const trailingStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-selected={selected || undefined}
      aria-label={`Appointment at ${time} for ${patientName}`}
    >
      <span style={timeStyle}>{time}</span>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={patientNameStyle}>{patientName}</span>
          {patientDob ? (
            <span style={{ fontSize: 11, color: 'var(--tw-color-text-muted, #6B7280)' }}>
              {patientDob}
            </span>
          ) : null}
        </div>
        {(provider || visitType || location) ? (
          <div style={detailsStyle}>
            {provider ? <span>{provider}</span> : null}
            {visitType ? <span>{visitType}</span> : null}
            {location ? <span>{location}</span> : null}
          </div>
        ) : null}
        {financialSummary ? <div style={financialStyle}>{financialSummary}</div> : null}
      </div>

      <div style={trailingStyle}>
        {status ? (
          <StatusBadge taxonomy={status.taxonomy} status={status.status} size="compact" />
        ) : null}
        {trailingIcons}
      </div>
    </div>
  );
}
