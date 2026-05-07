import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders an aria-hidden div by default', () => {
    const { container } = render(<Skeleton data-testid="sk" />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.tagName).toBe('DIV');
  });

  it('applies pulse animation', () => {
    const { container } = render(<Skeleton />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'animate-pulse',
    );
  });

  it.each([
    ['rectangular', 'rounded-md'],
    ['circular', 'rounded-full'],
    ['text', 'rounded'],
  ] as const)('applies the %s variant shape', (variant, klass) => {
    const { container } = render(<Skeleton variant={variant} />);
    expect((container.firstChild as HTMLElement).className).toContain(klass);
  });

  it('accepts numeric width/height in px', () => {
    const { container } = render(<Skeleton width={80} height={20} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('80px');
    expect(el.style.height).toBe('20px');
  });

  it('accepts string width/height as CSS', () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('2rem');
  });

  it('text variant defaults height to 1em when not given', () => {
    const { container } = render(<Skeleton variant="text" width={120} />);
    expect((container.firstChild as HTMLElement).style.height).toBe('1em');
  });

  it('circular variant inherits width as height when height omitted', () => {
    const { container } = render(<Skeleton variant="circular" width={32} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.height).toBe('32px');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('passes through className', () => {
    const { container } = render(<Skeleton className="custom-x" />);
    expect((container.firstChild as HTMLElement).className).toContain('custom-x');
  });
});
