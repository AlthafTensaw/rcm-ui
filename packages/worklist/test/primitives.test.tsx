/**
 * Worklist primitive smoke tests.
 *
 * Light coverage for the parts most likely to break under refactor:
 *   - ColumnVisibilityMenu: required columns can't be unchecked
 *   - MultiSelectComboboxFilter: multi-select + "+N more" rendering
 *   - BulkActionBar: hidden when count = 0; visible otherwise
 *   - ModeToggle: emits change events for inactive options
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  BulkActionBar,
  ColumnVisibilityMenu,
  ModeToggle,
  MultiSelectComboboxFilter,
} from '../src';

describe('ColumnVisibilityMenu', () => {
  it('disables required-column checkboxes', () => {
    const onChange = vi.fn();
    render(
      <ColumnVisibilityMenu
        columns={[
          { id: 'a', header: 'A', required: true },
          { id: 'b', header: 'B' },
        ]}
        visibility={{ a: true, b: true }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    const a = screen.getByLabelText(/A/) as HTMLInputElement;
    const b = screen.getByLabelText(/B/) as HTMLInputElement;
    expect(a.disabled).toBe(true);
    expect(b.disabled).toBe(false);
  });

  it('toggles non-required columns', () => {
    const onChange = vi.fn();
    render(
      <ColumnVisibilityMenu
        columns={[{ id: 'b', header: 'B' }]}
        visibility={{ b: true }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Columns/ }));
    fireEvent.click(screen.getByLabelText(/B/));
    expect(onChange).toHaveBeenCalledWith({ b: false });
  });
});

describe('MultiSelectComboboxFilter', () => {
  it('shows "+N more" when more than one selected', () => {
    render(
      <MultiSelectComboboxFilter
        label="Clinic"
        items={[
          { id: 'c1', label: 'Alpha' },
          { id: 'c2', label: 'Beta' },
          { id: 'c3', label: 'Gamma' },
        ]}
        selectedIds={['c1', 'c2', 'c3']}
        onChange={vi.fn()}
      />,
    );
    // First selection inline ("Alpha") plus a +2 pill.
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
  });

  it('shows the empty placeholder when none selected', () => {
    render(
      <MultiSelectComboboxFilter
        label="Clinic"
        items={[{ id: 'c1', label: 'Alpha' }]}
        selectedIds={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('Any')).toBeTruthy();
  });

  it('toggles selection on option click', () => {
    const onChange = vi.fn();
    render(
      <MultiSelectComboboxFilter
        label="Clinic"
        items={[{ id: 'c1', label: 'Alpha' }]}
        selectedIds={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Clinic/ }));
    fireEvent.click(screen.getByText('Alpha'));
    expect(onChange).toHaveBeenCalledWith(['c1']);
  });
});

describe('BulkActionBar', () => {
  it('renders nothing when count = 0', () => {
    const { container } = render(
      <BulkActionBar selectedCount={0}>
        <button type="button">do thing</button>
      </BulkActionBar>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders content when count > 0', () => {
    render(
      <BulkActionBar selectedCount={3}>
        <button type="button">do thing</button>
      </BulkActionBar>,
    );
    expect(screen.getByText(/3 selected/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /do thing/ })).toBeTruthy();
  });

  it('shows "Clear selection" when handler provided', () => {
    const onClear = vi.fn();
    render(
      <BulkActionBar selectedCount={1} onClearSelection={onClear}>
        <span>actions</span>
      </BulkActionBar>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Clear selection/ }));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('ModeToggle', () => {
  it('does not fire onChange when active option is clicked', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle<'a' | 'b'>
        value="a"
        options={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'A' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('fires onChange when inactive option clicked', () => {
    const onChange = vi.fn();
    render(
      <ModeToggle<'a' | 'b'>
        value="a"
        options={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders count badge when provided', () => {
    render(
      <ModeToggle<'a'>
        value="a"
        options={[{ id: 'a', label: 'Working list', count: 42 }]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('42')).toBeTruthy();
  });
});
