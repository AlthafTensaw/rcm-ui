/**
 * Context event bindings.
 *
 * Replaces the `extraReducers` block in the old `contextSlice` that listened
 * for context-selection events through the Redux event middleware.
 *
 * After migration, these are explicit event handlers registered at app boot.
 * `bootstrapApp` calls `startContextEventBindings()` once.
 */

import { registerEventHandler } from '../events/publish';
import { useContextStore } from '../stores/contextStore';

/**
 * Register context-selection handlers. Returns an unsubscribe function that
 * deregisters all handlers — useful in tests.
 */
export function startContextEventBindings(): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    registerEventHandler('PATIENT_SELECTED', (event) => {
      const payload = event.payload as { patientId: string };
      useContextStore.getState().setContext({ patientId: payload.patientId });
    }),
  );

  unsubs.push(
    registerEventHandler('ACCOUNT_SELECTED', (event) => {
      const payload = event.payload as { accountId: string };
      useContextStore.getState().setContext({ accountId: payload.accountId });
    }),
  );

  unsubs.push(
    registerEventHandler('CLAIM_SELECTED', (event) => {
      const payload = event.payload as { claimId: string };
      useContextStore.getState().setContext({ claimId: payload.claimId });
    }),
  );

  unsubs.push(
    registerEventHandler('ENCOUNTER_SELECTED', (event) => {
      const payload = event.payload as { encounterId: string };
      useContextStore
        .getState()
        .setContext({ encounterId: payload.encounterId });
    }),
  );

  unsubs.push(
    registerEventHandler('APPOINTMENT_SELECTED', (event) => {
      const payload = event.payload as { appointmentId: string };
      useContextStore
        .getState()
        .setContext({ appointmentId: payload.appointmentId });
    }),
  );

  unsubs.push(
    registerEventHandler('REMIT_SELECTED', (event) => {
      const payload = event.payload as { remitId: string };
      useContextStore.getState().setContext({ remitId: payload.remitId });
    }),
  );

  return () => {
    for (const unsub of unsubs) unsub();
  };
}
