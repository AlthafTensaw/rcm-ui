/**
 * CSS variables generator.
 *
 * Turns the typed tokens into a flat CSS-custom-property map. ThemeProvider
 * applies the result to the document root so any component can reference
 * `var(--tw-color-text-primary)` etc. without importing a JS module.
 *
 * Variable naming convention:
 *   --tw-<group>-<role>             # e.g. --tw-color-text-primary
 *   --tw-<group>-<key>              # e.g. --tw-spacing-4
 *
 * The naming is intentionally verbose to avoid collisions with Tailwind or
 * any other CSS-var-based system that might coexist.
 */

import { semantic, type SemanticColors } from './colors';
import { density, radius, spacing, typography, type Density } from './dimensions';
import { motion, shadow, zIndex } from './effects';

type CssVarMap = Record<string, string>;

function colorVars(colors: SemanticColors): CssVarMap {
  const out: CssVarMap = {};
  for (const [role, value] of Object.entries(colors)) {
    // Object.entries widens to `[string, any][]` against SemanticColors; the
    // values are always color strings, so cast at the assignment site.
    out[`--tw-color-${kebab(role)}`] = value as string;
  }
  return out;
}

function spacingVars(): CssVarMap {
  const out: CssVarMap = {};
  for (const [key, value] of Object.entries(spacing)) {
    out[`--tw-spacing-${key}`] = value;
  }
  return out;
}

function radiusVars(): CssVarMap {
  const out: CssVarMap = {};
  for (const [key, value] of Object.entries(radius)) {
    out[`--tw-radius-${key}`] = value;
  }
  return out;
}

function shadowVars(): CssVarMap {
  const out: CssVarMap = {};
  for (const [key, value] of Object.entries(shadow)) {
    out[`--tw-shadow-${kebab(key)}`] = value;
  }
  return out;
}

function motionVars(): CssVarMap {
  const out: CssVarMap = {};
  for (const [key, value] of Object.entries(motion.duration)) {
    out[`--tw-motion-duration-${kebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(motion.easing)) {
    out[`--tw-motion-easing-${kebab(key)}`] = value;
  }
  return out;
}

function zIndexVars(): CssVarMap {
  const out: CssVarMap = {};
  for (const [key, value] of Object.entries(zIndex)) {
    out[`--tw-z-${kebab(key)}`] = String(value);
  }
  return out;
}

function typographyVars(): CssVarMap {
  const out: CssVarMap = {};
  out['--tw-font-sans'] = typography.fontFamily.sans;
  out['--tw-font-mono'] = typography.fontFamily.mono;
  for (const [key, value] of Object.entries(typography.fontSize)) {
    out[`--tw-fs-${key}`] = value;
  }
  for (const [key, value] of Object.entries(typography.fontWeight)) {
    out[`--tw-fw-${key}`] = String(value);
  }
  for (const [key, value] of Object.entries(typography.lineHeight)) {
    out[`--tw-lh-${key}`] = String(value);
  }
  return out;
}

function densityVars(d: Density): CssVarMap {
  const cur = density[d];
  return {
    '--tw-density-row-height': cur.rowHeight,
    '--tw-density-input-height': cur.inputHeight,
    '--tw-density-button-height': cur.buttonHeight,
    '--tw-density-padding': cur.padding,
  };
}

export interface BuildVarsOptions {
  mode: 'light' | 'dark';
  density: Density;
}

export function buildCssVariables(options: BuildVarsOptions): CssVarMap {
  return {
    ...colorVars(semantic[options.mode]),
    ...spacingVars(),
    ...radiusVars(),
    ...shadowVars(),
    ...motionVars(),
    ...zIndexVars(),
    ...typographyVars(),
    ...densityVars(options.density),
  };
}

/** Apply a CSS variable map to a DOM element. */
export function applyCssVariables(target: HTMLElement, vars: CssVarMap): void {
  for (const [name, value] of Object.entries(vars)) {
    target.style.setProperty(name, value);
  }
}

/** Render the variables as a CSS string under a given selector. */
export function renderCssVariables(
  vars: CssVarMap,
  selector = ':root',
): string {
  const body = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
  return `${selector} {\n${body}\n}\n`;
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m, i: number) => (i === 0 ? m.toLowerCase() : `-${m.toLowerCase()}`));
}
