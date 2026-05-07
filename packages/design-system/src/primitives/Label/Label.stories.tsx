import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './Label';

const meta = {
  title: 'Primitives/Label',
  component: Label,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { children: 'Email address' },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const WithHtmlFor: Story = {
  render: (args) => (
    <div>
      <Label {...args} htmlFor="demo-input">
        Patient name
      </Label>
      <input
        id="demo-input"
        className="ml-2 rounded border border-input px-2 py-1"
      />
    </div>
  ),
};
