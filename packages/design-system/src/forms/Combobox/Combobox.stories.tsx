import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Combobox, type ComboboxOption } from './Combobox';

const meta = {
  title: 'Forms/Combobox',
  component: Combobox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATIC_OPTIONS: ComboboxOption<string>[] = [
  { value: 'CARD', label: 'Cardiology' },
  { value: 'DERM', label: 'Dermatology' },
  { value: 'ENDO', label: 'Endocrinology' },
  { value: 'GAST', label: 'Gastroenterology' },
  { value: 'NEUR', label: 'Neurology' },
  { value: 'ONCO', label: 'Oncology' },
];

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof Combobox<string>>,
    'value' | 'onValueChange'
  >,
) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <div style={{ width: 320 }}>
      <Combobox<string> value={value} onValueChange={setValue} {...props} />
    </div>
  );
}

export const StaticOptions: Story = {
  render: () => (
    <Wrapper options={STATIC_OPTIONS} placeholder="Pick a specialty…" />
  ),
};

export const AsyncSearch: Story = {
  render: () => (
    <Wrapper
      placeholder="Search providers…"
      search={async (q) => {
        await new Promise((r) => setTimeout(r, 200));
        if (!q) return [];
        return [
          { value: `prov-${q}-1`, label: `${q.toUpperCase()} Cardiology, Dr Lee` },
          { value: `prov-${q}-2`, label: `${q.toUpperCase()} Family Health, Dr Park` },
        ];
      }}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <Wrapper options={STATIC_OPTIONS} disabled placeholder="Locked" />
  ),
};
