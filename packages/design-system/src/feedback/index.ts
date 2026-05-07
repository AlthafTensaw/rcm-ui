/**
 * Feedback components.
 *
 * Layer 3 per §10 of the design-system buildout spec.
 * Components: Toast, Snackbar, Skeleton, Spinner, Badge, Alert, EmptyState,
 * Pill. (The hosted variants ToastHost/SnackbarHost live in
 * `@tensaw/wired-components`.)
 *
 * Spinner shipped early in Phase 3 as a Button dependency; the Phase 6
 * version adds the `xs` size and `inverted` variant per spec §10.1.4.
 * Existing callers continue to work unchanged.
 */
export { Alert, type AlertProps, type AlertVariant } from './Alert';
export { Badge, badgeVariants, type BadgeProps } from './Badge';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { Pill, type PillProps } from './Pill';
export { Skeleton, type SkeletonProps } from './Skeleton';
export {
  Snackbar,
  type SnackbarProps,
  type SnackbarVariant,
} from './Snackbar';
export { Spinner, type SpinnerProps } from './Spinner';
export { Toast, type ToastProps, type ToastVariant } from './Toast';
