import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';

import { ToastHost } from './ToastHost';
import { Button } from '@tensaw/design-system';
import { useNotificationsStore } from '@tensaw/runtime';

const meta = {
  title: 'Wired/ToastHost',
  component: ToastHost,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastHost>;

export default meta;
type Story = StoryObj<typeof meta>;

function PushOne({ severity, title }: { severity: 'info' | 'success' | 'warning' | 'error'; title: string }) {
  return (
    <Button
      onClick={() =>
        { useNotificationsStore.getState().pushToast({
          toastId: `t-${Date.now()}`,
          severity,
          title,
          body: severity === 'error' ? 'Try again in a moment.' : undefined,
        }); }
      }
    >
      Push {severity}
    </Button>
  );
}

export const Empty: Story = {
  render: () => (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        Toast host is mounted but the queue is empty. Click to push.
      </p>
      <div className="mt-3 flex gap-2">
        <PushOne severity="success" title="Saved" />
        <PushOne severity="info" title="FYI" />
        <PushOne severity="warning" title="Heads up" />
        <PushOne severity="error" title="Save failed" />
      </div>
      <ToastHost />
    </div>
  ),
};

function Seeded() {
  useEffect(() => {
    const store = useNotificationsStore.getState();
    store.pushToast({ toastId: 't-1', severity: 'success', title: 'Saved' });
    store.pushToast({
      toastId: 't-2',
      severity: 'info',
      title: 'New release available',
      body: 'v1.4.0 just shipped.',
    });
    store.pushToast({
      toastId: 't-3',
      severity: 'error',
      title: 'Save failed',
      body: 'Network error. Try again.',
    });
  }, []);
  return <ToastHost />;
}

export const Seeded3Toasts: Story = {
  render: () => (
    <div className="p-6">
      <p className="text-sm text-muted-foreground">
        Three pre-seeded toasts of different severities.
      </p>
      <Seeded />
    </div>
  ),
};
