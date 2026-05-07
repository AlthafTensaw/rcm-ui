/**
 * @tensaw/design-system
 *
 * Foundation layer for the Tensaw UI platform: design tokens, theme provider,
 * shared utility primitives, RCM domain components, and (after Phase 3+)
 * platform-agnostic visual primitives, form compounds, overlays, feedback,
 * navigation, layout, and data display.
 *
 * Sub-path imports (preferred for tree-shaking):
 *   import { ... } from '@tensaw/design-system/primitives';
 *   import { ... } from '@tensaw/design-system/forms';
 *   import { ... } from '@tensaw/design-system/overlays';
 *   import { ... } from '@tensaw/design-system/feedback';
 *   import { ... } from '@tensaw/design-system/navigation';
 *   import { ... } from '@tensaw/design-system/layout';
 *   import { ... } from '@tensaw/design-system/data-display';
 *   import { ... } from '@tensaw/design-system/rcm';
 *   import { ... } from '@tensaw/design-system/theme';
 *   import { ... } from '@tensaw/design-system/tokens';
 *
 * Root import re-exports every named export above for convenience and for
 * backward compatibility with consumers that imported flat names before the
 * Phase 2 reorganization.
 */

export const PACKAGE_VERSION = '0.0.0';

// Tokens
export * from './tokens';

// Theme
export * from './theme';

// Shared types (prop conventions)
export * from './types/props';

// Utilities (cn, etc.)
export * from './utils';

// Primitives (currently TextField; Phase 3 fills out Button, Input, etc.)
export * from './primitives';

// Form compounds (Phase 4)
export * from './forms';

// Overlays (Phase 5)
export * from './overlays';

// Feedback components (Phase 6)
export * from './feedback';

// Navigation (Phase 7)
export * from './navigation';

// Layout / composition shells (Phase 8)
export * from './layout';

// Data display (Phase 9)
export * from './data-display';

// RCM domain components (address, coding, validators, fields, privacy)
export * from './rcm';
