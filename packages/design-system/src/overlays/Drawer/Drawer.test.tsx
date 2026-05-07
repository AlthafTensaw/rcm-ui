import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders title and body when open', () => {
    render(
      <Drawer open onOpenChange={vi.fn()} title="Settings">
        <p>Body content</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
    expect(screen.getByText('Body content')).toBeDefined();
  });

  it('does not render content when closed', () => {
    render(
      <Drawer open={false} onOpenChange={vi.fn()} title="t">
        body
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders footer when given', () => {
    render(
      <Drawer
        open
        onOpenChange={vi.fn()}
        title="t"
        footer={<button>Save</button>}
      >
        body
      </Drawer>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it.each(['left', 'right', 'top', 'bottom'] as const)(
    'renders the %s side',
    (side) => {
      render(
        <Drawer open onOpenChange={vi.fn()} side={side} title="t">
          body
        </Drawer>,
      );
      expect(screen.getByRole('dialog')).toBeDefined();
    },
  );

  it.each(['sm', 'md', 'lg', 'full'] as const)('renders the %s size', (size) => {
    render(
      <Drawer open onOpenChange={vi.fn()} size={size} title="t">
        body
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('renders without a title', () => {
    render(
      <Drawer open onOpenChange={vi.fn()}>
        body
      </Drawer>,
    );
    expect(screen.getByText('body')).toBeDefined();
  });
});
