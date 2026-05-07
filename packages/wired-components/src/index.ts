/**
 * @tensaw/wired-components
 *
 * Action-aware components. See README.md for the architectural rationale.
 *
 * Phase 10 of the v3 plan, §14 of the design-system buildout spec.
 * Components are organized loosely by surface affinity:
 *
 *   - Action-as-trigger:  ActionButton, ConfirmActionButton, ActionLink, ActionMenu
 *   - Action-as-form:     ActionForm
 *   - Action-as-data:     DataExplorerWired
 *   - App-shell hosts:    ToastHost, SnackbarHost, CommandPaletteWired
 */
export const PACKAGE_VERSION = '0.0.0';

// Action-as-trigger
export { ActionButton, type ActionButtonProps } from './ActionButton';
export {
  ConfirmActionButton,
  type ConfirmActionButtonProps,
} from './ConfirmActionButton';
export { ActionLink, type ActionLinkProps } from './ActionLink';
export {
  ActionMenu,
  type ActionMenuItem,
  type ActionMenuProps,
} from './ActionMenu';

// Action-as-form
export { ActionForm, type ActionFormProps } from './ActionForm';

// Action-as-data
export {
  DataExplorerWired,
  type DataExplorerWiredProps,
} from './DataExplorerWired';

// App-shell hosts
export { ToastHost, type ToastHostProps } from './ToastHost';
export { SnackbarHost, type SnackbarHostProps } from './SnackbarHost';
export {
  CommandPaletteWired,
  type CommandPaletteWiredProps,
} from './CommandPaletteWired';
