/**
 * SignInPage — public route for authenticating into the patient app.
 *
 * Real Cognito Hosted UI integration would handle the OAuth handshake here.
 * For Phase 13 we ship a mocked sign-in: the form accepts any email, and
 * on submit the auth store is populated with a synthetic user. The next
 * route is read from `?next=<path>` so RequireAuth's redirect lands the
 * user back where they started.
 *
 * The form uses the design-system `<Form>` trio with Zod validation. The
 * `<Form>` component owns the `useForm` instance internally (we pass it a
 * `schema`), so we don't construct one here.
 *
 * What changes when real Cognito lands:
 *   - This page becomes a "sign-in launcher" that calls `Auth.federatedSignIn`
 *   - A `/auth/callback` route handles the redirect-back flow, decodes the
 *     ID token, populates `useAuthStore`, then `<Navigate>`s to `?next=...`
 *   - This mocked form is deleted
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormError,
  FormField,
  Input,
} from '@tensaw/design-system';
import { useAuthStore } from '@tensaw/runtime';

const SignInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof SignInSchema>;

export function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);

  const onSubmit = (values: SignInValues) => {
    // Mocked auth — populate the auth store with a synthetic user. Replace
    // with real Cognito Hosted UI when backend integration is ready.
    signIn({
      user: {
        userId: 'u-mock',
        username: values.email.split('@')[0] ?? 'user',
        email: values.email,
        fullName: 'Tensaw User',
        roles: ['account_manager'],
        permissions: ['ar.read', 'ar.write', 'claims.workflow.assign'],
        clinicIds: ['clinic-1'],
      },
      clinicId: 'clinic-1',
    });
    const next = params.get('next') ?? '/ar';
    navigate(next, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Tensaw</CardTitle>
          <CardDescription>
            Use any email to continue (development build).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            schema={SignInSchema}
            defaultValues={{ email: '', password: '' }}
            onSubmit={onSubmit}
          >
            <FormField name="email" label="Email" required>
              {({ value, onChange, onBlur, error }) => (
                <Input
                  id="field-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@clinic.com"
                  value={value as string}
                  onChange={(e) => { onChange(e.target.value); }}
                  onBlur={onBlur}
                  error={Boolean(error)}
                />
              )}
            </FormField>
            <FormField name="password" label="Password" required>
              {({ value, onChange, onBlur, error }) => (
                <Input
                  id="field-password"
                  type="password"
                  autoComplete="current-password"
                  value={value as string}
                  onChange={(e) => { onChange(e.target.value); }}
                  onBlur={onBlur}
                  error={Boolean(error)}
                />
              )}
            </FormField>
            <FormError />
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
