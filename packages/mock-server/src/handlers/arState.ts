/**
 * In-memory AR row store.
 *
 * The MSW handlers need a place to mutate rows that persists across requests
 * within a single browser session. We start from the deterministic fixtures
 * and apply mutations in place.
 *
 * resetMockARState() is exported so tests and the demo's "reset" affordance
 * can put the store back to its initial state.
 */

import type { ARRow, WorklistMode } from '../schemas/ar';
import {
  ADD_TO_WORKFLOW_ROWS,
  WORKING_LIST_ROWS,
} from '../fixtures/arRows';

let workingRows: ARRow[] = WORKING_LIST_ROWS.map((r) => ({ ...r }));
let candidateRows: ARRow[] = ADD_TO_WORKFLOW_ROWS.map((r) => ({ ...r }));

export function getRowsForMode(mode: WorklistMode): ARRow[] {
  return mode === 'working' ? workingRows : candidateRows;
}

export function findRow(rowId: string): { row: ARRow; mode: WorklistMode } | null {
  const w = workingRows.find((r) => r.id === rowId);
  if (w) return { row: w, mode: 'working' };
  const c = candidateRows.find((r) => r.id === rowId);
  if (c) return { row: c, mode: 'add-to-workflow' };
  return null;
}

/** Apply an in-place patch to a row. Returns the updated row, or null if not found. */
export function patchRow(rowId: string, patch: Partial<ARRow>): ARRow | null {
  const w = workingRows.findIndex((r) => r.id === rowId);
  if (w >= 0) {
    const existing = workingRows[w];
    if (!existing) return null;
    const updated: ARRow = { ...existing, ...patch };
    workingRows[w] = updated;
    return updated;
  }
  const c = candidateRows.findIndex((r) => r.id === rowId);
  if (c >= 0) {
    const existing = candidateRows[c];
    if (!existing) return null;
    const updated: ARRow = { ...existing, ...patch };
    candidateRows[c] = updated;
    return updated;
  }
  return null;
}

/**
 * Move rows from the "candidates" dataset into the "working" dataset.
 * Used by `claims.add-to-workflow`. Returns the moved rows post-mutation.
 */
export function moveToWorking(
  claimIds: readonly string[],
  initialPriority: ARRow['priority'],
): ARRow[] {
  const moved: ARRow[] = [];
  for (const id of claimIds) {
    const idx = candidateRows.findIndex((r) => r.id === id);
    if (idx < 0) continue;
    const src = candidateRows[idx];
    if (!src) continue;
    const promoted: ARRow = {
      ...src,
      workflowName: 'AR',
      workflowState: 'Created',
      currentTask: 'Initial_review',
      priority: initialPriority,
      dueAt: computeDueAtFromPriority(initialPriority),
    };
    workingRows.push(promoted);
    candidateRows.splice(idx, 1);
    moved.push(promoted);
  }
  return moved;
}

function computeDueAtFromPriority(priority: ARRow['priority']): string {
  const now = Date.now();
  const hours = priority === 'P1' ? 12 : priority === 'P2' ? 24 : priority === 'P3' ? 48 : 96;
  return new Date(now + hours * 60 * 60 * 1000).toISOString();
}

/** Reset the in-memory store back to the fixture state. Test/dev-only. */
export function resetMockARState(): void {
  workingRows = WORKING_LIST_ROWS.map((r) => ({ ...r }));
  candidateRows = ADD_TO_WORKFLOW_ROWS.map((r) => ({ ...r }));
}
