import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Section } from './Section';

describe('Section', () => {
  it('renders as a section element by default', () => {
    const { container } = render(
      <Section title="Charges">
        <p>Body</p>
      </Section>,
    );
    expect(container.querySelector('section')).not.toBeNull();
  });

  it('renders as a div when as="div"', () => {
    const { container } = render(
      <Section as="div">
        <p>Body</p>
      </Section>,
    );
    expect(container.querySelector('section')).toBeNull();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders as an article when as="article"', () => {
    const { container } = render(
      <Section as="article">
        <p>Body</p>
      </Section>,
    );
    expect(container.querySelector('article')).not.toBeNull();
  });

  it('renders title, description, actions when provided', () => {
    render(
      <Section
        title="Charges"
        description="All charges this period"
        actions={<button>Add</button>}
      >
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'Charges',
    );
    expect(screen.getByText('All charges this period')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDefined();
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('omits header entirely when no title/description/actions', () => {
    render(
      <Section>
        <p>Body</p>
      </Section>,
    );
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Body')).toBeDefined();
  });

  it('renders header with description only (no title)', () => {
    render(
      <Section description="Just a description">
        <p>Body</p>
      </Section>,
    );
    expect(screen.getByText('Just a description')).toBeDefined();
  });

  it('passes through className', () => {
    const { container } = render(
      <Section className="custom-x">
        <p>x</p>
      </Section>,
    );
    expect((container.firstChild as HTMLElement).className).toContain(
      'custom-x',
    );
  });
});
