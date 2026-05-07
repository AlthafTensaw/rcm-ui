import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stepper } from './Stepper';

const defaultSteps = [
  { label: 'Patient', description: 'Lookup' },
  { label: 'Insurance', description: 'Verify' },
  { label: 'Review', description: 'Submit' },
];

describe('Stepper', () => {
  it('renders an aria-labelled ordered list of steps', () => {
    render(<Stepper currentStep={1} steps={defaultSteps} />);
    expect(screen.getByRole('list', { name: 'Progress' })).toBeDefined();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders labels and descriptions', () => {
    render(<Stepper currentStep={1} steps={defaultSteps} />);
    expect(screen.getByText('Patient')).toBeDefined();
    expect(screen.getByText('Lookup')).toBeDefined();
    expect(screen.getByText('Insurance')).toBeDefined();
  });

  it('marks the active step with aria-current=step', () => {
    render(<Stepper currentStep={2} steps={defaultSteps} />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]?.getAttribute('aria-current')).toBeNull();
    expect(items[1]?.getAttribute('aria-current')).toBe('step');
    expect(items[2]?.getAttribute('aria-current')).toBeNull();
  });

  it('respects explicit step status (overrides currentStep derivation)', () => {
    render(
      <Stepper
        currentStep={2}
        steps={[
          { label: 'A' },
          { label: 'B', status: 'error' },
          { label: 'C' },
        ]}
      />,
    );
    // The 'error' status step should not also be marked active.
    const items = screen.getAllByRole('listitem');
    expect(items[1]?.getAttribute('aria-current')).toBeNull();
  });

  it.each(['horizontal', 'vertical'] as const)(
    'renders the %s orientation',
    (orientation) => {
      render(
        <Stepper
          currentStep={1}
          steps={defaultSteps}
          orientation={orientation}
        />,
      );
      expect(screen.getByRole('list')).toBeDefined();
    },
  );

  it('omits labels in compact horizontal variant', () => {
    render(
      <Stepper
        currentStep={1}
        steps={defaultSteps}
        variant="compact"
        orientation="horizontal"
      />,
    );
    expect(screen.queryByText('Patient')).toBeNull();
  });

  it('keeps labels in compact vertical variant', () => {
    render(
      <Stepper
        currentStep={1}
        steps={defaultSteps}
        variant="compact"
        orientation="vertical"
      />,
    );
    expect(screen.getByText('Patient')).toBeDefined();
  });

  it('renders custom icon when provided for non-completed/non-error steps', () => {
    render(
      <Stepper
        currentStep={1}
        steps={[
          { label: 'A', icon: <span data-testid="custom">A</span> },
          { label: 'B' },
        ]}
      />,
    );
    expect(screen.getByTestId('custom')).toBeDefined();
  });

  it('uses the custom aria-label when provided', () => {
    render(
      <Stepper
        currentStep={1}
        steps={defaultSteps}
        aria-label="Onboarding progress"
      />,
    );
    expect(
      screen.getByRole('list', { name: 'Onboarding progress' }),
    ).toBeDefined();
  });
});
