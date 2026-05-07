import { afterEach, describe, expect, it } from 'vitest';
import {
  BUILT_IN_TAXONOMIES,
  getStatusEntry,
  getTaxonomy,
  registerTaxonomy,
  _resetCustomTaxonomies,
} from './taxonomy';

afterEach(() => {
  _resetCustomTaxonomies();
});

describe('built-in taxonomies', () => {
  it('exposes the 9 built-in taxonomies promised by the v3 plan', () => {
    const names = Object.keys(BUILT_IN_TAXONOMIES);
    expect(names).toContain('claim');
    expect(names).toContain('eob');
    expect(names).toContain('appointment');
    expect(names).toContain('payment');
    expect(names).toContain('auth');
    expect(names).toContain('eligibility');
    expect(names).toContain('workflow');
    expect(names).toContain('priority');
    expect(names).toContain('aging-bucket');
    expect(names.length).toBeGreaterThanOrEqual(9);
  });

  it('claim taxonomy has all required statuses', () => {
    const claim = BUILT_IN_TAXONOMIES.claim;
    expect(claim.open).toBeDefined();
    expect(claim.filed).toBeDefined();
    expect(claim.denied).toBeDefined();
    expect(claim.rejected).toBeDefined();
    expect(claim.paid).toBeDefined();
  });

  it('eob taxonomy reflects the EOB workflow states', () => {
    const eob = BUILT_IN_TAXONOMIES.eob;
    expect(eob.failed_parsing?.tone).toBe('danger');
    expect(eob.assigned?.tone).toBe('info');
    expect(eob.completed?.tone).toBe('success');
  });

  it('uses appropriate tones for danger states', () => {
    expect(BUILT_IN_TAXONOMIES.claim.denied?.tone).toBe('danger');
    expect(BUILT_IN_TAXONOMIES.appointment.no_show?.tone).toBe('danger');
    expect(BUILT_IN_TAXONOMIES.auth.denied?.tone).toBe('danger');
  });
});

describe('getTaxonomy / getStatusEntry', () => {
  it('looks up built-in taxonomies', () => {
    expect(getTaxonomy('claim')).toBeDefined();
    expect(getStatusEntry('claim', 'paid')?.tone).toBe('success');
  });

  it('returns undefined for unknown taxonomy', () => {
    expect(getTaxonomy('not-a-taxonomy')).toBeUndefined();
    expect(getStatusEntry('not-a-taxonomy', 'foo')).toBeUndefined();
  });

  it('returns undefined for unknown status within known taxonomy', () => {
    expect(getStatusEntry('claim', 'not-a-status')).toBeUndefined();
  });
});

describe('registerTaxonomy', () => {
  it('allows registering custom taxonomies', () => {
    registerTaxonomy('custom-domain', {
      foo: { label: 'Foo', tone: 'info' },
      bar: { label: 'Bar', tone: 'warning' },
    });
    expect(getStatusEntry('custom-domain', 'foo')?.label).toBe('Foo');
    expect(getStatusEntry('custom-domain', 'bar')?.tone).toBe('warning');
  });

  it('does not collide with built-in taxonomies (built-in wins)', () => {
    registerTaxonomy('claim', {
      open: { label: 'OVERRIDE', tone: 'danger' },
    });
    // built-in has priority
    expect(getStatusEntry('claim', 'open')?.label).toBe('Open');
  });
});
