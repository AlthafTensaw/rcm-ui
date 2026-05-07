import { render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  SnackbarHost,
  _resetSnackbarHostWarnedFlag,
} from './SnackbarHost';

beforeEach(() => {
  _resetSnackbarHostWarnedFlag();
});
afterEach(() => {
  _resetSnackbarHostWarnedFlag();
});

describe('SnackbarHost — placeholder', () => {
  it('renders an aria-labelled region', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SnackbarHost />);
    expect(screen.getByRole('region', { name: 'Snackbars' })).toBeDefined();
    warn.mockRestore();
  });

  it('emits a single dev warning on mount', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SnackbarHost />);
    render(<SnackbarHost />);
    // Process-level flag means only one call no matter how many host instances mount.
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('respects custom className', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<SnackbarHost className="custom-bottom-bar" />);
    const region = screen.getByRole('region', { name: 'Snackbars' });
    expect(region.className).toContain('custom-bottom-bar');
    warn.mockRestore();
  });
});
