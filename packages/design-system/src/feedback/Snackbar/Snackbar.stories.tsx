import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';

import { Snackbar } from './Snackbar';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Feedback/Snackbar',
  component: Snackbar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'error'] },
  },
  args: { message: 'Saved.', duration: null, onTimeout: action('timeout') },
} satisfies Meta<typeof Snackbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Success: Story = { args: { variant: 'success', message: 'Claim queued for retry.' } };
export const ErrorVariant: Story = {
  name: 'Error',
  args: { variant: 'error', message: 'Save failed — try again.' },
};
export const WithAction: Story = {
  args: {
    message: '3 claims archived.',
    action: <Button size="sm" variant="link">Undo</Button>,
  },
};
