/**
 * Navigation components.
 *
 * Layer 4a per §11 of the design-system buildout spec.
 * Components: TopNav, SideNav, Breadcrumbs, Tabs, Stepper.
 *
 * Filled in Phase 7. This barrel exists to lock the sub-path export shape.
 */
/**
 * Navigation components.
 *
 * Layer 4a per §11 of the design-system buildout spec.
 * Components: Tabs (with TabsList / TabsTrigger / TabsContent), Stepper,
 * Breadcrumbs, TopNav (with TopNavItem / TopNavUserMenu), SideNav (with
 * SideNavGroup / SideNavItem / SideNavSearch).
 */
export {
  Breadcrumbs,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from './Breadcrumbs';
export {
  SideNav,
  SideNavGroup,
  SideNavItem,
  SideNavSearch,
  type SearchResult,
  type SideNavGroupProps,
  type SideNavItemProps,
  type SideNavProps,
  type SideNavSearchProps,
} from './SideNav';
export {
  Stepper,
  type StepDefinition,
  type StepStatus,
  type StepperProps,
} from './Stepper';
export {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type TabsContentProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
} from './Tabs';
export {
  TopNav,
  TopNavItem,
  TopNavUserMenu,
  type TopNavItemProps,
  type TopNavProps,
  type TopNavUserMenuItem,
  type TopNavUserMenuProps,
} from './TopNav';
