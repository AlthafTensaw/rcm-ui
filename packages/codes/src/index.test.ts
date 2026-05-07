import { describe, expect, it } from 'vitest';
import { adjustmentReasonCategories } from './adjustment-reason';
import { carc } from './carc';
import { casGroup } from './cas-group';
import { codes } from './index';
import { cpt, type CptEntry, type CptServerAdapter } from './cpt';
import { hcpcs } from './hcpcs';
import { icd } from './icd';
import { nucc } from './nucc-taxonomy';
import { planType } from './plan-type';
import { pos } from './pos';
import { rarc } from './rarc';
import { states } from './states';
import { workflow } from './workflow';
import { zip } from './zip';

describe('states', () => {
  it('returns all 56 entries (50 + DC + 5 territories)', () => {
    expect(states.list().length).toBe(56);
  });
  it('returns 50 with listStates()', () => {
    expect(states.listStates().length).toBe(50);
  });
  it('looks up by code, case-insensitive', () => {
    expect(states.get('CA')?.name).toBe('California');
    expect(states.get('ca')?.name).toBe('California');
  });
  it('returns undefined for unknown', () => {
    expect(states.get('XX')).toBeUndefined();
  });
  it('correctly flags DC and territories', () => {
    expect(states.get('DC')?.isDistrict).toBe(true);
    expect(states.get('PR')?.isTerritory).toBe(true);
    expect(states.get('CA')?.isState).toBe(true);
  });
});

describe('zip', () => {
  it('maps known ZIPs to the right state', () => {
    expect(zip.toState('94103')).toBe('CA');
    expect(zip.toState('10001')).toBe('NY');
    expect(zip.toState('75024')).toBe('TX');
    expect(zip.toState('02101')).toBe('MA');
    expect(zip.toState('20001')).toBe('DC');
  });
  it('handles 5+4 form', () => {
    expect(zip.toState('94103-1234')).toBe('CA');
  });
  it('matchesState validates correctly', () => {
    expect(zip.matchesState('75024', 'TX')).toBe(true);
    expect(zip.matchesState('75024', 'CA')).toBe(false);
  });
  it('isWellFormed enforces format', () => {
    expect(zip.isWellFormed('12345')).toBe(true);
    expect(zip.isWellFormed('12345-6789')).toBe(true);
    expect(zip.isWellFormed('1234')).toBe(false);
    expect(zip.isWellFormed('abcde')).toBe(false);
  });
  it('returns undefined for malformed', () => {
    expect(zip.toState('')).toBeUndefined();
    expect(zip.toState('00')).toBeUndefined();
  });
});

describe('pos', () => {
  it('looks up Office (11)', () => {
    expect(pos.get('11')?.shortLabel).toBe('Office');
  });
  it('looks up Inpatient Hospital (21)', () => {
    expect(pos.get('21')?.shortLabel).toBe('Inpatient Hospital');
  });
  it('pads single-digit codes', () => {
    expect(pos.get('1')?.code).toBe('01');
  });
  it('searches by description', () => {
    const results = pos.search('emergency');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.code).toBe('23');
  });
  it('searches by code', () => {
    const results = pos.search('11');
    expect(results[0]?.code).toBe('11');
  });
  it('isValid', () => {
    expect(pos.isValid('11')).toBe(true);
    expect(pos.isValid('XX')).toBe(false);
  });
});

describe('carc', () => {
  it('looks up common denial codes', () => {
    expect(carc.get('15')?.category).toBe('Authorization');
    expect(carc.get('29')?.category).toBe('Timely Filing');
    expect(carc.get('50')?.category).toBe('Medical Necessity');
  });
  it('groups by category', () => {
    const auth = carc.byCategory('Authorization');
    expect(auth.length).toBeGreaterThan(0);
    expect(auth.every((c) => c.category === 'Authorization')).toBe(true);
  });
  it('searches by description text', () => {
    const results = carc.search('authorization');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('rarc', () => {
  it('looks up common remarks', () => {
    expect(rarc.get('M76')?.description).toContain('diagnosis');
    expect(rarc.get('N122')?.description).toContain('Add-on');
  });
  it('handles lowercase input', () => {
    expect(rarc.get('m76')).toBeDefined();
  });
});

describe('casGroup', () => {
  it('returns exactly 4 codes', () => {
    expect(casGroup.list().length).toBe(4);
  });
  it('CO is contractual', () => {
    expect(casGroup.get('CO')?.shortLabel).toBe('Contractual');
  });
  it('PR is patient responsibility', () => {
    expect(casGroup.get('PR')?.shortLabel).toBe('Patient Resp.');
  });
});

describe('adjustmentReasonCategories', () => {
  it('returns all categories defined in the v3 plan', () => {
    const codes = adjustmentReasonCategories.list().map((c) => c.code);
    expect(codes).toContain('missing-auth');
    expect(codes).toContain('coverage-terminated');
    expect(codes).toContain('duplicate');
    expect(codes).toContain('coding-error');
    expect(codes).toContain('medical-necessity');
    expect(codes).toContain('bundling');
    expect(codes).toContain('timely-filing');
    expect(codes).toContain('cob');
    expect(codes).toContain('eligibility');
  });
});

describe('workflow', () => {
  it('returns canonical buckets', () => {
    const codes = workflow.list().map((b) => b.code);
    expect(codes).toContain('remit');
    expect(codes).toContain('denial');
    expect(codes).toContain('appeal');
  });
  it('returns step list for a bucket', () => {
    const steps = workflow.stepsFor('appeal');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps).toContain('Drafting');
  });
  it('returns empty for unknown bucket', () => {
    expect(workflow.stepsFor('nonexistent')).toEqual([]);
  });
});

describe('planType', () => {
  it('looks up common plan codes', () => {
    expect(planType.get('PPO')).toBeUndefined(); // not a code, just shortLabel
    expect(planType.get('12')?.shortLabel).toBe('PPO');
    expect(planType.get('15')?.shortLabel).toBe('HMO');
  });
  it('filters managed care', () => {
    const mc = planType.managedCareOnly();
    expect(mc.every((p) => p.managedCare)).toBe(true);
    expect(mc.length).toBeGreaterThan(0);
  });
});

describe('icd', () => {
  it('looks up specific codes', () => {
    expect(icd.get('I10')?.description).toContain('hypertension');
    expect(icd.get('E11.9')?.billable).toBe(true);
  });
  it('correctly identifies non-billable header codes', () => {
    expect(icd.isBillable('E11')).toBe(false); // E11 is a header
    expect(icd.isBillable('E11.21')).toBe(true);
    expect(icd.isBillable('I10')).toBe(true);
  });
  it('search filters by billableOnly', () => {
    const all = icd.search('diabetes');
    const billable = icd.search('diabetes', { billableOnly: true });
    expect(billable.every((e) => e.billable)).toBe(true);
    expect(billable.length).toBeLessThanOrEqual(all.length);
  });
  it('byChapter returns only matching chapter', () => {
    const e = icd.byChapter('E');
    expect(e.length).toBeGreaterThan(0);
    expect(e.every((c) => c.chapter === 'E')).toBe(true);
  });
});

describe('hcpcs', () => {
  it('looks up specific codes', () => {
    expect(hcpcs.get('J1100')?.description).toContain('dexamethasone');
    expect(hcpcs.get('G0438')?.description).toContain('Annual wellness');
  });
  it('filters by category', () => {
    const j = hcpcs.byCategory('J');
    expect(j.every((e) => e.category === 'J')).toBe(true);
  });
});

describe('nucc', () => {
  it('looks up cardiology', () => {
    expect(nucc.get('207RC0000X')?.description).toBe('Cardiovascular Disease');
  });
  it('searches by specialty name', () => {
    const results = nucc.search('cardiology');
    expect(results.length).toBeGreaterThan(0);
  });
});

describe('cpt', () => {
  it('rejects malformed codes via isWellFormed', () => {
    expect(cpt.isWellFormed('99215')).toBe(true);
    expect(cpt.isWellFormed('1234')).toBe(false);
    expect(cpt.isWellFormed('abcde')).toBe(false);
  });

  it('returns undefined sync without an adapter', () => {
    cpt.useServerLookup(null);
    expect(cpt.get('99215')).toBeUndefined();
  });

  it('returns empty search without an adapter', async () => {
    cpt.useServerLookup(null);
    expect(await cpt.search('office visit')).toEqual([]);
  });

  it('uses the server adapter when configured', async () => {
    const stubEntry: CptEntry = {
      code: '99215',
      description: 'Office or other outpatient visit, established patient, level 5',
      section: 'E/M',
    };
    const adapter: CptServerAdapter = {
      get: (code) =>
        Promise.resolve(code === '99215' ? stubEntry : undefined),
      search: () => Promise.resolve([stubEntry]),
    };
    cpt.useServerLookup(adapter);
    expect(await cpt.getAsync('99215')).toEqual(stubEntry);
    // Now sync get works because the cache has been populated.
    expect(cpt.get('99215')).toEqual(stubEntry);

    expect((await cpt.search('office')).length).toBe(1);
    cpt.useServerLookup(null);
  });

  it('caches results from the server adapter', async () => {
    let calls = 0;
    const adapter: CptServerAdapter = {
      get: () => {
        calls += 1;
        return Promise.resolve({
          code: '99215',
          description: 'desc',
          section: 'E/M',
        });
      },
      search: () => Promise.resolve([]),
    };
    cpt.useServerLookup(adapter);
    await cpt.getAsync('99215');
    await cpt.getAsync('99215');
    expect(calls).toBe(1);
    cpt.useServerLookup(null);
  });
});

describe('codes namespace', () => {
  it('exposes every subdomain', () => {
    expect(codes.states).toBeDefined();
    expect(codes.zip).toBeDefined();
    expect(codes.pos).toBeDefined();
    expect(codes.carc).toBeDefined();
    expect(codes.rarc).toBeDefined();
    expect(codes.casGroup).toBeDefined();
    expect(codes.adjustmentReasonCategories).toBeDefined();
    expect(codes.workflow).toBeDefined();
    expect(codes.planType).toBeDefined();
    expect(codes.icd).toBeDefined();
    expect(codes.hcpcs).toBeDefined();
    expect(codes.nucc).toBeDefined();
    expect(codes.cpt).toBeDefined();
  });
});
