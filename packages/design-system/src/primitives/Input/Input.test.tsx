import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';

describe('Input', () => {
  it('renders with default type=text', () => {
    render(<Input placeholder="Search" />);
    const input = screen.getByPlaceholderText('Search');
    expect(input.type).toBe('text');
  });

  it('respects type prop', () => {
    render(<Input type="email" placeholder="email" />);
    const input = screen.getByPlaceholderText('email');
    expect(input.type).toBe('email');
  });

  it('fires onChange when typed into', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input placeholder="x" onChange={onChange} />);
    await user.type(screen.getByPlaceholderText('x'), 'abc');
    expect(onChange).toHaveBeenCalled();
  });

  it('does not allow typing when disabled', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="x" disabled />);
    const input = screen.getByPlaceholderText('x');
    await user.type(input, 'abc');
    expect(input.value).toBe('');
  });

  it('sets aria-invalid when error is true', () => {
    render(<Input placeholder="x" error />);
    expect(
      screen.getByPlaceholderText('x').getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<Input placeholder="x" />);
    expect(
      screen.getByPlaceholderText('x').hasAttribute('aria-invalid'),
    ).toBe(false);
  });

  it('renders startIcon and endIcon', () => {
    render(
      <Input
        placeholder="x"
        startIcon={<span data-testid="s">S</span>}
        endIcon={<span data-testid="e">E</span>}
      />,
    );
    expect(screen.getByTestId('s')).toBeDefined();
    expect(screen.getByTestId('e')).toBeDefined();
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="x" />);
    expect(ref.current?.tagName).toBe('INPUT');
  });
});
