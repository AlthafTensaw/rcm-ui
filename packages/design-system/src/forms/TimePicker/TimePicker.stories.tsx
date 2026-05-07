import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { TimePicker, type TimeValue } from './TimePicker';

const meta = {
  title: 'Forms/TimePicker',
  component: TimePicker,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    format: { control: 'select', options: ['12h', '24h'] },
    step: { control: 'select', options: [1, 5, 15, 30] },
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof TimePicker>,
    'value' | 'onValueChange'
  > & { initial?: TimeValue | null },
) {
  const { initial = null, ...rest } = props;
  const [value, setValue] = useState<TimeValue | null>(initial);
  return (
    <div style={{ width: 220 }}>
      <TimePicker value={value} onValueChange={setValue} {...rest} />
    </div>
  );
}

export const Default24h: Story = {
  render: () => <Wrapper format="24h" />,
};

export const Format12h: Story = {
  render: () => <Wrapper format="12h" />,
};

export const FifteenMinSteps: Story = {
  render: () => <Wrapper step={15} initial={{ hours: 9, minutes: 30 }} />,
};

export const Disabled: Story = {
  render: () => <Wrapper initial={{ hours: 14, minutes: 0 }} disabled />,
};
