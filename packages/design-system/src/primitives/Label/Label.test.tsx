import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Label } from './Label';

describe('Label', () => {
  it('renders text content', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('renders an asterisk when required', () => {
    render(<Label required>Email</Label>);
    expect(screen.getByText('*')).toBeDefined();
  });

  it('does not render asterisk when not required', () => {
    render(<Label>Email</Label>);
    expect(screen.queryByText('*')).toBeNull();
  });

  it('associates with input via htmlFor', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );
    await user.click(screen.getByText('Email'));
    expect(document.activeElement?.id).toBe('email');
  });
});
