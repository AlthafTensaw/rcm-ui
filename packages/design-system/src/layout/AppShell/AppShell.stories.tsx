import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { Inbox, FileText, Users, Settings } from 'lucide-react';

import { AppShell } from './AppShell';
import {
  TopNav,
  TopNavItem,
} from '../../navigation/TopNav';
import {
  SideNav,
  SideNavItem,
} from '../../navigation/SideNav';
import { Avatar } from '../../primitives/Avatar';
import { Card, CardContent } from '../Card';

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ height: '90vh' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const topNav = (
  <TopNav
    logo={<span className="font-bold">Tensaw</span>}
    primaryNav={
      <>
        <TopNavItem to="/inbox">Inbox</TopNavItem>
        <TopNavItem to="/cases" active>
          Cases
        </TopNavItem>
        <TopNavItem to="/reports">Reports</TopNavItem>
      </>
    }
    utilityNav={<Avatar alt="Jane Doe" size="sm" />}
  />
);

const sideNav = (
  <SideNav>
    <SideNavItem to="/inbox" icon={<Inbox size={16} />}>Inbox</SideNavItem>
    <SideNavItem to="/cases" icon={<FileText size={16} />}>Cases</SideNavItem>
    <SideNavItem to="/patients" icon={<Users size={16} />}>Patients</SideNavItem>
    <SideNavItem to="/settings" icon={<Settings size={16} />}>Settings</SideNavItem>
  </SideNav>
);

const main = (
  <div className="p-6">
    <h1 className="mb-4 text-2xl font-semibold">Cases</h1>
    <Card>
      <CardContent className="pt-6 text-sm">Main page content.</CardContent>
    </Card>
  </div>
);

export const TopOnly: Story = {
  render: () => <AppShell topNav={topNav}>{main}</AppShell>,
};

export const TopAndSide: Story = {
  render: () => (
    <AppShell topNav={topNav} sideNav={sideNav}>
      {main}
    </AppShell>
  ),
};

export const ThreeColumn: Story = {
  render: () => (
    <AppShell
      topNav={topNav}
      sideNav={sideNav}
      rightPanel={
        <div className="p-4">
          <h3 className="mb-2 text-sm font-semibold">Detail panel</h3>
          <p className="text-sm text-muted-foreground">
            Right-side rail for selected-row detail or contextual help.
          </p>
        </div>
      }
    >
      {main}
    </AppShell>
  ),
};
