import type { Meta, StoryObj } from '@storybook/react';

import { Select, type SelectOption } from './Select';

const options: SelectOption[] = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
  { value: 'self-pay', label: 'Self-pay' },
];

const meta = {
  title: 'Forms/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    options,
    placeholder: 'Choose payer category…',
    width: 280,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Large: Story = { args: { size: 'lg' } };
export const WithDefault: Story = { args: { defaultValue: 'medicare' } };
export const Disabled: Story = { args: { disabled: true } };

export const WithDisabledOption: Story = {
  args: {
    options: [
      ...options,
      { value: 'workers-comp', label: 'Workers comp', disabled: true },
    ],
  },
};
