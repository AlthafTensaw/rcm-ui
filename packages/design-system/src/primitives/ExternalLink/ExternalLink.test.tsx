import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('renders an anchor with target=_blank and noopener noreferrer rel', () => {
    render(<ExternalLink href="https://example.com">Visit</ExternalLink>);
    const link = screen.getByRole('link', { name: /visit/i });
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('renders the icon by default', () => {
    const { container } = render(
      <ExternalLink href="https://example.com">Visit</ExternalLink>,
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('omits the icon when showIcon is false', () => {
    const { container } = render(
      <ExternalLink href="https://example.com" showIcon={false}>
        Visit
      </ExternalLink>,
    );
    expect(container.querySelector('svg')).toBeNull();
  });

  it.each(['default', 'subtle'] as const)(
    'renders the %s variant',
    (variant) => {
      render(
        <ExternalLink href="https://example.com" variant={variant}>
          Visit
        </ExternalLink>,
      );
      expect(screen.getByRole('link', { name: /visit/i })).toBeDefined();
    },
  );
});
