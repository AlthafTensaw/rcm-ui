/**
 * Auth store unit tests.
 *
 * Phase 1 of the design-system buildout adds `clinicIds: string[]` to AuthUser
 * (per backend ADR-OC-2). These tests guard the field's round-trip behavior
 * through `signIn`/`signOut`.
 */
import { afterEach, describe, expect, it } from 'vitest';

import type { AuthUser } from '../types';
import { _resetAuthStore, useAuthStore } from './authStore';

const mockUser: AuthUser = {
  userId: 'u-1',
  username: 'tester',
  email: 'tester@tensaw.local',
  fullName: 'Tester One',
  roles: ['account_manager'],
  permissions: ['ar.read'],
  clinicIds: [],
};

afterEach(() => {
  _resetAuthStore();
});

describe('AuthStore — clinicIds', () => {
  it('signIn populates clinicIds from user', () => {
    const user = { ...mockUser, clinicIds: ['c-001', 'c-002'] };
    useAuthStore.getState().signIn({ user, clinicId: 'c-001' });
    expect(useAuthStore.getState().user?.clinicIds).toEqual(['c-001', 'c-002']);
  });

  it('signOut clears clinicIds', () => {
    useAuthStore.getState().signIn({
      user: { ...mockUser, clinicIds: ['c-001'] },
      clinicId: 'c-001',
    });
    useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
