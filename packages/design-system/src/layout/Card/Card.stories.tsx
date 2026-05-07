import type { Meta, StoryObj } from '@storybook/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card';
import { Button } from '../../primitives/Button';
import { Badge } from '../../feedback/Badge';

const meta = {
  title: 'Layout/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  render: () => (
    <Card style={{ width: 380 }}>
      <CardContent className="pt-6">A bare card with just content.</CardContent>
    </Card>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card style={{ width: 380 }}>
      <CardHeader>
        <CardTitle>Claim 12345</CardTitle>
        <CardDescription>Submitted Apr 30, 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Total: $1,250.00 — payer: Aetna</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm">View</Button>
        <Button size="sm">Resubmit</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithBadgeInHeader: Story = {
  render: () => (
    <Card style={{ width: 380 }}>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>Claim 12345</CardTitle>
          <CardDescription>Submitted Apr 30, 2026</CardDescription>
        </div>
        <Badge variant="warning">Pending</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Awaiting payer response.</p>
      </CardContent>
    </Card>
  ),
};

export const StatList: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: 'Open', value: 47 },
        { label: 'Submitted', value: 312 },
        { label: 'Paid', value: 891 },
      ].map((s) => (
        <Card key={s.label} style={{ width: 200 }}>
          <CardHeader className="pb-2">
            <CardDescription>{s.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
