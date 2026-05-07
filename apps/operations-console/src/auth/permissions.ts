/**
 * Operations Console — permission resolver.
 *
 * Maps `Role` → `permissions[]` per frontend tech spec §4.5 / BRD §3.8.
 *
 * Background: the action dispatcher's permission gate (in
 * `@tensaw/actions`) checks `useAuthStore.getState().user.permissions`
 * verbatim against `decl.permission`. So when we mock-sign-in a user,
 * we MUST populate `permissions` to include every action permission
 * their roles grant — otherwise dispatch fails with PLATFORM_FORBIDDEN.
 *
 * This module provides:
 *   - ROLE_PERMISSIONS: the role → permissions map
 *   - resolvePermissions(roles): gather the union of permissions
 *   - AVAILABLE_ROLES: the set of roles selectable in mocked sign-in
 *
 * Phase A (read-only) only needs `console.read`. Phase B will add
 * `console.advance`, `console.retry`, `console.reassign`, `console.close`
 * — the resolver already includes them so swapping is trivial.
 */

/** All operations console roles per frontend tech spec §4.5. */
export const ALL_ROLES = [
  'TENSAW_ADMIN',
  'TENSAW_SUPPORT',
  'TENANT_ADMIN',
  'RCM_OPS_SENIOR_REVIEWER',
  'RCM_OPS_REVIEWER',
  'CLINIC_ADMIN',
  'CLINIC_USER',
] as const;
export type Role = (typeof ALL_ROLES)[number];

/** All permissions the operations console actions reference. */
export const ALL_PERMISSIONS = [
  'console.read',
  'console.advance',
  'console.retry',
  'console.reassign',
  'console.close',
] as const;
export type Permission = (typeof ALL_PERMISSIONS)[number];

/**
 * Role → permission set, per frontend tech spec §4.5 / BRD §3.8 /
 * backend spec §4.2 (`CONSOLE_REASSIGN_ROLES`).
 *
 *   console.read     → all 7 roles
 *   console.advance  → not CLINIC_*           (workflow-state mutation)
 *   console.retry    → not CLINIC_*
 *   console.reassign → not CLINIC_USER        (CLINIC_ADMIN reassigns within own clinic)
 *   console.close    → ONLY senior reviewer + admins (not RCM_OPS_REVIEWER)
 *
 * Roles that are tenant-wide (TENSAW_ADMIN/SUPPORT, TENANT_ADMIN,
 * RCM_OPS_*) get console.read and most write actions. CLINIC_ADMIN can
 * reassign within their clinic scope (BRD §3.8 row 4 — the backend
 * still enforces the clinic-scope check on the case being mutated).
 * CLINIC_USER is observe-only.
 *
 * Phase A note: the original Phase A permissions.ts gave CLINIC_ADMIN
 * only `console.read` — that contradicted the BRD's reassign column
 * for that role. Phase B reconciles to the BRD per kickoff guidance
 * "trust the BRD §3.8 / it's definitive". See Frontend_Phase_B_Handback.md.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  TENSAW_ADMIN: [
    'console.read',
    'console.advance',
    'console.retry',
    'console.reassign',
    'console.close',
  ],
  TENSAW_SUPPORT: [
    'console.read',
    'console.advance',
    'console.retry',
    'console.reassign',
    'console.close',
  ],
  TENANT_ADMIN: [
    'console.read',
    'console.advance',
    'console.retry',
    'console.reassign',
    'console.close',
  ],
  RCM_OPS_SENIOR_REVIEWER: [
    'console.read',
    'console.advance',
    'console.retry',
    'console.reassign',
    'console.close',
  ],
  RCM_OPS_REVIEWER: [
    'console.read',
    'console.advance',
    'console.retry',
    'console.reassign',
    // NOT console.close — per BRD §3.8 reviewers can't permanently close cases
  ],
  // Phase B: CLINIC_ADMIN can reassign within their own clinic per BRD §3.8.
  // The backend's CONSOLE_REASSIGN_ROLES (§4.2) explicitly includes CLINIC_ADMIN,
  // and the clinic-scope helper rejects out-of-scope cases server-side.
  CLINIC_ADMIN: ['console.read', 'console.reassign'],
  CLINIC_USER: ['console.read'],
};

/**
 * Roles that span ALL clinics in the tenant. Clinic-scoped users
 * (CLINIC_ADMIN, CLINIC_USER) only see clinics in their `clinicIds`
 * array; cross-clinic roles see every clinic.
 */
export const CROSS_CLINIC_ROLES: ReadonlySet<Role> = new Set([
  'TENSAW_ADMIN',
  'TENSAW_SUPPORT',
  'TENANT_ADMIN',
  'RCM_OPS_SENIOR_REVIEWER',
  'RCM_OPS_REVIEWER',
]);

/**
 * Compute the union of permissions across a user's roles.
 * Returns deduplicated string[] suitable for AuthUser.permissions.
 */
export function resolvePermissions(roles: readonly string[]): string[] {
  const out = new Set<Permission>();
  for (const role of roles) {
    if (role in ROLE_PERMISSIONS) {
      for (const p of ROLE_PERMISSIONS[role as Role]) {
        out.add(p);
      }
    }
  }
  return [...out];
}

/**
 * Return true if any of the user's roles are tenant-wide (cross-clinic).
 * Used to gate the "all clinics" view in dropdowns vs. user's
 * `clinicIds` scope.
 */
export function isCrossClinicUser(roles: readonly string[]): boolean {
  return roles.some((r) => CROSS_CLINIC_ROLES.has(r as Role));
}
