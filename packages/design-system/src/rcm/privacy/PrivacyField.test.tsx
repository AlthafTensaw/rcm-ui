import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrivacyField } from './PrivacyField';

const mask = (v: string) => (v.length >= 4 ? `***-**-${v.slice(-4)}` : '***-**-****');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('PrivacyField', () => {
  it('renders the masked value by default', () => {
    render(
      <PrivacyField
        value="123456789"
        maskFn={mask}
        fieldKey="ssn"
        recordType="patient"
        recordId="p-1"
        canReveal
        render={({ displayValue }) => <input data-testid="x" value={displayValue} readOnly />}
      />,
    );
    expect((screen.getByTestId('x')).value).toBe('***-**-6789');
  });

  it('reveals on toggle when permitted, fires onReveal once', () => {
    const onReveal = vi.fn();
    render(
      <PrivacyField
        value="123456789"
        maskFn={mask}
        fieldKey="ssn"
        recordType="patient"
        recordId="p-1"
        canReveal
        onReveal={onReveal}
        render={({ displayValue, toggleReveal }) => (
          <div>
            <input data-testid="x" value={displayValue} readOnly />
            <button onClick={toggleReveal}>toggle</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByText('toggle'));
    expect((screen.getByTestId('x')).value).toBe('123456789');
    expect(onReveal).toHaveBeenCalledOnce();
    expect(onReveal).toHaveBeenCalledWith({ fieldKey: 'ssn', recordType: 'patient', recordId: 'p-1' });
  });

  it('refuses to reveal when canReveal is false', () => {
    const onReveal = vi.fn();
    render(
      <PrivacyField
        value="123456789"
        maskFn={mask}
        fieldKey="ssn"
        recordType="patient"
        recordId="p-1"
        canReveal={false}
        onReveal={onReveal}
        render={({ displayValue, toggleReveal }) => (
          <div>
            <input data-testid="x" value={displayValue} readOnly />
            <button onClick={toggleReveal}>toggle</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByText('toggle'));
    expect((screen.getByTestId('x')).value).toBe('***-**-6789');
    expect(onReveal).not.toHaveBeenCalled();
  });

  it('auto-remasks after timeout', () => {
    render(
      <PrivacyField
        value="123456789"
        maskFn={mask}
        fieldKey="ssn"
        recordType="patient"
        recordId="p-1"
        canReveal
        autoMaskOnBlurMs={5000}
        render={({ displayValue, toggleReveal }) => (
          <div>
            <input data-testid="x" value={displayValue} readOnly />
            <button onClick={toggleReveal}>toggle</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByText('toggle'));
    expect((screen.getByTestId('x')).value).toBe('123456789');

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    // still revealed
    expect((screen.getByTestId('x')).value).toBe('123456789');

    act(() => {
      vi.advanceTimersByTime(2);
    });
    // now remasked
    expect((screen.getByTestId('x')).value).toBe('***-**-6789');
  });

  it('toggles back to mask manually before timeout fires', () => {
    render(
      <PrivacyField
        value="123456789"
        maskFn={mask}
        fieldKey="ssn"
        recordType="patient"
        recordId="p-1"
        canReveal
        render={({ displayValue, toggleReveal }) => (
          <div>
            <input data-testid="x" value={displayValue} readOnly />
            <button onClick={toggleReveal}>toggle</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByText('toggle')); // reveal
    fireEvent.click(screen.getByText('toggle')); // hide
    expect((screen.getByTestId('x')).value).toBe('***-**-6789');
  });
});

// userEvent import is not strictly needed for this test file but kept available
// for future tests that interact with the inner input in editable mode.
void userEvent;
