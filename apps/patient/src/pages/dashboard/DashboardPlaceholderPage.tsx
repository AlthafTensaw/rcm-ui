/**
 * DashboardPlaceholderPage — a stub destination for the "Dashboard" SideNav
 * item so the navigation is fully wired without any 404s. Replace with a
 * real reporting page in a follow-up phase.
 */
import { LayoutDashboard } from 'lucide-react';

import { EmptyState } from '@tensaw/design-system';

export function DashboardPlaceholderPage() {
  return (
    <div className="p-8">
      <EmptyState
        icon={<LayoutDashboard size={40} className="text-muted-foreground" />}
        title="Dashboard coming soon"
        description="Reporting visualizations land here in a follow-up release."
      />
    </div>
  );
}
