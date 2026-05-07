import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Drawer } from './Drawer';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  args: Omit<React.ComponentProps<typeof Drawer>, 'open' | 'onOpenChange'>,
) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => { setOpen(true); }}>Open drawer</Button>
      <Drawer {...args} open={open} onOpenChange={setOpen} />
    </>
  );
}

export const RightSide: Story = {
  render: () => (
    <Wrapper title="Detail panel" side="right">
      <p className="text-sm">Slides in from the right.</p>
    </Wrapper>
  ),
};
export const LeftSide: Story = {
  render: () => (
    <Wrapper title="Filters" side="left">
      <p className="text-sm">Slides in from the left.</p>
    </Wrapper>
  ),
};
export const TopSide: Story = {
  render: () => (
    <Wrapper title="Banner" side="top">
      <p className="text-sm">Slides down from the top.</p>
    </Wrapper>
  ),
};
export const BottomSide: Story = {
  render: () => (
    <Wrapper title="Sheet" side="bottom">
      <p className="text-sm">Slides up from the bottom — common on mobile.</p>
    </Wrapper>
  ),
};
export const FullSize: Story = {
  render: () => (
    <Wrapper title="Maximized" side="right" size="full">
      <p className="text-sm">Takes the full viewport.</p>
    </Wrapper>
  ),
};
