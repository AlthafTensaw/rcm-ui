/**
 * ActionForm — `<Form>` whose `onSubmit` dispatches an action.
 *
 * Replaces hand-written `<Form onSubmit={async (data) => { ... await
 * dispatchAction(...); ... }}>`. Common path is one line:
 *
 *   <ActionForm actionId="claim.create" schema={claimSchema}>
 *     ...fields...
 *   </ActionForm>
 *
 * On submit:
 *   - schema validation already happens inside `<Form>`
 *   - the validated values are passed to `dispatchAction(actionId, values)`
 *   - on success: callbacks fire, then optional toast
 *   - on error: `onError` callback fires; the dispatcher's error policy
 *     already toasts unless the action declared otherwise
 */
import type { ReactNode } from 'react';
import type { ZodSchema } from 'zod';
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form';
import { Form } from '@tensaw/design-system';
import {
  dispatchAction,
  type ActionError,
  type ActionResult,
} from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

export interface ActionFormProps<TRequest extends FieldValues, TResponse> {
  /** Action ID — must be of kind 'mutation'. */
  actionId: string;
  schema?: ZodSchema<TRequest>;
  defaultValues?: DefaultValues<TRequest>;
  onSuccess?: (data: TResponse) => void;
  onError?: (error: ActionError) => void;
  toastOnSuccess?: boolean | string;
  children: ReactNode | ((methods: UseFormReturn<TRequest>) => ReactNode);
  className?: string;
}

export function ActionForm<
  TRequest extends FieldValues = FieldValues,
  TResponse = unknown,
>({
  actionId,
  schema,
  defaultValues,
  onSuccess,
  onError,
  toastOnSuccess,
  children,
  className,
}: ActionFormProps<TRequest, TResponse>): JSX.Element {
  const pushToast = useNotificationsStore((s) => s.pushToast);

  async function handleSubmit(values: TRequest): Promise<void> {
    const result: ActionResult<TResponse> = await dispatchAction<TResponse>(
      actionId,
      values,
    );
    if (result.ok) {
      if (toastOnSuccess !== undefined && toastOnSuccess !== false) {
        pushToast({
          toastId: `${actionId}-${Date.now()}`,
          severity: 'success',
          title:
            typeof toastOnSuccess === 'string' ? toastOnSuccess : 'Saved',
        });
      }
      onSuccess?.(result.data);
    } else {
      onError?.(result.error);
    }
  }

  return (
    <Form<TRequest>
      onSubmit={handleSubmit}
      {...(schema !== undefined ? { schema } : {})}
      {...(defaultValues !== undefined ? { defaultValues } : {})}
      {...(className !== undefined ? { className } : {})}
    >
      {children}
    </Form>
  );
}
ActionForm.displayName = 'ActionForm';
