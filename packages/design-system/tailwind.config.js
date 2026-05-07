/**
 * Shared Tailwind configuration for the Tensaw design system.
 *
 * Consumer apps extend this rather than rolling their own; that keeps the
 * theme tokens (colors, radii, fonts, animations) consistent across every
 * Tensaw app. The CSS-variable plumbing matches shadcn/ui's "neutral" base
 * exactly so future shadcn upgrades drop in cleanly.
 *
 * Consumer-side usage:
 *   // apps/<app>/tailwind.config.js
 *   import preset from '@tensaw/design-system/tailwind.config.js';
 *
 *   export default {
 *     presets: [preset],
 *     content: [
 *       './src/**\/*.{ts,tsx}',
 *       '../../packages/design-system/src/**\/*.{ts,tsx}',
 *     ],
 *   };
 */
import { fontFamily } from 'tailwindcss/defaultTheme';
import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    // Consumer apps add their own paths via `presets`.
  ],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS-variable approach. The hsl(var(--*)) wrapping lets
        // tenant theming override any one token without touching the others.
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindAnimate],
};
