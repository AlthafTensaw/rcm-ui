import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';
import { MemoryRouter } from 'react-router-dom';
import { Bell, LogOut, Settings, User } from 'lucide-react';

import {
  TopNav,
  TopNavItem,
  TopNavUserMenu,
} from './TopNav';
import { Avatar } from '../../primitives/Avatar';
import { Badge } from '../../feedback/Badge';
import { IconButton } from '../../primitives/IconButton';

const meta = {
  title: 'Navigation/TopNav',
  component: TopNav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TopNav
      logo={<span className="font-bold">Tensaw</span>}
      primaryNav={
        <>
          <TopNavItem to="/cases" active>Cases</TopNavItem>
          <TopNavItem to="/claims">Claims</TopNavItem>
          <TopNavItem to="/reports">Reports</TopNavItem>
          <TopNavItem to="/settings">Settings</TopNavItem>
        </>
      }
      utilityNav={
        <>
          <IconButton aria-label="Notifications" variant="ghost" icon={<Bell size={16} />} />
          <TopNavUserMenu
            trigger={<Avatar alt="Jane Doe" size="sm" />}
            items={[
              {
                label: 'Profile',
                icon: <User size={14} />,
                onSelect: action('profile'),
              },
              {
                label: 'Settings',
                icon: <Settings size={14} />,
                shortcut: '⌘,',
                onSelect: action('settings'),
              },
              {
                label: 'Sign out',
                icon: <LogOut size={14} />,
                variant: 'destructive',
                onSelect: action('signout'),
              },
            ]}
          />
        </>
      }
    />
  ),
};

export const Minimal: Story = {
  render: () => (
    <TopNav
      variant="minimal"
      logo={<span className="font-bold">Tensaw</span>}
      utilityNav={<Avatar alt="Jane Doe" size="sm" />}
    />
  ),
};

export const WithBadgesAndExternal: Story = {
  render: () => (
    <TopNav
      logo={<span className="font-bold">Tensaw</span>}
      primaryNav={
        <>
          <TopNavItem to="/inbox" badge={<Badge size="sm" variant="destructive">12</Badge>}>
            Inbox
          </TopNavItem>
          <TopNavItem to="/cases">Cases</TopNavItem>
          <TopNavItem href="https://docs.tensaw.example">Docs</TopNavItem>
        </>
      }
    />
  ),
};
