import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Dialog } from './Dialog';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  args: Omit<React.ComponentProps<typeof Dialog>, 'open' | 'onOpenChange'>,
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => { setOpen(true); }}>Open dialog</Button>
      <Dialog {...args} open={open} onOpenChange={setOpen} />
    </>
  );
}

export const Default: Story = {
  render: () => (
    <Wrapper
      title="Edit claim"
      description="Update claim details before resubmission."
      footer={<Button>Save</Button>}
    >
      <p className="text-sm text-muted-foreground">
        Body content goes here. The dialog handles overlay, focus trap, and
        escape-to-close out of the box.
      </p>
    </Wrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <Wrapper title="Small" size="sm" footer={<Button>OK</Button>}>
      <p className="text-sm">Compact dialog for short prompts.</p>
    </Wrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <Wrapper title="Large" size="lg" footer={<Button>OK</Button>}>
      <p className="text-sm">
        Wider dialog for forms with multiple fields or larger media.
      </p>
    </Wrapper>
  ),
};

export const NonDismissible: Story = {
  render: () => (
    <Wrapper
      title="Confirm before continuing"
      description="Click the button to acknowledge."
      closeOnEscape={false}
      closeOnOverlayClick={false}
      footer={<Button>Acknowledge</Button>}
    >
      <p className="text-sm">Cannot be dismissed without an explicit choice.</p>
    </Wrapper>
  ),
};
