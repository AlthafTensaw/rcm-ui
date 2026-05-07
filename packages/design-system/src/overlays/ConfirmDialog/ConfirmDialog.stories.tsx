import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from '../../_storybook/action';

import { ConfirmDialog } from './ConfirmDialog';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/ConfirmDialog',
  component: ConfirmDialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  args: Omit<React.ComponentProps<typeof ConfirmDialog>, 'open' | 'onOpenChange'>,
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => { setOpen(true); }}>Open</Button>
      <ConfirmDialog {...args} open={open} onOpenChange={setOpen} />
    </>
  );
}

export const Default: Story = {
  render: () => (
    <Wrapper
      title="Confirm action"
      description="Are you sure you want to proceed?"
      onConfirm={action('confirm')}
    />
  ),
};

export const Destructive: Story = {
  render: () => (
    <Wrapper
      title="Delete claim?"
      description="This cannot be undone."
      variant="destructive"
      confirmLabel="Delete"
      onConfirm={action('confirm-delete')}
    />
  ),
};

export const CustomLabels: Story = {
  render: () => (
    <Wrapper
      title="Sign out?"
      description="You'll need to log in again."
      confirmLabel="Sign out"
      cancelLabel="Stay signed in"
      onConfirm={action('confirm-signout')}
    />
  ),
};
