import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { cpt, type CptServerAdapter } from '@tensaw/codes/cpt';
import { CptCodeField } from './CptCodeField';

beforeEach(() => {
  cpt.useServerLookup(null);
  cpt._clearCache();
});

afterEach(() => {
  cpt.useServerLookup(null);
  cpt._clearCache();
});

function Harness({ initialValue = '' }: { initialValue?: string }) {
  const [v, setV] = React.useState(initialValue);
  return <CptCodeField value={v} onChange={setV} />;
}

describe('CptCodeField', () => {
  it('shows format error for non-5-digit input', () => {
    function H() {
      const [v, setV] = React.useState('');
      return <CptCodeField value={v} onChange={setV} />;
    }
    render(<H />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '123' } });
    expect(screen.getByText(/CPT must be 5 digits/)).toBeDefined();
  });

  it('strips non-digits as user types', () => {
    function H() {
      const [v, setV] = React.useState('');
      return (
        <>
          <CptCodeField value={v} onChange={setV} />
          <span data-testid="state">{v}</span>
        </>
      );
    }
    render(<H />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'abc99213xyz' } });
    expect(screen.getByTestId('state').textContent).toBe('99213');
  });

  it('passes format check with 5 digits, no error even without adapter', () => {
    function H() {
      const [v, setV] = React.useState('');
      return <CptCodeField value={v} onChange={setV} />;
    }
    render(<H />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: '99213' } });
    expect(screen.queryByText(/CPT must be 5 digits/)).toBeNull();
  });

  it('shows server description when adapter is wired and code resolves', async () => {
    const adapter: CptServerAdapter = {
      get: async (code) =>
        code === '99214'
          ? {
              code: '99214',
              description: 'Office or other outpatient visit, established patient, level 4',
              section: 'E/M',
            }
          : undefined,
      search: async () => [],
    };
    cpt.useServerLookup(adapter);

    render(<Harness initialValue="99214" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Office or other outpatient visit/),
      ).toBeDefined();
    });
  });

  it('shows "code not found" hint when adapter returns undefined', async () => {
    const adapter: CptServerAdapter = {
      get: async () => undefined,
      search: async () => [],
    };
    cpt.useServerLookup(adapter);

    render(<Harness initialValue="99999" />);

    await waitFor(() => {
      expect(screen.getByText(/Code not found in CPT catalog/)).toBeDefined();
    });
  });

  it('does not throw or error when adapter is missing', () => {
    function H() {
      const [v, setV] = React.useState('99213');
      return <CptCodeField value={v} onChange={setV} />;
    }
    expect(() => render(<H />)).not.toThrow();
    // No format error.
    expect(screen.queryByText(/must be 5 digits/)).toBeNull();
  });
});
