import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { ColorSwatch } from './ColorSwatch';

const meta = {
  title: 'Forms/ColorSwatch',
  component: ColorSwatch,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof ColorSwatch>,
    'value' | 'onValueChange'
  > & { initial?: string | null },
) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<string | null>(initial);
  return (
    <ColorSwatch
      value={value}
      onValueChange={(c) => { setValue(c); }}
      {...rest}
    />
  );
}

export const DefaultPalette: Story = {
  render: () => <Wrapper aria-label="Tag color" />,
};

export const PreSelected: Story = {
  render: () => <Wrapper aria-label="Tag color" initial="#3b82f6" />,
};

export const CustomColors: Story = {
  render: () => (
    <Wrapper
      aria-label="Brand color"
      customColors={['#ff0080', '#7c3aed', '#0891b2']}
    />
  ),
};

export const Disabled: Story = {
  render: () => <Wrapper initial="#10b981" disabled />,
};
