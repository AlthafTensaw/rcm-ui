import { render } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { Icon } from './Icon';

describe('Icon', () => {
  it('renders the named Lucide icon', () => {
    const { container } = render(<Icon name="Check" aria-label="Done" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-label')).toBe('Done');
  });

  it.each([
    ['xs', '12'],
    ['sm', '16'],
    ['md', '20'],
    ['lg', '24'],
    ['xl', '32'],
  ] as const)('maps size %s to %s px', (size, px) => {
    const { container } = render(<Icon name="Check" size={size} aria-hidden />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe(px);
    expect(svg?.getAttribute('height')).toBe(px);
  });

  it('forwards aria-hidden when set', () => {
    const { container } = render(<Icon name="Check" aria-hidden />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('passes through className', () => {
    const { container } = render(
      <Icon name="Check" aria-hidden className="text-primary" />,
    );
    expect(container.querySelector('svg')?.getAttribute('class')).toContain(
      'text-primary',
    );
  });

  describe('unknown icon names', () => {
    let warn: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warn.mockRestore();
    });

    it('warns and renders nothing', () => {
      // Intentionally cast to bypass the typed name check.
      const { container } = render(
        <Icon name={'NotARealIcon' as never} aria-hidden />,
      );
      expect(container.querySelector('svg')).toBeNull();
      expect(warn).toHaveBeenCalled();
    });
  });
});
