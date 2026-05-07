import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeSearchCombobox, type CodeSearchEntry } from './CodeSearchCombobox';

const SAMPLE: CodeSearchEntry[] = [
  { code: 'I10', description: 'Essential hypertension', secondary: 'Chapter I' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', secondary: 'Chapter E' },
  { code: 'M54.5', description: 'Low back pain', secondary: 'Chapter M · header (not billable)', disabled: true },
];

function setup(extra: Partial<React.ComponentProps<typeof CodeSearchCombobox>> = {}) {
  function Harness(props: { onChange?: (v: string) => void }) {
    const [v, setV] = React.useState('');
    return (
      <CodeSearchCombobox
        label="Code"
        value={v}
        onChange={(next) => {
          setV(next);
          props.onChange?.(next);
        }}
        search={(q) => SAMPLE.filter((s) => s.code.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase()))}
        debounceMs={50}
        {...extra}
      />
    );
  }
  return Harness;
}

// Need React available locally for the harness above.
import React from 'react';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CodeSearchCombobox', () => {
  it('renders with label', () => {
    const Harness = setup();
    render(<Harness />);
    expect(screen.getByText('Code')).toBeDefined();
  });

  it('opens dropdown after debounce when user types', async () => {
    const Harness = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'I10' } });

    // Pre-debounce: no dropdown yet.
    expect(screen.queryByRole('listbox')).toBeNull();

    // Advance past the debounce.
    vi.advanceTimersByTime(60);
    await Promise.resolve();

    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getByText('Essential hypertension')).toBeDefined();
  });

  it('selects an entry on click and closes dropdown', async () => {
    const onSelect = vi.fn();
    function Harness() {
      const [v, setV] = React.useState('');
      return (
        <CodeSearchCombobox
          label="Code"
          value={v}
          onChange={setV}
          onSelect={onSelect}
          search={() => SAMPLE}
          debounceMs={50}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'I' } });
    vi.advanceTimersByTime(60);
    await Promise.resolve();

    const option = screen.getByText('Essential hypertension');
    fireEvent.mouseDown(option);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'I10' }),
    );
    expect((input as HTMLInputElement).value).toBe('I10');
    // Dropdown closes.
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('refuses to select disabled entries', async () => {
    const onSelect = vi.fn();
    function Harness() {
      const [v, setV] = React.useState('');
      return (
        <CodeSearchCombobox
          label="Code"
          value={v}
          onChange={setV}
          onSelect={onSelect}
          search={() => SAMPLE}
          debounceMs={50}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'M' } });
    vi.advanceTimersByTime(60);
    await Promise.resolve();

    const disabledOption = screen.getByText('Low back pain');
    fireEvent.mouseDown(disabledOption);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('keyboard navigation: ArrowDown highlights, Enter selects', async () => {
    const onSelect = vi.fn();
    function Harness() {
      const [v, setV] = React.useState('');
      return (
        <CodeSearchCombobox
          label="Code"
          value={v}
          onChange={setV}
          onSelect={onSelect}
          search={() => SAMPLE.filter((s) => !s.disabled)}
          debounceMs={50}
        />
      );
    }
    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'I' } });
    vi.advanceTimersByTime(60);
    await Promise.resolve();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalled();
  });

  it('Escape closes the dropdown', async () => {
    const Harness = setup();
    render(<Harness />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'I' } });
    vi.advanceTimersByTime(60);
    await Promise.resolve();

    expect(screen.getByRole('listbox')).toBeDefined();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows error state', () => {
    function Harness() {
      const [v] = React.useState('123');
      return (
        <CodeSearchCombobox
          label="Code"
          value={v}
          onChange={() => {}}
          error="Invalid format"
          search={() => []}
        />
      );
    }
    render(<Harness />);
    expect(screen.getByText('Invalid format')).toBeDefined();
  });
});

void userEvent; // keep ergonomic import available for future tests
