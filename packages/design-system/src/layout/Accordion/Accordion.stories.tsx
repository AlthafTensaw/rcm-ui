import type { Meta, StoryObj } from '@storybook/react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';

const meta = {
  title: 'Layout/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleType: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <Accordion type="single" defaultValue="patient" collapsible>
        <AccordionItem value="patient">
          <AccordionTrigger>Patient details</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Name, DOB, insurance.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="insurance">
          <AccordionTrigger>Insurance</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Primary and secondary payer details.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="charges">
          <AccordionTrigger>Charges</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm">Procedure codes and modifiers.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const MultipleType: Story = {
  render: () => (
    <div style={{ width: 480 }}>
      <Accordion type="multiple" defaultValue={['a', 'c']}>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>Content A — open by default.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>Content B</AccordionContent>
        </AccordionItem>
        <AccordionItem value="c">
          <AccordionTrigger>Section C</AccordionTrigger>
          <AccordionContent>Content C — also open by default.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Faq: Story = {
  render: () => (
    <div style={{ width: 560 }}>
      <Accordion type="single" collapsible>
        <AccordionItem value="q1">
          <AccordionTrigger>How long does a claim usually take?</AccordionTrigger>
          <AccordionContent>
            Most clean claims are paid within 7-14 days; denials add 2-3 weeks.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q2">
          <AccordionTrigger>Can I resubmit a denied claim?</AccordionTrigger>
          <AccordionContent>
            Yes — fix the indicated issue and re-file. The platform retains the
            original correlation ID.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="q3">
          <AccordionTrigger>What if a payer doesn't respond?</AccordionTrigger>
          <AccordionContent>
            Open a follow-up case at day 30 if no acknowledgment is received.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
