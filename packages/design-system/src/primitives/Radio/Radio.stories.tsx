import type { Meta, StoryObj } from '@storybook/react';

import { Radio, RadioGroup } from './Radio';

const meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="commercial" className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <Radio value="commercial" /> Commercial
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Radio value="medicare" /> Medicare
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Radio value="medicaid" /> Medicaid
      </label>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="primary" className="flex gap-4">
      <label className="flex items-center gap-2 text-sm">
        <Radio value="primary" /> Primary
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Radio value="secondary" /> Secondary
      </label>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm">
        <Radio value="a" /> Option A
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Radio value="b" /> Option B
      </label>
    </RadioGroup>
  ),
};
