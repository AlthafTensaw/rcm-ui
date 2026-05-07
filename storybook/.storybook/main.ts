import type { StorybookConfig } from '@storybook/react-vite';

/**
 * Storybook root configuration.
 *
 * Stories live alongside their components under
 * `packages/design-system/src/<sub-path>/<Component>/<Component>.stories.tsx`
 * and are picked up by the glob below. Phase 11 of the design-system buildout
 * spec writes the actual story files; Phase 2 just wires the configuration so
 * the build is ready when stories arrive.
 */
const config: StorybookConfig = {
  stories: [
    '../../packages/design-system/src/**/*.stories.@(ts|tsx)',
    '../../packages/composition/src/**/*.stories.@(ts|tsx)',
    '../../packages/wired-components/src/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    // Speeds up dev-server startup; type errors still surface via `pnpm typecheck`.
    check: false,
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
