import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './Textarea';

const meta = {
  title: 'Primitives/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    autoResize: { control: 'boolean' },
  },
  args: { placeholder: 'Type a longer note here…' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = {
  args: {
    defaultValue:
      "Patient is presenting with intermittent shortness of breath…",
  },
};
export const AutoResize: Story = {
  args: { autoResize: true, defaultValue: 'Resizes as you type.' },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked' } };
export const Invalid: Story = { args: { invalid: true, defaultValue: 'Too short' } };
