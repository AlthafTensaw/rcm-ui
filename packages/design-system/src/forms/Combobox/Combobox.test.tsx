import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from './Combobox';

const staticOptions: ComboboxOption<string>[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
];

describe('Combobox', () => {
  it('renders trigger with placeholder when no value', () => {
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        options={staticOptions}
        placeholder="Pick fruit"
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Fruit' }).textContent,
    ).toContain('Pick fruit');
  });

  it('renders trigger with selected option label', () => {
    render(
      <Combobox
        value="b"
        onValueChange={vi.fn()}
        options={staticOptions}
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Fruit' }).textContent,
    ).toContain('Banana');
  });

  it('opens the popover and lists options on click', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        options={staticOptions}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    expect(await screen.findByText('Apple')).toBeDefined();
    expect(screen.getByText('Banana')).toBeDefined();
    expect(screen.getByText('Cherry')).toBeDefined();
  });

  it('selects a value when an option is clicked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        value={null}
        onValueChange={onValueChange}
        options={staticOptions}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    await user.click(await screen.findByText('Banana'));
    expect(onValueChange).toHaveBeenCalledWith('b');
  });

  it('respects disabled', () => {
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        options={staticOptions}
        disabled
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Fruit' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('sets aria-invalid when error', () => {
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        options={staticOptions}
        error
        aria-label="Fruit"
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Fruit' })
        .getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('invokes async search and renders results', async () => {
    const user = userEvent.setup();
    const search = vi.fn(async (q: string) => {
      if (!q) return [{ value: 'x', label: 'Xenon' }];
      return [{ value: 'q', label: q.toUpperCase() }];
    });
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        search={search}
        searchDebounceMs={0}
        aria-label="Search"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Search' }));
    // Initial open seeds with empty query.
    await waitFor(() => { expect(search).toHaveBeenCalled(); });
    expect(await screen.findByText('Xenon')).toBeDefined();
  });

  it('uses renderOption for custom row content', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        value={null}
        onValueChange={vi.fn()}
        options={staticOptions}
        renderOption={(o) => <span data-testid={`row-${o.value}`}>{o.label}</span>}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    expect(await screen.findByTestId('row-a')).toBeDefined();
  });
});
