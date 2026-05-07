/**
 * Color tokens.
 *
 * Drawn from the Tensaw UI Standards swatch:
 *   Title bar           #149A9A  Lighter Teal (header)
 *   Title bar (alt)     #0F888D
 *   Table header bg     #EBF7F6  Soft teal
 *   Table header text   #218D8D  Teal accent
 *   Button primary      #14B8A6  Teal primary
 *   Button hover        #0D9488
 *   Body text           #1F2937
 *   Label text          #6B7280
 *   Border / divider    #D1D5DB  /  #E5E7EB
 *   Background          #FFFFFF
 *
 * Tokens are organized as:
 *   - `palette`: raw color scales (gray, teal, red, etc.). Don't use directly
 *     in components — always go through semantic tokens.
 *   - `semantic.light`: roles → palette references. This is the default theme.
 *   - `semantic.dark`: dark mode (skeleton; values may be tuned later).
 *
 * The CSS variable generator emits `--tw-color-<role>` for every semantic
 * role. Components reference variables, not raw hex.
 */

export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  teal: {
    50: '#EBF7F6',
    100: '#D6EFEC',
    200: '#A7DEDA',
    300: '#6FCAC4',
    400: '#218D8D',
    500: '#14B8A6',
    600: '#0F888D',
    700: '#149A9A',
    800: '#0D9488',
    900: '#0B7C72',
  },

  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    300: '#FCA5A5',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    300: '#FCD34D',
    500: '#F59E0B',
    600: '#D97706',
  },

  green: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    300: '#6EE7B7',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },

  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
  },
} as const;

export type Palette = typeof palette;

/**
 * Semantic color roles. Components use these by name, not raw palette values.
 * Adding a new color need = add a role here, not a hex in a component.
 */
export interface SemanticColors {
  // Surfaces
  surfaceBg: string;
  surfaceMuted: string;
  surfaceRaised: string;
  surfaceOverlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textLink: string;
  textDanger: string;

  // Borders
  borderDefault: string;
  borderMuted: string;
  borderStrong: string;
  borderFocus: string;

  // Brand / interactive
  brandPrimary: string;
  brandPrimaryHover: string;
  brandPrimaryText: string;
  brandHeader: string;
  brandHeaderText: string;

  // Table
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowHoverBg: string;
  tableBorderColor: string;

  // Status
  statusSuccessBg: string;
  statusSuccessFg: string;
  statusWarningBg: string;
  statusWarningFg: string;
  statusErrorBg: string;
  statusErrorFg: string;
  statusInfoBg: string;
  statusInfoFg: string;

  // Inputs
  inputBg: string;
  inputBorder: string;
  inputBorderHover: string;
  inputBorderFocus: string;
  inputText: string;
  inputPlaceholder: string;
  inputDisabledBg: string;
}

export const semantic: { light: SemanticColors; dark: SemanticColors } = {
  light: {
    surfaceBg: palette.white,
    surfaceMuted: palette.gray[50],
    surfaceRaised: palette.white,
    surfaceOverlay: 'rgba(15, 23, 42, 0.5)',

    textPrimary: palette.gray[800],
    textSecondary: palette.gray[600],
    textMuted: palette.gray[500],
    textInverse: palette.white,
    textLink: palette.teal[500],
    textDanger: palette.red[600],

    borderDefault: palette.gray[300],
    borderMuted: palette.gray[200],
    borderStrong: palette.gray[400],
    borderFocus: palette.teal[500],

    brandPrimary: palette.teal[500],
    brandPrimaryHover: palette.teal[800],
    brandPrimaryText: palette.white,
    brandHeader: palette.teal[700],
    brandHeaderText: palette.white,

    tableHeaderBg: palette.teal[50],
    tableHeaderText: palette.teal[400],
    tableRowHoverBg: palette.gray[50],
    tableBorderColor: palette.gray[200],

    statusSuccessBg: palette.green[50],
    statusSuccessFg: palette.green[700],
    statusWarningBg: palette.amber[50],
    statusWarningFg: palette.amber[600],
    statusErrorBg: palette.red[50],
    statusErrorFg: palette.red[700],
    statusInfoBg: palette.blue[50],
    statusInfoFg: palette.blue[600],

    inputBg: palette.white,
    inputBorder: palette.gray[300],
    inputBorderHover: palette.gray[400],
    inputBorderFocus: palette.teal[500],
    inputText: palette.gray[800],
    inputPlaceholder: palette.gray[400],
    inputDisabledBg: palette.gray[100],
  },

  dark: {
    // Skeleton dark theme. Values can be tuned without touching components.
    surfaceBg: palette.gray[900],
    surfaceMuted: palette.gray[800],
    surfaceRaised: palette.gray[800],
    surfaceOverlay: 'rgba(0, 0, 0, 0.65)',

    textPrimary: palette.gray[50],
    textSecondary: palette.gray[300],
    textMuted: palette.gray[400],
    textInverse: palette.gray[900],
    textLink: palette.teal[300],
    textDanger: palette.red[300],

    borderDefault: palette.gray[700],
    borderMuted: palette.gray[800],
    borderStrong: palette.gray[600],
    borderFocus: palette.teal[300],

    brandPrimary: palette.teal[500],
    brandPrimaryHover: palette.teal[300],
    brandPrimaryText: palette.gray[900],
    brandHeader: palette.teal[700],
    brandHeaderText: palette.white,

    tableHeaderBg: palette.gray[800],
    tableHeaderText: palette.teal[300],
    tableRowHoverBg: palette.gray[800],
    tableBorderColor: palette.gray[700],

    statusSuccessBg: 'rgba(16, 185, 129, 0.15)',
    statusSuccessFg: palette.green[300],
    statusWarningBg: 'rgba(245, 158, 11, 0.15)',
    statusWarningFg: palette.amber[300],
    statusErrorBg: 'rgba(239, 68, 68, 0.15)',
    statusErrorFg: palette.red[300],
    statusInfoBg: 'rgba(59, 130, 246, 0.15)',
    statusInfoFg: palette.blue[100],

    inputBg: palette.gray[800],
    inputBorder: palette.gray[700],
    inputBorderHover: palette.gray[600],
    inputBorderFocus: palette.teal[300],
    inputText: palette.gray[50],
    inputPlaceholder: palette.gray[500],
    inputDisabledBg: palette.gray[900],
  },
};
