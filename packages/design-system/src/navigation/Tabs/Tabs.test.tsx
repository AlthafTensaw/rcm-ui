import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

function ControlledTabs({
  initial = 'a',
  variant,
  size,
  onValueChange,
}: {
  initial?: string;
  variant?: 'default' | 'underline' | 'pills';
  size?: 'sm' | 'md' | 'lg';
  onValueChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Tabs
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange?.(v);
      }}
      variant={variant}
      size={size}
    >
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">Apple</TabsTrigger>
        <TabsTrigger value="b" badge={<span data-testid="b-badge">3</span>}>
          Banana
        </TabsTrigger>
        <TabsTrigger value="c" disabled>
          Cherry
        </TabsTrigger>
      </TabsList>
      <TabsContent value="a">Apple panel</TabsContent>
      <TabsContent value="b">Banana panel</TabsContent>
      <TabsContent value="c">Cherry panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('renders tablist + triggers + the active content', () => {
    render(<ControlledTabs />);
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeDefined();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByText('Apple panel')).toBeDefined();
    expect(screen.queryByText('Banana panel')).toBeNull();
  });

  it('switches to the clicked tab', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledTabs onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: /Banana/ }));
    expect(onValueChange).toHaveBeenLastCalledWith('b');
    expect(await screen.findByText('Banana panel')).toBeDefined();
    expect(screen.queryByText('Apple panel')).toBeNull();
  });

  it('renders the badge slot on the trigger', () => {
    render(<ControlledTabs />);
    expect(screen.getByTestId('b-badge')).toBeDefined();
  });

  it('respects disabled triggers', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledTabs onValueChange={onValueChange} />);
    await user.click(screen.getByRole('tab', { name: 'Cherry' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(['default', 'underline', 'pills'] as const)(
    'renders the %s variant (data-tabs-variant attribute)',
    (variant) => {
      const { container } = render(<ControlledTabs variant={variant} />);
      const root = container.querySelector('[data-tabs-variant]');
      expect(root?.getAttribute('data-tabs-variant')).toBe(variant);
    },
  );

  it.each(['sm', 'md', 'lg'] as const)(
    'renders the %s size (data-tabs-size attribute)',
    (size) => {
      const { container } = render(<ControlledTabs size={size} />);
      const root = container.querySelector('[data-tabs-size]');
      expect(root?.getAttribute('data-tabs-size')).toBe(size);
    },
  );

  it('navigates via arrow keys', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledTabs onValueChange={onValueChange} />);
    const apple = screen.getByRole('tab', { name: 'Apple' });
    apple.focus();
    await user.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith('b');
  });

  it('lazy content does not render until the tab is first activated', async () => {
    const user = userEvent.setup();
    function LazyTabs() {
      const [v, setV] = useState('a');
      return (
        <Tabs value={v} onValueChange={setV}>
          <TabsList>
            <TabsTrigger value="a">A</TabsTrigger>
            <TabsTrigger value="b">B</TabsTrigger>
          </TabsList>
          <TabsContent value="a">A panel</TabsContent>
          <TabsContent value="b" lazy>
            <span data-testid="lazy-b">B panel content</span>
          </TabsContent>
        </Tabs>
      );
    }
    render(<LazyTabs />);
    // B's content not yet in DOM.
    expect(screen.queryByTestId('lazy-b')).toBeNull();
    // Activate B.
    await user.click(screen.getByRole('tab', { name: 'B' }));
    expect(await screen.findByTestId('lazy-b')).toBeDefined();
    // Switch back to A; B's content stays mounted (forceMount + lazy).
    await user.click(screen.getByRole('tab', { name: 'A' }));
    expect(screen.getByTestId('lazy-b')).toBeDefined();
  });
});
