import type { Preview } from '@storybook/react';
import { ThemeProvider, type ThemeMode } from '@tensaw/design-system/theme';
import type { Density } from '@tensaw/design-system/tokens';

import '@tensaw/design-system/styles/global.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
    layout: 'centered',
    viewport: {
      defaultViewport: 'desktop',
      viewports: {
        desktop: { name: 'Desktop (1440)', styles: { width: '1440px', height: '900px' } },
        wide: { name: 'Wide (1920)', styles: { width: '1920px', height: '1080px' } },
        narrow: { name: 'Narrow (1280)', styles: { width: '1280px', height: '800px' } },
      },
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Light or dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      name: 'Density',
      description: 'Comfortable or compact spacing',
      defaultValue: 'comfortable',
      toolbar: {
        icon: 'component',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const mode = (context.globals['theme'] as ThemeMode) ?? 'light';
      const density = (context.globals['density'] as Density) ?? 'comfortable';
      return (
        <ThemeProvider mode={mode} density={density}>
          <Story />
        </ThemeProvider>
      );
    },
  ],
};

export default preview;
