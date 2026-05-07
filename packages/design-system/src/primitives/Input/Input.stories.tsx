import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta = {
  title: 'Primitives/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: { placeholder: 'Type here…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithValue: Story = { args: { defaultValue: 'Jane Doe' } };
export const Email: Story = { args: { type: 'email', placeholder: 'you@example.com' } };
export const Password: Story = { args: { type: 'password', placeholder: '••••••' } };
export const Disabled: Story = { args: { disabled: true, defaultValue: "Can't edit" } };
export const Invalid: Story = { args: { invalid: true, defaultValue: 'oops' } };
