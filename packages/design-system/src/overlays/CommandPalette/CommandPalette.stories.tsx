import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { action } from '../../_storybook/action';
import { Calendar, FilePlus, Mail, Settings } from 'lucide-react';

import { CommandPalette } from './CommandPalette';
import { Button } from '../../primitives/Button';

const meta = {
  title: 'Overlays/CommandPalette',
  component: CommandPalette,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => { setOpen(true); }}>Open palette (⌘K)</Button>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          groups={[
            {
              label: 'Claims',
              items: [
                {
                  id: 'new-claim',
                  label: 'New claim',
                  icon: <FilePlus size={14} />,
                  shortcut: '⌘N',
                  onSelect: action('new-claim'),
                },
                {
                  id: 'send-statement',
                  label: 'Send statement',
                  icon: <Mail size={14} />,
                  onSelect: action('send-statement'),
                },
              ],
            },
            {
              label: 'Navigation',
              items: [
                {
                  id: 'goto-calendar',
                  label: 'Go to calendar',
                  icon: <Calendar size={14} />,
                  shortcut: '⌘1',
                  onSelect: action('goto-calendar'),
                },
                {
                  id: 'goto-settings',
                  label: 'Go to settings',
                  icon: <Settings size={14} />,
                  shortcut: '⌘,',
                  onSelect: action('goto-settings'),
                },
              ],
            },
          ]}
        />
      </>
    );
  },
};
