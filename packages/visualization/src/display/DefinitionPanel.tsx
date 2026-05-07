/**
 * DefinitionPanel — read-only display for metric formulas and data definitions.
 *
 * Used in the "Pinned Answers" / "Recipes" / "Metrics" admin pages where the
 * platform shows the calculation logic behind a metric. The screen pattern:
 *
 *   ┌──────────────────────────┐
 *   │ Net Collections          │  numerator (top, bigger)
 *   ├──────────────────────────┤  divider line
 *   │ Total Charges            │  denominator (bottom)
 *   └──────────────────────────┘
 *
 * This component renders that visual fraction. For non-fraction definitions,
 * pass `body` instead of `numerator`/`denominator` and it renders as a single
 * code-block.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface DefinitionPanelProps {
  /** Optional title above the formula. e.g. "Calculation Logic". */
  title?: string;
  /**
   * Numerator content for fraction-style display. If both numerator and
   * denominator are provided, renders as a stacked fraction.
   */
  numerator?: ReactNode;
  denominator?: ReactNode;
  /**
   * Single-block body content — used when the definition is not a fraction.
   * Ignored if numerator+denominator are provided.
   */
  body?: ReactNode;
  /** Optional footnote below. */
  footnote?: string;
}

export function DefinitionPanel({
  title,
  numerator,
  denominator,
  body,
  footnote,
}: DefinitionPanelProps) {
  const containerStyle: CSSProperties = {
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    color: 'var(--tw-color-text-primary, #1F2937)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--tw-color-text-muted, #6B7280)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const formulaContainerStyle: CSSProperties = {
    background: 'var(--tw-color-surface-muted, #F9FAFB)',
    border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    borderRadius: 8,
    padding: '12px 16px',
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 13,
    color: 'var(--tw-color-text-primary, #1F2937)',
  };

  const fractionRowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  };

  const dividerStyle: CSSProperties = {
    width: '100%',
    height: 1,
    background: 'var(--tw-color-text-secondary, #6B7280)',
  };

  const fractionHalfStyle: CSSProperties = {
    padding: '2px 8px',
    textAlign: 'center',
  };

  const footnoteStyle: CSSProperties = {
    marginTop: 6,
    fontSize: 12,
    color: 'var(--tw-color-text-muted, #6B7280)',
  };

  const isFraction = numerator !== undefined && denominator !== undefined;

  return (
    <div style={containerStyle}>
      {title ? <div style={titleStyle}>{title}</div> : null}
      <div style={formulaContainerStyle}>
        {isFraction ? (
          <div style={fractionRowStyle}>
            <span style={fractionHalfStyle}>{numerator}</span>
            <span style={dividerStyle} aria-hidden />
            <span style={fractionHalfStyle}>{denominator}</span>
          </div>
        ) : (
          <div>{body}</div>
        )}
      </div>
      {footnote ? <div style={footnoteStyle}>{footnote}</div> : null}
    </div>
  );
}
