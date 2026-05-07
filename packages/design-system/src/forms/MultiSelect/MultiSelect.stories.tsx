import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { MultiSelect } from './MultiSelect';

const meta = {
  title: 'Forms/MultiSelect',
  component: MultiSelect,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

const PAYERS = [
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
  { value: 'aetna', label: 'Aetna' },
  { value: 'bcbs', label: 'BCBS' },
  { value: 'cigna', label: 'Cigna' },
  { value: 'united', label: 'UnitedHealthcare' },
];

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof MultiSelect>,
    'values' | 'onValuesChange'
  > & { initial?: string[] },
) {
  const { initial = [], ...rest } = props;
  const [values, setValues] = useState<string[]>(initial);
  return (
    <div style={{ width: 360 }}>
      <MultiSelect values={values} onValuesChange={setValues} {...rest} />
    </div>
  );
}

export const Default: Story = {
  render: () => <Wrapper options={PAYERS} placeholder="Pick payers…" />,
};

export const WithSelections: Story = {
  render: () => (
    <Wrapper
      options={PAYERS}
      initial={['medicare', 'aetna', 'bcbs']}
      placeholder="Pick payers…"
    />
  ),
};

export const ManySelected: Story = {
  render: () => (
    <Wrapper
      options={PAYERS}
      initial={['medicare', 'aetna', 'bcbs', 'cigna', 'united']}
      maxDisplay={2}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Wrapper options={PAYERS} initial={['medicare']} disabled />
  ),
};
