/**
 * Shared prop conventions.
 *
 * Every interactive component in the design system extends one of these base
 * interfaces. Components may add their own props on top, but the foundation
 * of styling, identity, and a11y is consistent.
 *
 * See `docs/PROP_CONVENTIONS.md` for prose explanations and examples.
 */
import type { MouseEvent, ReactNode } from 'react';

/**
 * Props every visible component supports.
 */
export interface BaseProps {
  /** Ad-hoc class composition escape hatch. Composed with `cn()`. */
  className?: string;
  /** DOM id for label/for-attribute association. */
  id?: string;
  /** Stable hook for tests. */
  'data-testid'?: string;
}

/**
 * Props every component the user can interact with supports.
 */
export interface InteractiveProps extends BaseProps {
  /** Disables interaction visually and functionally. */
  disabled?: boolean;
  /**
   * Indicates an in-flight async action. Components render a spinner
   * placement appropriate to their shape and set `aria-busy="true"`.
   */
  loading?: boolean;
  /** ARIA accessible name when no visible label. */
  'aria-label'?: string;
  /** ID of an element that further describes this control. */
  'aria-describedby'?: string;
}

/**
 * Props every form-field-like component supports.
 *
 * These compose with `<Form>` / `<FormField>` (see §8 of the spec) but are
 * also valid stand-alone for fields used outside a form context.
 *
 * Renamed from `FormFieldProps` in Phase 4 to avoid collision with the
 * concrete `<FormField>` component's props. The abstract field-shape
 * contract role is unchanged.
 */
export interface FieldBaseProps extends InteractiveProps {
  /** Visible label rendered as a `<Label>` and associated by id. */
  label?: ReactNode;
  /** Renders an asterisk after the label and adds `aria-required`. */
  required?: boolean;
  /** Validation error message; switches the field to its error visual. */
  error?: string;
  /** Helper text below the field (hidden when `error` is present). */
  helperText?: string;
  /** Form-system field name (used by react-hook-form, etc.). */
  name?: string;
}

/**
 * Props every action-trigger component supports (buttons, action links).
 */
export interface ActionableProps extends InteractiveProps {
  /** Click handler. Component manages keyboard activation internally. */
  onClick?: (event: MouseEvent) => void;
  /** Form-submission semantics for buttons. */
  type?: 'button' | 'submit' | 'reset';
}
