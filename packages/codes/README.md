# @tensaw/codes

RCM reference data tables and lookup helpers.

Implements **Phase 4** of the v3 plan.

## Coverage

| Domain | Status | Source |
|---|---|---|
| `states` | **Full** — 50 states + DC + 5 territories | Built-in |
| `zip` | **zip3 prefix mapping** — covers ~99% of ZIPs by prefix | USPS prefix table |
| `pos` | **Full** — all CMS POS codes | CMS public domain |
| `cas-group` | **Full** — all 4 codes | X12 |
| `carc` | **Sample (~50 of 285+)** — most common denial codes | X12 |
| `rarc` | **Sample (~40 of 700+)** — most common remittance remarks | X12 |
| `adjustment-reason` | **Full** — Tensaw category taxonomy | Tensaw v3 plan |
| `workflow` | **Full** — buckets + step lists | Tensaw v3 plan |
| `plan-type` | **Sample (~20 of 200+)** — common plan/service-type codes | HIPAA EB13 |
| `icd` | **Sample (~70 of 70,000+)** | CMS public domain |
| `hcpcs` | **Sample (~25 of thousands)** | CMS public domain |
| `nucc-taxonomy` | **Sample (~40 of 870)** | NUCC public |
| `cpt` | **STUB** — server-adapter pattern only | AMA license required |

Quarterly automated refresh job (Phase 4 deliverable, see CI plan) replaces the **Sample** tables with full data sets. **STUB** stays a stub until AMA licensing is resolved.

## Licensing — read before bundling more data

| Source | License | Action |
|---|---|---|
| CMS (POS, ICD-10-CM, HCPCS, DRG) | Public domain | OK to bundle |
| X12 (CARC, RARC, CAS) | Permitted for healthcare transactions | OK to bundle |
| NUCC | Public (with attribution) | OK to bundle |
| USPS ZIP | Public | OK to bundle |
| **AMA CPT** | **Licensed** | **STUB ONLY until license is in place** |
| NUBC (Revenue codes, Type of Bill) | License required for redistribution | Not bundled in this batch |

## CPT — server-adapter pattern

Until AMA licensing is resolved, `@tensaw/codes/cpt` ships a stub that delegates to a server-side adapter the host app provides:

```ts
import { cpt, type CptServerAdapter } from '@tensaw/codes/cpt';

const adapter: CptServerAdapter = {
  get: async (code) => {
    const res = await fetch(`/api/codes/cpt/${code}`);
    return res.ok ? await res.json() : undefined;
  },
  search: async (query) => {
    const res = await fetch(`/api/codes/cpt/search?q=${encodeURIComponent(query)}`);
    return res.ok ? await res.json() : [];
  },
};
cpt.useServerLookup(adapter);

// Now anywhere in the app:
const entry = await cpt.getAsync('99215');
const matches = await cpt.search('office visit');
```

The TypeScript surface is identical to bundled-data domains. After bundling becomes possible, swap the adapter for an in-memory table without touching consumer code.

## API

```ts
import { codes } from '@tensaw/codes';

// Discovery / generic
codes.icd.get('I10');                       // IcdEntry | undefined
codes.icd.isBillable('E11.21');             // true
codes.icd.search('hypertension', { limit: 10 });
codes.icd.byChapter('E');

codes.pos.get('11');                        // Office
codes.pos.search('emergency');

codes.carc.byCategory('Authorization');     // top denial reasons
codes.rarc.search('M76');

codes.states.list();                        // all 56
codes.states.listStates();                  // 50 only
codes.zip.toState('94103');                 // 'CA'
codes.zip.matchesState('75024', 'TX');      // true

codes.workflow.stepsFor('appeal');          // ['Drafting', 'Review', ...]
codes.adjustmentReasonCategories.list();
```

For tree-shaking, prefer per-domain imports:

```ts
import { states } from '@tensaw/codes/states';
import { icd } from '@tensaw/codes/icd';
```

## Refresh

Quarterly CI job pulls from CMS / NUCC / USPS upstream sources and replaces the bundled data files. Semver: minor for additions, patch for descriptions, major for breaking schema changes.

## Status

Phase 4 — implementation complete for stated coverage. See above table for sample-vs-full details.
