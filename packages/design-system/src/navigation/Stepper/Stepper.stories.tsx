import type { Meta, StoryObj } from '@storybook/react';

import { Stepper } from './Stepper';

const meta = {
  title: 'Navigation/Stepper',
  component: Stepper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'compact'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const claimSteps = [
  { label: 'Patient', description: 'Lookup' },
  { label: 'Insurance', description: 'Verify' },
  { label: 'Charges', description: 'Code' },
  { label: 'Review', description: 'Submit' },
];

export const InProgress: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Stepper currentStep={2} steps={claimSteps} />
    </div>
  ),
};

export const FirstStep: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Stepper currentStep={1} steps={claimSteps} />
    </div>
  ),
};

export const Complete: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Stepper currentStep={5} steps={claimSteps} />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ width: 720 }}>
      <Stepper
        currentStep={3}
        steps={[
          { label: 'Patient' },
          { label: 'Insurance' },
          { label: 'Charges', status: 'error', description: 'Missing CPT' },
          { label: 'Review' },
        ]}
      />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ width: 320 }}>
      <Stepper currentStep={2} steps={claimSteps} orientation="vertical" />
    </div>
  ),
};

export const CompactHorizontal: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <Stepper currentStep={2} steps={claimSteps} variant="compact" />
    </div>
  ),
};
