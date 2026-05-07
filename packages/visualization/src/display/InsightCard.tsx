/**
 * InsightCard — subtle-background card for AI insights, suggested next steps,
 * and other interpretive content (the "Explain This Comparison" /
 * "Insights" sections from the PromptQL screens).
 *
 * Visually quieter than AlertCard. Uses the brand teal tint as the default
 * background since insights are a brand-feature, not a system message.
 */

import type { CSSProperties, ReactNode } from 'react';

export interface InsightCardProps {
  /** Short title — required. e.g. "Insights", "Explain This Comparison". */
  title: string;
  /** Body content. */
  children: ReactNode;
  /** Optional action element (link/button) at the bottom. */
  action?: ReactNode;
  /** Optional leading icon. Defaults to ✨ for the AI-feel. */
  icon?: ReactNode | false;
  /** Tone variant. Default 'brand' (teal tint). */
  tone?: 'brand' | 'neutral';
}

const TONE: Record<
  NonNullable<InsightCardProps['tone']>,
  { bg: string; border: string; titleColor: string }
> = {
  brand: {
    bg: 'var(--tw-color-brand-tint, #EBF7F6)',
    border: 'var(--tw-color-border-muted, #E5E7EB)',
    titleColor: 'var(--tw-color-brand-accent, #218D8D)',
  },
  neutral: {
    bg: 'var(--tw-color-surface-muted, #F9FAFB)',
    border: 'var(--tw-color-border-muted, #E5E7EB)',
    titleColor: 'var(--tw-color-text-primary, #1F2937)',
  },
};

export function InsightCard({
  title,
  children,
  action,
  icon = '✨',
  tone = 'brand',
}: InsightCardProps) {
  const palette = TONE[tone];

  const containerStyle: CSSProperties = {
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    padding: 14,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    lineHeight: 1.55,
    color: 'var(--tw-color-text-primary, #1F2937)',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: palette.titleColor,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const actionStyle: CSSProperties = {
    marginTop: 10,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        {icon !== false ? <span aria-hidden>{icon}</span> : null}
        <span>{title}</span>
      </div>
      <div>{children}</div>
      {action ? <div style={actionStyle}>{action}</div> : null}
    </div>
  );
}
