import type { Meta, StoryObj } from '@storybook/react';

import { SnackbarHost } from './SnackbarHost';

const meta = {
  title: 'Wired/SnackbarHost',
  component: SnackbarHost,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'SnackbarHost is currently a documented placeholder — `useNotificationsStore` does not yet have a snackbar slot, so this component renders an empty viewport region and warns once on mount in dev. Once the store grows a `snackbars[]` slot, it will become a parallel of `<ToastHost>`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SnackbarHost>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  render: () => (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        SnackbarHost is mounted below this paragraph. Open the dev console to
        see the one-time warning.
      </p>
      <SnackbarHost />
    </div>
  ),
};
