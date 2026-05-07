import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Select, type SelectOption } from './Select';

const options: SelectOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry', disabled: true },
];

describe('Select', () => {
  it('renders the trigger with placeholder when no value', () => {
    render(
      <Select
        value={null}
        onValueChange={vi.fn()}
        options={options}
        placeholder="Pick fruit"
        aria-label="Fruit"
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    expect(trigger.textContent).toContain('Pick fruit');
  });

  it('renders the matching label when value is set', () => {
    render(
      <Select
        value="b"
        onValueChange={vi.fn()}
        options={options}
        aria-label="Fruit"
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    expect(trigger.textContent).toContain('Banana');
  });

  it('respects disabled', () => {
    render(
      <Select
        value={null}
        onValueChange={vi.fn()}
        options={options}
        disabled
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Fruit' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('sets aria-invalid when error is true', () => {
    render(
      <Select
        value={null}
        onValueChange={vi.fn()}
        options={options}
        error
        aria-label="Fruit"
      />,
    );
    expect(
      screen
        .getByRole('combobox', { name: 'Fruit' })
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it.each(['sm', 'md', 'lg'] as const)('renders the %s size', (size) => {
    render(
      <Select
        value={null}
        onValueChange={vi.fn()}
        options={options}
        size={size}
        aria-label="Fruit"
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Fruit' })).toBeDefined();
  });

  it('applies width style', () => {
    render(
      <Select
        value={null}
        onValueChange={vi.fn()}
        options={options}
        width={240}
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('combobox', { name: 'Fruit' }).style.width,
    ).toBe('240px');
  });
});
