/**
 * Mock user fixture for the v0.1.3 `GET /v1/admin/users` endpoint.
 *
 * 24 users covering the operationally-interesting roles
 * (RCM_OPS_REVIEWER, RCM_OPS_SENIOR_REVIEWER, TENANT_ADMIN, CLINIC_ADMIN,
 * plus a few CLINIC_USER and inactive entries for realism). The picker
 * passes `role_filter` to focus on the four ops-relevant roles, but the
 * fixture supports the full filter surface for completeness and tests.
 *
 * Backend perf optimization (v0.1.3 handback §6 #2): when the request
 * is tenant-wide AND no `role_filter` is supplied, the real backend
 * skips Cognito group hydration and returns empty `roles` / `clinic_ids`
 * arrays. The MSW handler mirrors that shape so the frontend's
 * Combobox can be exercised against both code paths.
 */
import type { UserListItem } from '../../actions/schemas';

/**
 * Canonical mock users. Roles + clinic_ids reflect the "fully hydrated"
 * shape; the handler strips them when caller didn't pass `role_filter`.
 */
export const MOCK_USERS: readonly UserListItem[] = [
  {
    user_id: 'u-alex-pierce',
    email: 'alex.pierce@primrose.health',
    display_name: 'Alex Pierce',
    roles: ['RCM_OPS_SENIOR_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-bri-chen',
    email: 'bri.chen@primrose.health',
    display_name: 'Bri Chen',
    roles: ['RCM_OPS_SENIOR_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-cora-davis',
    email: 'cora.davis@primrose.health',
    display_name: 'Cora Davis',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-dan-evans',
    email: 'dan.evans@primrose.health',
    display_name: 'Dan Evans',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-eli-fox',
    email: 'eli.fox@primrose.health',
    display_name: 'Eli Fox',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-faye-grey',
    email: 'faye.grey@primrose.health',
    display_name: 'Faye Grey',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-gabe-hill',
    email: 'gabe.hill@primrose.health',
    display_name: 'Gabe Hill',
    roles: ['RCM_OPS_SENIOR_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-hana-irving',
    email: 'hana.irving@primrose.health',
    display_name: 'Hana Irving',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-ivy-jacobs',
    email: 'ivy.jacobs@primrose.health',
    display_name: 'Ivy Jacobs',
    roles: ['TENANT_ADMIN'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-jules-kim',
    email: 'jules.kim@primrose.health',
    display_name: 'Jules Kim',
    roles: ['TENANT_ADMIN'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-kara-lin',
    email: 'kara.lin@clinic-001.health',
    display_name: 'Kara Lin',
    roles: ['CLINIC_ADMIN'],
    clinic_ids: ['clinic-001'],
    is_active: true,
  },
  {
    user_id: 'u-liam-moss',
    email: 'liam.moss@clinic-001.health',
    display_name: 'Liam Moss',
    roles: ['CLINIC_ADMIN'],
    clinic_ids: ['clinic-001'],
    is_active: true,
  },
  {
    user_id: 'u-mira-noor',
    email: 'mira.noor@clinic-002.health',
    display_name: 'Mira Noor',
    roles: ['CLINIC_ADMIN'],
    clinic_ids: ['clinic-002'],
    is_active: true,
  },
  {
    user_id: 'u-nico-ortiz',
    email: 'nico.ortiz@clinic-002.health',
    display_name: 'Nico Ortiz',
    roles: ['CLINIC_ADMIN'],
    clinic_ids: ['clinic-002'],
    is_active: true,
  },
  {
    user_id: 'u-omar-patel',
    email: 'omar.patel@clinic-003.health',
    display_name: 'Omar Patel',
    roles: ['CLINIC_ADMIN'],
    clinic_ids: ['clinic-003'],
    is_active: true,
  },
  {
    user_id: 'u-piper-quinn',
    email: 'piper.quinn@primrose.health',
    display_name: 'Piper Quinn',
    roles: ['RCM_OPS_SENIOR_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-ravi-singh',
    email: 'ravi.singh@primrose.health',
    display_name: 'Ravi Singh',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-sam-tate',
    email: 'sam.tate@primrose.health',
    display_name: 'Sam Tate',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-tina-uriel',
    email: 'tina.uriel@clinic-001.health',
    display_name: 'Tina Uriel',
    roles: ['CLINIC_USER'],
    clinic_ids: ['clinic-001'],
    is_active: true,
  },
  {
    user_id: 'u-uma-vega',
    email: 'uma.vega@clinic-002.health',
    display_name: 'Uma Vega',
    roles: ['CLINIC_USER'],
    clinic_ids: ['clinic-002'],
    is_active: true,
  },
  {
    user_id: 'u-vince-wu',
    email: 'vince.wu@primrose.health',
    // Realistic null display_name — Cognito user without a name attribute set.
    display_name: null,
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-wren-xu',
    email: 'wren.xu@primrose.health',
    display_name: 'Wren Xu',
    roles: ['RCM_OPS_REVIEWER'],
    clinic_ids: [],
    // Inactive — picker should still surface them so historical assignments
    // resolve, but the UI may want to dim or label them. Combobox does not
    // filter by is_active itself; the consumer decides.
    is_active: false,
  },
  {
    user_id: 'u-xander-young',
    email: 'xander.young@primrose.health',
    display_name: 'Xander Young',
    roles: ['TENANT_ADMIN'],
    clinic_ids: [],
    is_active: true,
  },
  {
    user_id: 'u-yara-zane',
    email: 'yara.zane@primrose.health',
    display_name: 'Yara Zane',
    roles: ['RCM_OPS_SENIOR_REVIEWER'],
    clinic_ids: [],
    is_active: true,
  },
];

/**
 * Filter the canonical user list per the request query params. Mirrors the
 * v0.1.3 backend's behavior:
 *   - `role_filter` (repeatable): match users whose roles intersect the filter
 *   - `search` (max 64 chars): case-insensitive substring on display_name + email
 *   - sort: display_name ASC (case-insensitive); email tiebreaker; null name last
 *   - perf optimization: when role_filter is empty/absent, strip roles +
 *     clinic_ids to empty arrays (mirrors backend skipping group hydration)
 */
export function filterUsers(opts: {
  roleFilter: string[];
  search: string;
  limit: number;
  offset: number;
}): { items: UserListItem[]; total: number } {
  const { roleFilter, search, limit, offset } = opts;

  // Filter
  let rows: UserListItem[] = [...MOCK_USERS];
  if (roleFilter.length > 0) {
    const wanted = new Set(roleFilter);
    rows = rows.filter((u) => u.roles.some((r) => wanted.has(r)));
  }
  if (search.length > 0) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.display_name?.toLowerCase().includes(q) === true,
    );
  }

  // Sort: display_name ASC (null last), then email ASC.
  rows.sort((a, b) => {
    const an = a.display_name;
    const bn = b.display_name;
    if (an !== null && bn === null) return -1;
    if (an === null && bn !== null) return 1;
    if (an !== null && bn !== null) {
      const cmp = an.localeCompare(bn, undefined, { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
    }
    return a.email.localeCompare(b.email);
  });

  const total = rows.length;
  const page = rows.slice(offset, offset + limit);

  // Perf optimization: when role_filter is absent, strip roles + clinic_ids
  // to empty arrays. Mirrors v0.1.3 backend skipping per-user Cognito
  // group hydration (Phase_v0_1_3_Handback.md §6 review item #2).
  const hydrated =
    roleFilter.length > 0
      ? page
      : page.map((u) => ({ ...u, roles: [], clinic_ids: [] }));

  return { items: hydrated, total };
}
