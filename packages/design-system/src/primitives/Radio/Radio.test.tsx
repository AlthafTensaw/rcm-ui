import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Radio, RadioGroup } from './Radio';

function Group({
  onValueChange,
  defaultValue,
}: {
  onValueChange?: (v: string) => void;
  defaultValue?: string;
}) {
  return (
    <RadioGroup
      onValueChange={onValueChange}
      defaultValue={defaultValue}
      aria-label="Plan"
    >
      <label>
        <Radio value="basic" />
        Basic
      </label>
      <label>
        <Radio value="pro" />
        Pro
      </label>
    </RadioGroup>
  );
}

describe('RadioGroup + Radio', () => {
  it('renders the radiogroup with named options', () => {
    render(<Group />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeDefined();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('reflects defaultValue', () => {
    render(<Group defaultValue="pro" />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]?.getAttribute('data-state')).toBe('unchecked');
    expect(radios[1]?.getAttribute('data-state')).toBe('checked');
  });

  it('changes selection on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Group onValueChange={onValueChange} />);
    await user.click(screen.getAllByRole('radio')[0]!);
    expect(onValueChange).toHaveBeenCalledWith('basic');
  });

  it('activates a radio via keyboard Space', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Group onValueChange={onValueChange} />);
    const first = screen.getAllByRole('radio')[0]!;
    first.focus();
    await user.keyboard(' ');
    expect(onValueChange).toHaveBeenCalledWith('basic');
  });
});
