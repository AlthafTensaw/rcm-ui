/**
 * Layout / composition shells.
 *
 * Layer 4b per §12 of the design-system buildout spec.
 * Components: Card (with Header/Title/Description/Content/Footer),
 * Widget (with optional `useWidgetsStore` lifecycle integration), Panel,
 * TabbedPanel, AppShell, Section, Accordion (with Item/Trigger/Content).
 */
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionContentProps,
  type AccordionItemProps,
  type AccordionProps,
  type AccordionTriggerProps,
} from './Accordion';
export { AppShell, type AppShellProps } from './AppShell';
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
  type CardContentProps,
  type CardDescriptionProps,
  type CardFooterProps,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps,
} from './Card';
export { Panel, type PanelProps } from './Panel';
export { Section, type SectionProps } from './Section';
export {
  TabbedPanel,
  type TabDefinition,
  type TabbedPanelProps,
} from './TabbedPanel';
export {
  Widget,
  type WidgetLifecycleContext,
  type WidgetProps,
} from './Widget';
