/**
 * @tensaw/composition
 *
 * Layout and orchestration components — the layer that turns page composition
 * manifests into rendered UIs.
 *
 * Implements Phase 6 of the v3 plan.
 */

export const PACKAGE_VERSION = '0.0.0';

// Types — manifest contract
export type {
  WidgetEntry,
  WidgetProps,
  ContainerEntry,
  ZoneEntry,
  ZoneMode,
  DeclarativeZoneEntry,
  BespokeZoneEntry,
  PageComposition,
  ArchetypeShellProps,
} from './types';

// Registries
export * from './registry';

// Standard states
export {
  LoadingState,
  EmptyState,
  ErrorState,
  PermissionDeniedState,
  type EmptyStateProps,
  type ErrorStateProps,
  type PermissionDeniedStateProps,
} from './states';

// Containers
export * from './containers';

// Widgets
export * from './widgets';

// Zones
export * from './zones';

// Shells
export * from './shells';

// Surfaces
export * from './surfaces';

// Grids
export * from './grids';

// Page chrome
export * from './chrome/PageHeader';
export {
  AppLauncher,
  NotificationBell,
  UserMenu,
  HelpButton,
  GlobalAlertBanner,
  SavedViewSelector,
  TabsWithCount,
  type AppLauncherEntry,
  type AppLauncherProps,
  type NotificationBellProps,
  type UserMenuItem,
  type UserMenuProps,
  type GlobalAlertBannerProps,
  type SavedView,
  type SavedViewSelectorProps,
  type TabsWithCountTab,
  type TabsWithCountProps,
} from './chrome';
