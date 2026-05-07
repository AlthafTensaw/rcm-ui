import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MultiSelect } from './MultiSelect';
import type { SelectOption } from '../Select';

const options: SelectOption[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
  { value: 'e', label: 'Elderberry' },
];

describe('MultiSelect', () => {
  it('renders the placeholder when no values', () => {
    render(
      <MultiSelect
        values={[]}
        onValuesChange={vi.fn()}
        options={options}
        placeholder="Pick fruit"
        aria-label="Fruit"
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Fruit' }).textContent,
    ).toContain('Pick fruit');
  });

  it('renders selected items as chips', () => {
    render(
      <MultiSelect
        values={['a', 'b']}
        onValuesChange={vi.fn()}
        options={options}
        aria-label="Fruit"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger.textContent).toContain('Apple');
    expect(trigger.textContent).toContain('Banana');
  });

  it('truncates with "+N more" when exceeding maxDisplay', () => {
    render(
      <MultiSelect
        values={['a', 'b', 'c', 'd', 'e']}
        onValuesChange={vi.fn()}
        options={options}
        maxDisplay={2}
        aria-label="Fruit"
      />,
    );
    expect(screen.getByText('+3 more')).toBeDefined();
  });

  it('removes a chip when its X is clicked', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <MultiSelect
        values={['a', 'b']}
        onValuesChange={onValuesChange}
        options={options}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
    expect(onValuesChange).toHaveBeenCalledWith(['b']);
  });

  it('respects disabled', () => {
    render(
      <MultiSelect
        values={[]}
        onValuesChange={vi.fn()}
        options={options}
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
      <MultiSelect
        values={[]}
        onValuesChange={vi.fn()}
        options={options}
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

  it('opens the popover on trigger click', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        values={[]}
        onValuesChange={vi.fn()}
        options={options}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    expect(await screen.findByRole('listbox')).toBeDefined();
  });

  it('toggles a value when its option is clicked in the popover', async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <MultiSelect
        values={[]}
        onValuesChange={onValuesChange}
        options={options}
        aria-label="Fruit"
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    await user.click(await screen.findByText('Apple'));
    expect(onValuesChange).toHaveBeenCalledWith(['a']);
  });
});
