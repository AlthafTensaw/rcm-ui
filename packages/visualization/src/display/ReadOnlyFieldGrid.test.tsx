import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadOnlyFieldGrid } from './ReadOnlyFieldGrid';

describe('ReadOnlyFieldGrid', () => {
  it('renders label and value pairs', () => {
    render(
      <ReadOnlyFieldGrid
        fields={[
          { label: 'Clinic Name', value: 'Beats Cardiology PLLC' },
          { label: 'Tax ID', value: '87-3263971' },
        ]}
      />,
    );
    expect(screen.getByText('Clinic Name')).toBeDefined();
    expect(screen.getByText('Beats Cardiology PLLC')).toBeDefined();
    expect(screen.getByText('Tax ID')).toBeDefined();
    expect(screen.getByText('87-3263971')).toBeDefined();
  });

  it('uses dl/dt/dd semantics', () => {
    const { container } = render(
      <ReadOnlyFieldGrid fields={[{ label: 'X', value: 'Y' }]} />,
    );
    expect(container.querySelector('dl')).not.toBeNull();
    expect(container.querySelectorAll('dt')).toHaveLength(1);
    expect(container.querySelectorAll('dd')).toHaveLength(1);
  });

  it('renders empty-value placeholder for null/undefined/empty values', () => {
    render(
      <ReadOnlyFieldGrid
        fields={[
          { label: 'A', value: null },
          { label: 'B', value: undefined },
          { label: 'C', value: '' },
        ]}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('renders custom emptyPlaceholder', () => {
    render(
      <ReadOnlyFieldGrid
        fields={[{ label: 'A', value: null }]}
        emptyPlaceholder="(none)"
      />,
    );
    expect(screen.getByText('(none)')).toBeDefined();
  });

  it('accepts ReactNode values for custom rendering', () => {
    render(
      <ReadOnlyFieldGrid
        fields={[
          {
            label: 'Status',
            value: <span data-testid="custom">Active</span>,
          },
        ]}
      />,
    );
    expect(screen.getByTestId('custom')).toBeDefined();
  });

  it('supports fullWidth fields', () => {
    const { container } = render(
      <ReadOnlyFieldGrid
        columns={2}
        fields={[
          { label: 'Name', value: 'Test' },
          { label: 'Notes', value: 'A long value', fullWidth: true },
        ]}
      />,
    );
    const dds = container.querySelectorAll('dd');
    // The fullWidth dd should have a gridColumn style spanning all columns.
    const fullWidthDd = Array.from(dds).find((d) => d.textContent === 'A long value');
    expect(fullWidthDd).toBeDefined();
    const style = (fullWidthDd!).style.gridColumn;
    expect(style).toContain('5'); // 2 columns × 2 + 1 = 5
  });

  it('renders 0 as a valid value (not empty)', () => {
    render(<ReadOnlyFieldGrid fields={[{ label: 'Count', value: 0 }]} />);
    expect(screen.getByText('0')).toBeDefined();
    expect(screen.queryByText('—')).toBeNull();
  });
});
