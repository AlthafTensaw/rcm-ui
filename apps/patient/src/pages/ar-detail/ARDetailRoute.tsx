/**
 * ARDetailRoute — thin route adapter for `<ARDetailPage>`.
 *
 * Reads `:rowId` from the URL via `useParams` and binds `onBack` to
 * `navigate('/ar')` so the back button returns to the list. Same pattern
 * as `ARMgmtRoute`: keeps the page itself testable without router
 * boilerplate, and lets us swap the back behavior independently.
 */

import { useNavigate, useParams } from 'react-router-dom';

import { ARDetailPage } from './ARDetailPage';

export function ARDetailRoute() {
  const navigate = useNavigate();
  const { rowId } = useParams<{ rowId: string }>();

  // Defensive: createBrowserRouter guarantees `:rowId` is present for this
  // route, but TypeScript types it as optional. If it ever is undefined,
  // bounce back to the list rather than rendering a broken detail page.
  if (!rowId) {
    navigate('/ar', { replace: true });
    return null;
  }

  return (
    <ARDetailPage
      rowId={rowId}
      onBack={() => {
        navigate('/ar');
      }}
    />
  );
}
