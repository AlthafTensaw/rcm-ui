/**
 * Case action panel — Phase B Tier 2.
 *
 * Renders 4 buttons under the Case Detail summary: Force-advance, Retry,
 * Reassign, Close. Each opens its own modal; modal state is local to this
 * component so the rest of Case Detail doesn't need to know.
 *
 * Permission gating: HIDE actions the user can't perform (per kickoff
 * §"Open questions" item 1 — recommended over disable+tooltip for cleaner
 * UX). Permissions come from `useAuthStore((s) => s.user.permissions)` via
 * the resolved role-permission map in `auth/permissions.ts`. The action
 * dispatcher additionally enforces the same gate before dispatch fires;
 * this panel just keeps unauthorized buttons out of the DOM.
 *
 * Closed-case handling: when `closedAt !== null`, all four actions are
 * hidden — closed cases have no operational moves left (close is one-way
 * per ADR-OC-3; reopen is Tier 3). The panel renders an explanatory note
 * instead.
 *
 * On success: the kickoff guidance is "TanStack Query auto-refetches per
 * `invalidatedBy`" — Phase A's queries already declare these mutation IDs
 * in their `cache.invalidatedBy` arrays, so we don't need to manually
 * refetch the case. The toast is fired by the action's `onSuccess.toast`
 * policy (declared in `actions/index.ts`).
 */
import { useMemo, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@tensaw/design-system';
import { useAuthStore } from '@tensaw/runtime';
import { FastForward, RotateCcw, UserPlus, XCircle } from 'lucide-react';

import { AdvanceCaseModal } from './AdvanceCaseModal';
import { CloseCaseModal } from './CloseCaseModal';
import { ReassignOwnerModal } from './ReassignOwnerModal';
import { RetryCaseModal } from './RetryCaseModal';

type ActiveModal = 'retry' | 'close' | 'advance' | 'reassign' | null;

export interface CaseActionPanelProps {
  caseId: string;
  /** Current owner — passed through to ReassignOwnerModal. */
  currentOwner: string | null;
  /** When set, the case is closed and no actions are available. */
  closedAt: string | null;
}

export function CaseActionPanel({
  caseId,
  currentOwner,
  closedAt,
}: CaseActionPanelProps): JSX.Element | null {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const permissions = useAuthStore((s) => s.user?.permissions ?? []);

  const can = useMemo(
    () => ({
      advance: permissions.includes('console.advance'),
      retry: permissions.includes('console.retry'),
      reassign: permissions.includes('console.reassign'),
      close: permissions.includes('console.close'),
    }),
    [permissions],
  );

  // If everything is hidden (CLINIC_USER, or closed case with no recovery
  // actions), don't render the section at all. Section header alone with
  // no content is visual noise.
  const anyAction = can.advance || can.retry || can.reassign || can.close;

  if (closedAt !== null) {
    // Closed cases: nothing to do. Show a small explanatory note where the
    // panel would be so users understand WHY there are no actions.
    if (!anyAction) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This case is closed. Reopening is a Tier 3 capability and not yet
            available.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!anyAction) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {can.advance ? (
              <Button
                variant="outline"
                leadingIcon={<FastForward size={14} />}
                onClick={() => { setActiveModal('advance'); }}
              >
                Force-advance
              </Button>
            ) : null}
            {can.retry ? (
              <Button
                variant="outline"
                leadingIcon={<RotateCcw size={14} />}
                onClick={() => { setActiveModal('retry'); }}
              >
                Retry
              </Button>
            ) : null}
            {can.reassign ? (
              <Button
                variant="outline"
                leadingIcon={<UserPlus size={14} />}
                onClick={() => { setActiveModal('reassign'); }}
              >
                Reassign
              </Button>
            ) : null}
            {can.close ? (
              <Button
                variant="destructive"
                leadingIcon={<XCircle size={14} />}
                onClick={() => { setActiveModal('close'); }}
              >
                Close
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Modals — controlled here so this component owns the lifecycle.
          Per kickoff §"Open questions" item 2, reset on close (default
          react-hook-form behavior — defaultValues re-apply when modal
          remounts via the `open` prop change). */}
      <RetryCaseModal
        caseId={caseId}
        open={activeModal === 'retry'}
        onOpenChange={(next) => {
          if (!next) setActiveModal(null);
        }}
      />
      <CloseCaseModal
        caseId={caseId}
        open={activeModal === 'close'}
        onOpenChange={(next) => {
          if (!next) setActiveModal(null);
        }}
      />
      <AdvanceCaseModal
        caseId={caseId}
        open={activeModal === 'advance'}
        onOpenChange={(next) => {
          if (!next) setActiveModal(null);
        }}
      />
      <ReassignOwnerModal
        caseId={caseId}
        currentOwner={currentOwner}
        open={activeModal === 'reassign'}
        onOpenChange={(next) => {
          if (!next) setActiveModal(null);
        }}
      />

      {/* Visually-hidden marker used by tests to locate the panel without
          depending on its layout. */}
      <span className="sr-only" data-testid="case-action-panel-mounted">
        case-action-panel
      </span>
    </>
  );
}
