import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { DatePicker } from './DatePicker';

const meta = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof DatePicker>,
    'value' | 'onValueChange'
  > & { initial?: Date | null },
) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <div style={{ width: 280 }}>
      <DatePicker value={value} onValueChange={setValue} {...rest} />
    </div>
  );
}

export const Default: Story = {
  render: () => <Wrapper placeholder="Pick a date…" />,
};

export const WithDefault: Story = {
  render: () => <Wrapper initial={new Date(2026, 4, 1)} />,
};

export const MinAndMax: Story = {
  render: () => (
    <Wrapper
      minDate={new Date(2026, 4, 1)}
      maxDate={new Date(2026, 4, 31)}
      placeholder="May 2026 only"
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Wrapper initial={new Date(2026, 4, 1)} disabled />
  ),
};
