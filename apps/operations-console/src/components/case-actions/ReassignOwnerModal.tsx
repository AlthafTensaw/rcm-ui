/**
 * Reassign owner modal — Phase B Tier 3 (v0.1.3 picker variant).
 *
 * Slice 2 swaps slice 1's free-text `<Input>` for a `<Combobox>` sourced
 * from `admin.list-users`. The free-text variant was the v0.1.2-compatible
 * stopgap; v0.1.3 ships `GET /v1/admin/users` so we now have a real picker.
 *
 * Dispatches `admin.reassign-owner` (PATCH /v1/cases/{id}/owner). Collects:
 *   - `new_owner_user_id` (string user_id from picker, OR null = unassign)
 *   - `reason` (optional, 10..1000 if provided)
 *
 * Permission is `console.reassign`. Per BRD §3.8, this includes CLINIC_ADMIN
 * (clinic-scoped — backend enforces) — see permissions.ts.
 *
 * The picker passes `role_filter` to the v0.1.3 endpoint so the response
 * includes hydrated `roles` per user (perf optimization caveat from
 * Phase_v0_1_3_Handback §6 #2). The four ops-relevant roles are the
 * canonical set per kickoff "v0.1.3 backend wire shapes".
 *
 * Combobox value contract (per slice 2 kickoff Open Question 6 decision):
 * the form stores `user_id` as a string. A sentinel `__UNASSIGN__` option
 * represents "unassign"; we map it to `null` at dispatch time. Empty
 * string means nothing has been picked yet (submit blocks).
 */
import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Combobox,
  Dialog,
  Form,
  FormError,
  FormField,
  Textarea,
  type ComboboxOption,
} from '@tensaw/design-system';
import { dispatchAction, useActionQuery } from '@tensaw/actions';
import { useNotificationsStore } from '@tensaw/runtime';

import {
  ReassignOwnerRequestSchema,
  type ReassignOwnerRequest,
  type ReassignOwnerResponse,
  type UserListItem,
  type UserListResponse,
} from '../../actions/schemas';

/**
 * Sentinel value used by the Combobox to represent "Unassign" without
 * conflicting with the "nothing picked yet" empty-string state. Mapped
 * to `null` at dispatch time. NOT a real user_id; chosen for unmistakability.
 */
const UNASSIGN_SENTINEL = '__UNASSIGN__';

/**
 * Roles the picker hydrates. Passed as `role_filter` so the v0.1.3
 * backend skips the perf optimization and returns populated `roles`
 * arrays — required for rendering role badges in option rows.
 *
 * The four operationally-relevant roles per kickoff §"v0.1.3 backend
 * wire shapes" + slice 1 kickoff Open Question 5 recommendation.
 */
const PICKER_ROLE_FILTER = [
  'RCM_OPS_REVIEWER',
  'RCM_OPS_SENIOR_REVIEWER',
  'TENANT_ADMIN',
  'CLINIC_ADMIN',
] as const;

export interface ReassignOwnerModalProps {
  caseId: string;
  /** Current owner — used for the description hint. */
  currentOwner: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: ReassignOwnerResponse) => void;
}

interface ReassignFormShape {
  case_id: string;
  /**
   * Picked user_id; `UNASSIGN_SENTINEL` for the explicit unassign option;
   * empty string means nothing picked yet. Mapped on submit.
   */
  new_owner_value: string;
  reason?: string;
}

/** Compact role label for badges. Keep tight; option rows are dense. */
function shortRole(role: string): string {
  switch (role) {
    case 'RCM_OPS_SENIOR_REVIEWER':
      return 'Senior';
    case 'RCM_OPS_REVIEWER':
      return 'Reviewer';
    case 'TENANT_ADMIN':
      return 'Tenant admin';
    case 'CLINIC_ADMIN':
      return 'Clinic admin';
    default:
      return role;
  }
}

/** One option row in the dropdown — name + email + role badges. */
function UserOptionRow({ user }: { user: UserListItem }) {
  const name = user.display_name ?? user.email.split('@')[0] ?? user.email;
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user.email}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1">
        {user.roles.map((r) => (
          <Badge key={r} variant="secondary" className="text-[10px]">
            {shortRole(r)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ReassignOwnerModal({
  caseId,
  currentOwner,
  open,
  onOpenChange,
  onSuccess,
}: ReassignOwnerModalProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const pushToast = useNotificationsStore((s) => s.pushToast);

  // Stable request reference for useActionQuery — re-creating the array
  // on every render would re-run the cache-key derivation.
  const userListRequest = useMemo(
    () => ({ role_filter: [...PICKER_ROLE_FILTER], limit: 200 }),
    [],
  );
  const {
    data: userList,
    isLoading: usersLoading,
    error: usersError,
  } = useActionQuery<UserListResponse>(
    'admin.list-users',
    userListRequest,
    // Skip the query while the modal is closed — no point fetching the
    // list when the picker isn't visible. The list refetches on open.
    { skip: !open },
  );

  const userOptions = useMemo<ComboboxOption<string>[]>(() => {
    const items = userList?.items ?? [];
    const userOpts: ComboboxOption<string>[] = items.map((u) => ({
      value: u.user_id,
      label: u.display_name ?? u.email,
      data: u,
    }));
    // Unassign is always available — slice 1's free-text "leave blank to
    // unassign" semantic, made explicit in the picker per Open Question 6.
    return [
      { value: UNASSIGN_SENTINEL, label: '— Unassign —' },
      ...userOpts,
    ];
  }, [userList]);

  function renderOption(opt: ComboboxOption<string>) {
    if (opt.value === UNASSIGN_SENTINEL) {
      return (
        <span className="text-sm italic text-muted-foreground">
          {opt.label}
        </span>
      );
    }
    return <UserOptionRow user={opt.data as UserListItem} />;
  }

  async function handleSubmit(values: ReassignFormShape): Promise<void> {
    setSubmitting(true);
    try {
      const picked = values.new_owner_value.trim();
      if (picked.length === 0) {
        pushToast({
          toastId: `reassign-validation-${Date.now()}`,
          severity: 'error',
          title: 'Pick a new owner',
          body: 'Select a user from the list, or pick "Unassign" to clear the owner.',
        });
        return;
      }
      const newOwner = picked === UNASSIGN_SENTINEL ? null : picked;

      const reason =
        values.reason && values.reason.trim().length > 0
          ? values.reason
          : undefined;
      const candidate: ReassignOwnerRequest = {
        case_id: caseId,
        new_owner_user_id: newOwner,
      };
      if (reason !== undefined) candidate.reason = reason;
      const parsed = ReassignOwnerRequestSchema.safeParse(candidate);
      if (!parsed.success) {
        pushToast({
          toastId: `reassign-validation-${Date.now()}`,
          severity: 'error',
          title: 'Invalid input',
          body: parsed.error.issues[0]?.message ?? 'Validation failed',
        });
        return;
      }

      const result = await dispatchAction<ReassignOwnerResponse>(
        'admin.reassign-owner',
        parsed.data,
      );
      if (result.ok) {
        onSuccess?.(result.data);
        onOpenChange(false);
      } else {
        const err = result.error;
        pushToast({
          toastId: `reassign-error-${Date.now()}`,
          severity: 'error',
          title: 'Reassign failed',
          body: err.message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // 503 Cognito-not-configured handling: the v0.1.3 endpoint returns 503
  // when the runtime's Cognito env vars aren't set. Surfacing a clear
  // error in the modal beats silently leaving the picker empty.
  const usersErrorIs503 = usersError?.code === 'PLATFORM_SERVICE_UNAVAILABLE';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
      title="Reassign owner"
      description={
        currentOwner
          ? `Currently assigned to ${currentOwner}. Pick a new owner or "Unassign".`
          : 'Currently unassigned. Pick a new owner from the list.'
      }
      size="md"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <Form<ReassignFormShape>
        defaultValues={{
          case_id: caseId,
          new_owner_value: '',
          reason: '',
        }}
        onSubmit={handleSubmit}
      >
        <FormField
          name="new_owner_value"
          label="New owner"
          required
          helperText={
            usersErrorIs503
              ? 'User directory is not configured; ask an admin to set TENSAW_WORKFLOW_RUNTIME_COGNITO_USER_POOL_ID.'
              : 'Search by name or email.'
          }
        >
          {({ value, onChange, error }) => (
            <Combobox<string>
              id="reassign-owner-picker"
              aria-label="New owner"
              options={userOptions}
              value={(value as string | undefined) ?? null}
              onValueChange={(v) => {
                onChange(v ?? '');
              }}
              placeholder={
                usersLoading
                  ? 'Loading users\u2026'
                  : usersError
                    ? 'Could not load users'
                    : 'Pick a user\u2026'
              }
              renderOption={renderOption}
              emptyText={
                usersLoading
                  ? 'Loading users\u2026'
                  : usersError
                    ? 'User directory unavailable'
                    : 'No users match'
              }
              loadingText="Loading users\u2026"
              error={Boolean(error) || Boolean(usersError)}
              disabled={submitting}
            />
          )}
        </FormField>
        <FormField
          name="reason"
          label="Reason (optional)"
          helperText="If provided: 10–1000 characters."
        >
          {({ value, onChange, onBlur, error }) => (
            <Textarea
              id="reassign-reason"
              rows={3}
              placeholder="e.g., Original owner is OOO; transferring to coverage"
              value={(value as string | undefined) ?? ''}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              onBlur={onBlur}
              error={Boolean(error)}
              aria-label="Reassign reason"
            />
          )}
        </FormField>
        <FormError />
        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { onOpenChange(false); }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting} disabled={submitting}>
            Reassign
          </Button>
        </div>
      </Form>
    </Dialog>
  );
}
