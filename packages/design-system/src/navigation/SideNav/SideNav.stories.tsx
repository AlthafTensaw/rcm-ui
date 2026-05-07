import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  Calendar,
  ChartBar,
  FileText,
  Inbox,
  Settings,
  Users,
} from 'lucide-react';

import {
  SideNav,
  SideNavGroup,
  SideNavItem,
  SideNavSearch,
} from './SideNav';
import { Badge } from '../../feedback/Badge';

const meta = {
  title: 'Navigation/SideNav',
  component: SideNav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/cases']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

const ItemSet = (): JSX.Element => (
  <>
    <SideNavItem to="/inbox" icon={<Inbox size={16} />} badge={<Badge size="sm">3</Badge>}>
      Inbox
    </SideNavItem>
    <SideNavItem to="/cases" icon={<FileText size={16} />}>
      Cases
    </SideNavItem>
    <SideNavItem to="/patients" icon={<Users size={16} />}>
      Patients
    </SideNavItem>
    <SideNavItem to="/calendar" icon={<Calendar size={16} />}>
      Calendar
    </SideNavItem>
  </>
);

export const Expanded: Story = {
  render: () => (
    <div className="flex h-screen">
      <SideNav>
        <ItemSet />
      </SideNav>
      <div className="flex-1 p-6 text-sm text-muted-foreground">Page content</div>
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <div className="flex h-screen">
      <SideNav collapsed>
        <ItemSet />
      </SideNav>
      <div className="flex-1 p-6 text-sm text-muted-foreground">Page content</div>
    </div>
  ),
};

export const Collapsible: Story = {
  render: () => {
    const [collapsed, setCollapsed] = useState(false);
    return (
      <div className="flex h-screen">
        <SideNav collapsed={collapsed} onCollapseChange={setCollapsed}>
          <ItemSet />
        </SideNav>
        <div className="flex-1 p-6 text-sm text-muted-foreground">
          Page content. Toggle the collapse via the chevron in the SideNav header.
        </div>
      </div>
    );
  },
};

export const WithGroups: Story = {
  render: () => (
    <div className="flex h-screen">
      <SideNav>
        <SideNavGroup label="Operations">
          <SideNavItem to="/inbox" icon={<Inbox size={16} />}>Inbox</SideNavItem>
          <SideNavItem to="/cases" icon={<FileText size={16} />}>Cases</SideNavItem>
        </SideNavGroup>
        <SideNavGroup label="Insights" collapsible defaultExpanded={false}>
          <SideNavItem to="/reports" icon={<ChartBar size={16} />}>Reports</SideNavItem>
        </SideNavGroup>
        <SideNavGroup label="Admin" collapsible>
          <SideNavItem to="/settings" icon={<Settings size={16} />}>Settings</SideNavItem>
        </SideNavGroup>
      </SideNav>
      <div className="flex-1 p-6 text-sm text-muted-foreground">Page content</div>
    </div>
  ),
};

export const WithSearch: Story = {
  render: () => (
    <div className="flex h-screen">
      <SideNav>
        <SideNavSearch
          placeholder="Search…"
          onSearch={async (q) => {
            await new Promise((r) => setTimeout(r, 150));
            if (!q) return [];
            return [
              { id: '1', label: `${q.toUpperCase()} - patient`, to: '/patients/1' },
              { id: '2', label: `${q.toUpperCase()} - case`, to: '/cases/1' },
            ];
          }}
        />
        <ItemSet />
      </SideNav>
      <div className="flex-1 p-6 text-sm text-muted-foreground">Page content</div>
    </div>
  ),
};
