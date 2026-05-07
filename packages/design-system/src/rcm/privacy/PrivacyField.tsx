/**
 * PrivacyField — HIPAA wrapper for any input that holds PHI.
 *
 * Behavior:
 *   - Renders the wrapped input with the value masked by `maskFn(value)`
 *     until the user explicitly reveals it via the eye icon.
 *   - Reveal requires `canReveal` (caller checks user permissions).
 *   - On reveal, fires `onReveal({ fieldKey, recordType, recordId })` so the
 *     caller can dispatch the PHI_REVEALED audit event.
 *   - Auto-re-masks on blur after `autoMaskOnBlurMs` (default 30s) of the
 *     value being visible — bounds how long PHI sits in plaintext on screen.
 *
 * The wrapped child is a render-prop component so we can pass through the
 * mask state without dictating the input element. Most callers use TextField.
 */

import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';

export interface PrivacyFieldProps {
  /** The current value (plaintext). The mask is applied for display only. */
  value: string;
  /** Function that produces the masked display string. */
  maskFn: (value: string) => string;
  /** Field role used in audit events. e.g. 'ssn', 'dob', 'mrn'. */
  fieldKey: string;
  /** Record type and id for audit. */
  recordType: string;
  recordId: string;
  /** May the current user reveal? Defaults to false (deny by default). */
  canReveal?: boolean;
  /** Called when the user reveals the field — caller dispatches PHI_REVEALED. */
  onReveal?: (info: { fieldKey: string; recordType: string; recordId: string }) => void;
  /** Auto-remask after this many ms of being revealed (default 30s). */
  autoMaskOnBlurMs?: number;
  /**
   * Render-prop. Receives the value to display (masked or plaintext) and a
   * boolean indicating whether the field is currently revealed.
   *
   * Example:
   *   <PrivacyField {...} render={({ displayValue, isRevealed, toggleReveal }) =>
   *     <TextField value={displayValue} readOnly rightAffix={
   *       <button onClick={toggleReveal}>{isRevealed ? '🙈' : '👁'}</button>
   *     } />
   *   } />
   */
  render: (args: {
    displayValue: string;
    isRevealed: boolean;
    toggleReveal: () => void;
    canReveal: boolean;
  }) => ReactElement;
}

export function PrivacyField({
  value,
  maskFn,
  fieldKey,
  recordType,
  recordId,
  canReveal = false,
  onReveal,
  autoMaskOnBlurMs = 30_000,
  render,
}: PrivacyFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const remaskTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRemaskTimer() {
    if (remaskTimer.current !== null) {
      clearTimeout(remaskTimer.current);
      remaskTimer.current = null;
    }
  }

  function toggleReveal() {
    if (!canReveal) return;
    if (isRevealed) {
      setIsRevealed(false);
      clearRemaskTimer();
      return;
    }
    setIsRevealed(true);
    onReveal?.({ fieldKey, recordType, recordId });
    clearRemaskTimer();
    remaskTimer.current = setTimeout(() => {
      setIsRevealed(false);
      remaskTimer.current = null;
    }, autoMaskOnBlurMs);
  }

  useEffect(() => () => { clearRemaskTimer(); }, []);

  const displayValue = isRevealed ? value : maskFn(value);
  const result = render({ displayValue, isRevealed, toggleReveal, canReveal });
  if (!isValidElement(result)) {
    throw new Error('PrivacyField render prop must return a valid React element');
  }
  return cloneElement(result);
}
