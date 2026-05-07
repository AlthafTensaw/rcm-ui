import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders the trigger child', () => {
    render(
      <Tooltip content="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeDefined();
  });

  it('does not render content until the trigger is interacted with', () => {
    render(
      <Tooltip content="Helpful text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByText('Helpful text')).toBeNull();
  });

  it('renders content when trigger receives focus', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Helpful text" delayDuration={0}>
        <button>Hover me</button>
      </Tooltip>,
    );
    await user.tab();
    // Radix renders the tooltip content twice (visible + visually-hidden a11y copy).
    const matches = await screen.findAllByText('Helpful text');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('passes children through unchanged when disabled', () => {
    render(
      <Tooltip content="x" disabled>
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeDefined();
    expect(screen.queryByText('x')).toBeNull();
  });
});
