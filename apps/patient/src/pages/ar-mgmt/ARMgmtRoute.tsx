/**
 * ARMgmtRoute — thin route adapter for `<ARMgmtPage>`.
 *
 * `ARMgmtPage` accepts an `onRowClick(rowId)` callback because the page
 * itself doesn't know how the parent wants to handle navigation (could be
 * a router push, could be a modal, could be inline expansion). This route
 * adapter binds it to React Router's `useNavigate` so a row click
 * navigates to `/ar/:rowId`.
 *
 * Rationale for the wrapper rather than calling `useNavigate` inside
 * `ARMgmtPage`:
 *   - Keeps the page testable without `<MemoryRouter>` boilerplate
 *   - Matches the wrapper pattern we'll use for sibling pages
 *   - Lets us swap the click handler (e.g. open in a side drawer instead
 *     of navigating) without rewriting the page
 */

import { useNavigate } from 'react-router-dom';

import { ARMgmtPage } from './ARMgmtPage';

export function ARMgmtRoute() {
  const navigate = useNavigate();
  return (
    <ARMgmtPage
      onRowClick={(rowId) => {
        navigate(`/ar/${rowId}`);
      }}
    />
  );
}
