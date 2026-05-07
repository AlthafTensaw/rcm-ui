import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import { Badge } from '../../feedback/Badge';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'underline', 'pills'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  args: Pick<React.ComponentProps<typeof Tabs>, 'variant' | 'size'>,
) {
  const [v, setV] = useState('files');
  return (
    <div style={{ width: 480 }}>
      <Tabs value={v} onValueChange={setV} {...args}>
        <TabsList>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="notes" badge={<Badge size="sm" variant="secondary">3</Badge>}>
            Notes
          </TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="pt-3 text-sm">
          Files panel content.
        </TabsContent>
        <TabsContent value="notes" className="pt-3 text-sm">
          Notes panel content.
        </TabsContent>
        <TabsContent value="audit" className="pt-3 text-sm">
          Audit panel content.
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Default: Story = { render: () => <Wrapper variant="default" size="md" /> };
export const Underline: Story = { render: () => <Wrapper variant="underline" size="md" /> };
export const Pills: Story = { render: () => <Wrapper variant="pills" size="md" /> };
export const Small: Story = { render: () => <Wrapper variant="default" size="sm" /> };
export const Large: Story = { render: () => <Wrapper variant="default" size="lg" /> };

export const LazyContent: Story = {
  render: () => {
    const [v, setV] = useState('a');
    return (
      <div style={{ width: 480 }}>
        <Tabs value={v} onValueChange={setV}>
          <TabsList>
            <TabsTrigger value="a">A (eager)</TabsTrigger>
            <TabsTrigger value="b">B (lazy)</TabsTrigger>
          </TabsList>
          <TabsContent value="a" className="pt-3 text-sm">A loaded immediately.</TabsContent>
          <TabsContent value="b" lazy className="pt-3 text-sm">
            B mounted only after first activation; state preserved on switch.
          </TabsContent>
        </Tabs>
      </div>
    );
  },
};
