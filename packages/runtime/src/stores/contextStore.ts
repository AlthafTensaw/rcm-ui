/**
 * Context store.
 *
 * Replaces Redux contextSlice. Holds the current page-level selected entity
 * ids (patientId, claimId, etc).
 *
 * Today the slice listened for context-selection events through the Redux
 * event middleware. After migration the context store is updated by
 * dedicated event handlers that are registered at app boot in
 * `effects/contextEventBindings.ts`.
 */
import { create } from 'zustand';
import type { ContextState } from '../types';

export interface ContextStore extends ContextState {
  /**
   * Direct setter — bypasses the event bus. Use sparingly (e.g., when
   * restoring from URL params on page mount). Most context changes should go
   * through `publishEvent('PATIENT_SELECTED', ...)` etc.
   */
  setContext: (payload: Partial<ContextState>) => void;
  clearContext: () => void;
}

const INITIAL: ContextState = {
  patientId: null,
  accountId: null,
  encounterId: null,
  claimId: null,
  appointmentId: null,
  remitId: null,
};

export const useContextStore = create<ContextStore>((set) => ({
  ...INITIAL,
  setContext: (payload) => { set(payload); },
  clearContext: () => { set({ ...INITIAL }); },
}));

export function _resetContextStore(): void {
  useContextStore.setState({ ...INITIAL });
}
