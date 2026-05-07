/**
 * Overlays.
 *
 * Layer 2b per §9 of the design-system buildout spec.
 * Components: Dialog, ConfirmDialog, Drawer, Popover, DropdownMenu (with
 * Item / Separator / Label sub-components), Tooltip, CommandPalette.
 *
 * All overlays render via portal; tests in this layer rely on the jsdom
 * polyfills wired in `vitest.setup.ts`.
 */
export {
  CommandPalette,
  type CommandGroup,
  type CommandItem,
  type CommandPaletteProps,
} from './CommandPalette';
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
export { Dialog, type DialogProps } from './Dialog';
export { Drawer, type DrawerProps } from './Drawer';
export {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  type DropdownMenuItemProps,
  type DropdownMenuLabelProps,
  type DropdownMenuProps,
  type DropdownMenuSeparatorProps,
} from './DropdownMenu';
export { Popover, type PopoverProps } from './Popover';
export { Tooltip, type TooltipProps } from './Tooltip';
