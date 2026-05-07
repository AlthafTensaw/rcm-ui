import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { DateRangePicker, type DateRange } from './DateRangePicker';

const meta = {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof DateRangePicker>,
    'value' | 'onValueChange'
  > & { initial?: DateRange },
) {
  const { initial = { from: null, to: null }, ...rest } = props;
  const [value, setValue] = useState<DateRange>(initial);
  return (
    <div style={{ width: 360 }}>
      <DateRangePicker value={value} onValueChange={setValue} {...rest} />
    </div>
  );
}

export const Default: Story = {
  render: () => <Wrapper placeholder="Pick a range…" />,
};

export const WithRange: Story = {
  render: () => (
    <Wrapper
      initial={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Wrapper
      initial={{ from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) }}
      disabled
    />
  ),
};
