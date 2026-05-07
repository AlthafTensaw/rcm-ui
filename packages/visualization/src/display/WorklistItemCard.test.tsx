import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetAllStoresForTesting,
  useEventsStore,
} from '@tensaw/runtime';
import { WorklistItemCard } from './WorklistItemCard';

beforeEach(() => {
  resetAllStoresForTesting();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WorklistItemCard', () => {
  it('renders name + identifier + metadata', () => {
    render(
      <WorklistItemCard
        name="Andrews, Jenny"
        identifier="MRN 11403"
        metadata="Stress Echo · BSW Frisco"
      />,
    );
    expect(screen.getByText('Andrews, Jenny')).toBeDefined();
    expect(screen.getByText('MRN 11403')).toBeDefined();
    expect(screen.getByText(/Stress Echo/)).toBeDefined();
  });

  it('explicit onClick takes precedence over event bus', () => {
    const onClick = vi.fn();
    render(
      <WorklistItemCard
        name="Test"
        domain="patient"
        rowId="p-1"
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith('p-1');
    // No event was published.
    expect(useEventsStore.getState().recent).toHaveLength(0);
  });

  it('falls back to publishing WORKLIST_ROW_OPENED when onClick absent', () => {
    render(<WorklistItemCard name="Test" domain="patient" rowId="p-42" />);
    fireEvent.click(screen.getByRole('button'));
    const recent = useEventsStore.getState().recent;
    expect(recent).toHaveLength(1);
    expect(recent[0]?.eventName).toBe('WORKLIST_ROW_OPENED');
  });

  it('is non-interactive when neither onClick nor (domain+rowId) is provided', () => {
    render(<WorklistItemCard name="Test" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('responds to Enter and Space when interactive', () => {
    const onClick = vi.fn();
    render(<WorklistItemCard name="Test" onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('selected state sets aria-selected', () => {
    render(<WorklistItemCard name="Test" onClick={() => {}} selected />);
    expect(screen.getByRole('button').getAttribute('aria-selected')).toBe('true');
  });
});
