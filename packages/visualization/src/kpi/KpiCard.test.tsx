import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

/**
 * These tests verify the locked v3 behavior:
 *   - 'direct' direction: value goes UP → green; DOWN → red
 *   - 'inverse' direction: value goes UP → red; DOWN → green
 *   - 'neutral': always primary text color
 *
 * We probe by reading the rendered headline element's inline color style.
 */

function getValueColor(container: HTMLElement): string | undefined {
  // The value element is the largest font-size text in the card.
  const allDivs = container.querySelectorAll('div');
  let valueEl: HTMLElement | undefined;
  let maxSize = 0;
  for (const el of allDivs) {
    const size = parseInt((el as HTMLElement).style.fontSize ?? '0', 10);
    if (size > maxSize) {
      maxSize = size;
      valueEl = el;
    }
  }
  return valueEl?.style.color;
}

describe('KpiCard direction handling', () => {
  it('direct: value increased → green color', () => {
    const { container } = render(
      <KpiCard
        label="Collections"
        value={392136}
        priorValue={343255}
        direction="direct"
      />,
    );
    expect(getValueColor(container)).toMatch(/059669|success/);
  });

  it('direct: value decreased → red color', () => {
    const { container } = render(
      <KpiCard
        label="Collections"
        value={300000}
        priorValue={343255}
        direction="direct"
      />,
    );
    expect(getValueColor(container)).toMatch(/DC2626|danger/);
  });

  it('inverse: value increased (denials up) → red color (bad trend)', () => {
    const { container } = render(
      <KpiCard
        label="Total Denials"
        value={392136}
        priorValue={343255}
        direction="inverse"
      />,
    );
    expect(getValueColor(container)).toMatch(/DC2626|danger/);
  });

  it('inverse: value decreased (denials down) → green color (good trend)', () => {
    const { container } = render(
      <KpiCard
        label="Total Denials"
        value={300000}
        priorValue={343255}
        direction="inverse"
      />,
    );
    expect(getValueColor(container)).toMatch(/059669|success/);
  });

  it('neutral: no color signal regardless of trend', () => {
    const { container } = render(
      <KpiCard
        label="Total Volume"
        value={500}
        priorValue={400}
        direction="neutral"
      />,
    );
    expect(getValueColor(container)).toMatch(/1F2937|primary/);
  });

  it('no priorValue: default text color (no direction signal possible)', () => {
    const { container } = render(<KpiCard label="Volume" value={500} />);
    expect(getValueColor(container)).toMatch(/1F2937|primary/);
  });

  it('zero delta: neutral color even with direction set', () => {
    const { container } = render(
      <KpiCard label="Collections" value={100} priorValue={100} direction="direct" />,
    );
    expect(getValueColor(container)).toMatch(/1F2937|primary/);
  });

  it('renders em-dash for null value', () => {
    const { container } = render(<KpiCard label="X" value={null} />);
    expect(container.textContent).toContain('—');
  });
});
