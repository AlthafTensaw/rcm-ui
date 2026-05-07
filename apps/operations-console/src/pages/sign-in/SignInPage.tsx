/**
 * SignInPage — public route for authenticating into the Operations Console.
 *
 * Per design-system buildout deferred item #1: real Cognito Hosted UI /
 * Amplify integration is deferred. This page ships a mocked sign-in
 * matching the patient app's pattern, with two operations-console-specific
 * additions:
 *
 *   1. **Role selector** — pick from the 7 Operations Console roles.
 *      The selection drives `AuthUser.permissions` via
 *      `resolvePermissions()`. Without this, the action dispatcher's
 *      permission gate would block every query (default user has no
 *      permissions array).
 *
 *   2. **Clinic IDs textarea** — comma-separated clinic IDs.
 *      Cross-clinic roles (TENSAW_*, TENANT_ADMIN, RCM_OPS_*) typically
 *      pass an empty list; clinic-scoped roles (CLINIC_*) MUST pass
 *      their accessible clinics, which the UI uses to filter dropdowns
 *      and the server uses to enforce access.
 *
 * What changes when real Cognito lands (Phase B / v0.2):
 *   - This page becomes a "sign-in launcher" calling `Auth.federatedSignIn`
 *   - A `/auth/callback` route handles the redirect-back, decodes the
 *     ID token (which carries `cognito:groups` for both role and
 *     clinic-* claims), populates `useAuthStore`, then `<Navigate>`s
 *     to `?next=...`
 *   - The permission resolution stays in `auth/permissions.ts` because
 *     the role→permission map is product-defined, not Cognito-defined
 */

import { useState } from 'react';
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
  Label,
  Select,
  Textarea,
} from '@tensaw/design-system';
import { useAuthStore } from '@tensaw/runtime';

import { ALL_ROLES, type Role, resolvePermissions } from '../../auth/permissions';

const SignInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type SignInValues = z.infer<typeof SignInSchema>;

const ROLE_LABELS: Record<Role, string> = {
  TENSAW_ADMIN: 'Tensaw admin (cross-tenant)',
  TENSAW_SUPPORT: 'Tensaw support engineer',
  TENANT_ADMIN: 'Tenant admin (Primrose)',
  RCM_OPS_SENIOR_REVIEWER: 'RCM ops — senior reviewer',
  RCM_OPS_REVIEWER: 'RCM ops — reviewer',
  CLINIC_ADMIN: 'Clinic admin (clinic-001 + clinic-002)',
  CLINIC_USER: 'Clinic user (clinic-001 only)',
};

/** Default clinic IDs per role for the mocked sign-in. */
function defaultClinicIds(role: Role): string {
  if (role === 'CLINIC_ADMIN') return 'clinic-001, clinic-002';
  if (role === 'CLINIC_USER') return 'clinic-001';
  return '';
}

export function SignInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const signIn = useAuthStore((s) => s.signIn);

  const [role, setRole] = useState<Role>('RCM_OPS_SENIOR_REVIEWER');
  const [clinicIdsRaw, setClinicIdsRaw] = useState<string>(defaultClinicIds(role));

  const handleRoleChange = (next: string) => {
    const r = next as Role;
    setRole(r);
    setClinicIdsRaw(defaultClinicIds(r));
  };

  const onSubmit = (values: SignInValues) => {
    const clinicIds = clinicIdsRaw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    signIn({
      user: {
        userId: `u-mock-${role.toLowerCase()}`,
        username: values.email.split('@')[0] ?? 'user',
        email: values.email,
        fullName: ROLE_LABELS[role],
        roles: [role],
        permissions: resolvePermissions([role]),
        clinicIds,
      },
      // For mocked sign-in we leave clinicId null; the app reads
      // multi-clinic scope from `user.clinicIds` directly.
      clinicId: clinicIds[0] ?? null,
    });
    const next = params.get('next') ?? '/';
    navigate(next, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Tensaw Operations Console</CardTitle>
          <CardDescription>
            Mocked sign-in for development. Pick a role to test the
            permission gates.
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
                  placeholder="ops@primrose.health"
                  value={value as string}
                  onChange={(e) => {
                    onChange(e.target.value);
                  }}
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
                  onChange={(e) => {
                    onChange(e.target.value);
                  }}
                  onBlur={onBlur}
                  error={Boolean(error)}
                />
              )}
            </FormField>
            <div className="space-y-1.5">
              <Label htmlFor="field-role">Role</Label>
              <Select
                id="field-role"
                aria-label="Role"
                value={role}
                onValueChange={(v) => {
                  handleRoleChange(v);
                }}
                options={ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="field-clinics">
                Clinic IDs (comma-separated; leave empty for tenant-wide roles)
              </Label>
              <Textarea
                id="field-clinics"
                value={clinicIdsRaw}
                onChange={(e) => {
                  setClinicIdsRaw(e.target.value);
                }}
                placeholder="clinic-001, clinic-002"
                rows={2}
              />
            </div>
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
