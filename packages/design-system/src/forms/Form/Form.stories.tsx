import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';
import { z } from 'zod';

import { Form, FormError, FormField } from './Form';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';

const meta = {
  title: 'Forms/Form',
  component: Form,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

const schema = z.object({
  patientName: z.string().min(1, 'Required'),
  email: z.string().email('Must be a valid email'),
});

type FormValues = z.infer<typeof schema>;

export const SchemaValidated: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <Form<FormValues>
        schema={schema}
        defaultValues={{ patientName: '', email: '' }}
        onSubmit={action('submit')}
      >
        <FormError />
        <FormField name="patientName" label="Patient name" required>
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <FormField name="email" label="Email" helperText="We'll send the receipt here.">
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              type="email"
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <Button type="submit" className="mt-2">
          Save
        </Button>
      </Form>
    </div>
  ),
};

export const NoSchema: Story = {
  render: () => (
    <div style={{ width: 360 }}>
      <Form<{ note: string }>
        defaultValues={{ note: '' }}
        onSubmit={action('submit')}
      >
        <FormField name="note" label="Note">
          {({ value, onChange, name }) => (
            <Input
              id={`field-${name}`}
              name={name}
              value={(value as string) ?? ''}
              onChange={(e) => { onChange(e.target.value); }}
            />
          )}
        </FormField>
        <Button type="submit" className="mt-2">
          Submit
        </Button>
      </Form>
    </div>
  ),
};
