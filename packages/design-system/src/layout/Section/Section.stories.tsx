import type { Meta, StoryObj } from '@storybook/react';

import { Section } from './Section';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Layout/Section',
  component: Section,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TitleOnly: Story = {
  render: () => (
    <Section title="Patient details" style={{ width: 640 }}>
      <p className="text-sm">Section body content.</p>
    </Section>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Section
      title="Insurance information"
      description="Verify coverage before submitting the claim."
      style={{ width: 640 }}
    >
      <p className="text-sm">Form fields would render here.</p>
    </Section>
  ),
};

export const WithActions: Story = {
  render: () => (
    <Section
      title="Diagnoses"
      description="Add ICD-10 codes for this encounter."
      actions={<Button size="sm" variant="outline">Add code</Button>}
      style={{ width: 640 }}
    >
      <p className="text-sm">No diagnoses yet.</p>
    </Section>
  ),
};

export const NoTitle: Story = {
  render: () => (
    <Section style={{ width: 640 }}>
      <p className="text-sm">A bare section is just a semantic region wrapper.</p>
    </Section>
  ),
};
