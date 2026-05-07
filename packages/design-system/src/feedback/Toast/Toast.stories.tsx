import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';

import { Toast } from './Toast';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Feedback/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
    },
  },
  args: {
    title: 'Saved',
    description: 'Your changes were saved.',
    onDismiss: action('dismiss'),
    duration: null,
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { variant: 'success' } };
export const Warning: Story = {
  args: { variant: 'warning', title: 'Heads up', description: 'Some claims need review.' },
};
export const ErrorVariant: Story = {
  name: 'Error',
  args: { variant: 'error', title: 'Save failed', description: 'Network error. Try again.' },
};
export const Info: Story = {
  args: { variant: 'info', title: 'New release', description: 'v1.4.0 just shipped.' },
};
export const WithAction: Story = {
  args: {
    variant: 'success',
    action: <Button size="sm" variant="link">Undo</Button>,
  },
};
export const TitleOnly: Story = {
  args: { description: undefined, title: 'Saved' },
};
