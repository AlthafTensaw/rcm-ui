import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';

import { Alert } from './Alert';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Feedback/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
  },
  args: {
    title: 'Heads up',
    description: 'Some claims need review before resubmission.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { variant: 'info' } };
export const Success: Story = {
  args: { variant: 'success', title: 'Saved', description: 'Your changes are live.' },
};
export const Warning: Story = { args: { variant: 'warning' } };
export const ErrorVariant: Story = {
  name: 'Error',
  args: {
    variant: 'error',
    title: 'Save failed',
    description: 'Network error. Try again.',
  },
};
export const Dismissible: Story = {
  args: { dismissible: true, onDismiss: action('dismiss') },
};
export const WithAction: Story = {
  render: (args) => (
    <Alert {...args} action={<Button size="sm" variant="outline">Retry</Button>} />
  ),
};
export const TitleOnly: Story = { args: { description: undefined } };
