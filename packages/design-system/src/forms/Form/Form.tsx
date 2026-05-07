/**
 * Form, FormField, FormError — form orchestration trio.
 *
 * `Form` provides a `react-hook-form` context and (optionally) a Zod schema
 * resolver for validation. `FormField` is a render-prop that wires any input
 * up to a named field via Controller — gives the input `value`, `onChange`,
 * and `error`, plus auto-renders label + helper/error text in a label slab.
 * `FormError` reads form-level (root) errors set via `setError('root', …)`.
 *
 * Usage:
 *   <Form schema={MySchema} onSubmit={handleSubmit}>
 *     <FormField name="email" label="Email" required>
 *       {({ value, onChange, error }) => (
 *         <Input value={value} onChange={(e) => onChange(e.target.value)} error={!!error} />
 *       )}
 *     </FormField>
 *     <FormError />
 *     <Button type="submit">Submit</Button>
 *   </Form>
 */
import {
  type FormHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type DefaultValues,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

import { Label } from '../../primitives/Label';
import { cn } from '../../utils/cn';

export interface FormProps<T extends FieldValues>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  onSubmit: SubmitHandler<T>;
  schema?: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  children: ReactNode | ((methods: UseFormReturn<T>) => ReactNode);
}

export function Form<T extends FieldValues>({
  onSubmit,
  schema,
  defaultValues,
  children,
  className,
  ...rest
}: FormProps<T>): JSX.Element {
  const methods = useForm<T>({
    resolver: schema ? (zodResolver(schema) as never) : undefined,
    defaultValues,
  });

  return (
    <FormProvider {...methods}>
      <form
        noValidate
        onSubmit={(e) => {
          // RHF's handleSubmit returns a Promise; wrap so the onSubmit
          // attribute sees a void return (avoids the misused-promise lint).
          void methods.handleSubmit(onSubmit)(e);
        }}
        className={cn('flex flex-col gap-4', className)}
        {...rest}
      >
        {typeof children === 'function' ? children(methods) : children}
      </form>
    </FormProvider>
  );
}
Form.displayName = 'Form';

/**
 * Render-prop arguments handed to FormField children.
 */
export interface FormFieldRenderArgs {
  value: unknown;
  onChange: (next: unknown) => void;
  onBlur: () => void;
  name: string;
  /** Field-level error message, if any. */
  error: string | undefined;
}

export interface FormFieldProps {
  name: string;
  label?: ReactNode;
  required?: boolean;
  helperText?: string;
  className?: string;
  children: (args: FormFieldRenderArgs) => ReactNode;
}

export function FormField({
  name,
  label,
  required,
  helperText,
  className,
  children,
}: FormFieldProps): JSX.Element {
  const { control, formState } = useFormContext();
  // Walk the dotted path to extract the nested error message if present.
  const errorMessage = readErrorMessage(formState.errors, name);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label !== undefined && (
        <Label htmlFor={`field-${name}`} required={required}>
          {label}
        </Label>
      )}
      <Controller
        name={name}
        control={control}
        render={({ field }) =>
          // Pass an explicit `id` via field's surrounding span — the children
          // own how they wire `id` since they may be Input, Select, etc.
          children({
            value: field.value,
            onChange: field.onChange as (next: unknown) => void,
            onBlur: field.onBlur,
            name: field.name,
            error: errorMessage,
          }) as JSX.Element
        }
      />
      {errorMessage ? (
        <p
          id={`field-${name}-error`}
          className="text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : (
        helperText && (
          <p
            id={`field-${name}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
FormField.displayName = 'FormField';

export interface FormErrorProps {
  className?: string;
}

/**
 * Surfaces form-level errors set via `methods.setError('root', { message })`
 * (or any specific root key like `root.serverError`). Renders nothing when
 * there's no root error.
 */
export function FormError({ className }: FormErrorProps): JSX.Element | null {
  const { formState } = useFormContext();
  const root = formState.errors.root;
  if (!root) return null;

  const message =
    typeof root === 'object' && 'message' in root
      ? (root.message)
      : undefined;

  // Some apps stash sub-errors under root.<key>; surface the first.
  const fallback = pickFirstRootMessage(root);

  const display = message ?? fallback;
  if (!display) return null;

  return (
    <p
      role="alert"
      className={cn(
        'rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive',
        className,
      )}
    >
      {display}
    </p>
  );
}
FormError.displayName = 'FormError';

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function readErrorMessage(
  errors: Record<string, unknown>,
  path: string,
): string | undefined {
  const parts = path.split('.');
  let cur: unknown = errors;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  if (cur && typeof cur === 'object' && 'message' in cur) {
    const m = (cur as { message?: unknown }).message;
    return typeof m === 'string' ? m : undefined;
  }
  return undefined;
}

function pickFirstRootMessage(root: unknown): string | undefined {
  if (!root || typeof root !== 'object') return undefined;
  for (const v of Object.values(root)) {
    if (v && typeof v === 'object' && 'message' in v) {
      const m = (v as { message?: unknown }).message;
      if (typeof m === 'string') return m;
    }
  }
  return undefined;
}
