/**
 * Data display.
 *
 * Layer 4c per §13 of the design-system buildout spec.
 *
 * Pagination ships here. DataExplorer ships in `@tensaw/composition/data-display`
 * because it depends on `<SchemaDataGrid>` (which lives in composition); having
 * design-system depend on composition would create a package-graph cycle since
 * composition already depends on design-system.
 */
export { Pagination, type PaginationProps } from './Pagination';
