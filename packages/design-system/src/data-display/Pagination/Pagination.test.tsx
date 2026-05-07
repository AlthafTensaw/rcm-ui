import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders the row-range summary and aria-labelled nav', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={123}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeDefined();
    expect(screen.getByText('Showing 1–25 of 123')).toBeDefined();
  });

  it('shows "0 results" when totalRows is 0', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={0}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText('0 results')).toBeDefined();
  });

  it('marks the current page with aria-current=page', () => {
    render(
      <Pagination
        pageIndex={2}
        pageSize={10}
        totalRows={100}
        onPageChange={vi.fn()}
      />,
    );
    const current = screen.getByRole('button', { name: 'Page 3' });
    expect(current.getAttribute('aria-current')).toBe('page');
  });

  it('disables prev/first chevrons on the first page', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'First page' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Previous page' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('disables next/last chevrons on the last page', () => {
    render(
      <Pagination
        pageIndex={3}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Next page' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Last page' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('fires onPageChange for next/prev/first/last', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pageIndex={2}
        pageSize={25}
        totalRows={500}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    await user.click(screen.getByRole('button', { name: 'First page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(0);
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenLastCalledWith(19); // 500/25 = 20 pages → 0..19
  });

  it('jumps to a specific page via numeric button', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        pageIndex={0}
        pageSize={10}
        totalRows={50}
        onPageChange={onPageChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('inserts ellipsis when total pages exceeds maxPageNumbers', () => {
    render(
      <Pagination
        pageIndex={10}
        pageSize={10}
        totalRows={300}
        onPageChange={vi.fn()}
      />,
    );
    // 30 pages, default cap 7 → ellipses on both sides
    expect(screen.getAllByText('…').length).toBeGreaterThanOrEqual(1);
  });

  it('hides first/last chevrons when showFirstLast=false', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
        showFirstLast={false}
      />,
    );
    expect(screen.queryByRole('button', { name: 'First page' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Last page' })).toBeNull();
  });

  it('hides numeric page buttons when showPageNumbers=false', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
        showPageNumbers={false}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Page 1' })).toBeNull();
    // But chevrons still present:
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDefined();
  });

  it('renders the page-size selector when onPageSizeChange given', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBeDefined();
  });

  it('omits the page-size selector when onPageSizeChange not provided', () => {
    render(
      <Pagination
        pageIndex={0}
        pageSize={25}
        totalRows={100}
        onPageChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('combobox', { name: 'Rows per page' }),
    ).toBeNull();
  });

  it('clamps out-of-range pageIndex to last available', () => {
    render(
      <Pagination
        pageIndex={99}
        pageSize={10}
        totalRows={50}
        onPageChange={vi.fn()}
      />,
    );
    // 5 pages → clamp to page 5 (1-indexed)
    expect(
      screen.getByRole('button', { name: 'Page 5' }).getAttribute('aria-current'),
    ).toBe('page');
  });

  it('shows summary endpoints correctly on a partial last page', () => {
    render(
      <Pagination
        pageIndex={2}
        pageSize={25}
        totalRows={62}
        onPageChange={vi.fn()}
      />,
    );
    // Page 3 → rows 51..62
    expect(screen.getByText('Showing 51–62 of 62')).toBeDefined();
  });
});
