import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { Input } from '../../primitives/Input';
import { Form, FormError, FormField } from './Form';

const Schema = z.object({
  email: z.string().email('Must be an email'),
  age: z.coerce.number().int().min(18, 'Must be 18+'),
});

type Values = z.infer<typeof Schema>;

describe('Form', () => {
  it('renders children and submits values on success', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form<Values>
        schema={Schema}
        defaultValues={{ email: 'x@y.com', age: 30 }}
        onSubmit={onSubmit}
      >
        <FormField name="email" label="Email">
          {({ value, onChange }) => (
            <Input
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
              aria-label="Email"
            />
          )}
        </FormField>
        <FormField name="age" label="Age">
          {({ value, onChange }) => (
            <Input
              type="number"
              value={value as number}
              onChange={(e) => { onChange(e.target.value); }}
              aria-label="Age"
            />
          )}
        </FormField>
        <button type="submit">Submit</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => { expect(onSubmit).toHaveBeenCalledTimes(1); });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      email: 'x@y.com',
      age: 30,
    });
  });

  it('blocks submit and shows field error when schema fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Form<Values>
        schema={Schema}
        defaultValues={{ email: 'not-an-email', age: 30 }}
        onSubmit={onSubmit}
      >
        <FormField name="email" label="Email">
          {({ value, onChange, error }) => (
            <Input
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
              error={!!error}
              aria-label="Email"
            />
          )}
        </FormField>
        <button type="submit">Submit</button>
      </Form>,
    );
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Must be an email')).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders helperText when no error is present', () => {
    render(
      <Form<Values>
        defaultValues={{ email: '', age: 0 }}
        onSubmit={vi.fn()}
      >
        <FormField name="email" label="Email" helperText="We never share">
          {({ value, onChange }) => (
            <Input
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
              aria-label="Email"
            />
          )}
        </FormField>
      </Form>,
    );
    expect(screen.getByText('We never share')).toBeDefined();
  });

  it('renders the required asterisk on the label', () => {
    render(
      <Form<Values>
        defaultValues={{ email: '', age: 0 }}
        onSubmit={vi.fn()}
      >
        <FormField name="email" label="Email" required>
          {({ value, onChange }) => (
            <Input
              value={value as string}
              onChange={(e) => { onChange(e.target.value); }}
              aria-label="Email"
            />
          )}
        </FormField>
      </Form>,
    );
    expect(screen.getByText('*')).toBeDefined();
  });

  it('FormError surfaces a root error after setError', async () => {
    const user = userEvent.setup();
    render(
      <Form<Values>
        defaultValues={{ email: 'x@y.com', age: 30 }}
        onSubmit={(_, e) => {
          // Read methods via the second-arg event/methods if available;
          // here we use the render-prop variant below.
          e?.preventDefault();
        }}
      >
        {(methods) => (
          <>
            <FormField name="email" label="Email">
              {({ value, onChange }) => (
                <Input
                  value={value as string}
                  onChange={(e) => { onChange(e.target.value); }}
                  aria-label="Email"
                />
              )}
            </FormField>
            <FormError />
            <button
              type="button"
              onClick={() =>
                { methods.setError('root', { message: 'Server unavailable' }); }
              }
            >
              Force root error
            </button>
          </>
        )}
      </Form>,
    );
    await user.click(
      screen.getByRole('button', { name: 'Force root error' }),
    );
    expect(await screen.findByText('Server unavailable')).toBeDefined();
  });

  it('FormError renders nothing when there are no root errors', () => {
    render(
      <Form<Values>
        defaultValues={{ email: 'x@y.com', age: 30 }}
        onSubmit={vi.fn()}
      >
        <FormError />
      </Form>,
    );
    // The role=alert query should fail to find the FormError when empty.
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
