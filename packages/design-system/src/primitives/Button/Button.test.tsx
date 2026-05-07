import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined();
  });

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire onClick and sets aria-busy when loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /save/i });
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.hasAttribute('disabled')).toBe(true);
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders spinner instead of leadingIcon when loading', () => {
    render(
      <Button loading leadingIcon={<span data-testid="lead">L</span>}>
        Save
      </Button>,
    );
    expect(screen.queryByTestId('lead')).toBeNull();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('hides trailingIcon when loading', () => {
    render(
      <Button loading trailingIcon={<span data-testid="trail">T</span>}>
        Save
      </Button>,
    );
    expect(screen.queryByTestId('trail')).toBeNull();
  });

  it('renders leading and trailing icons when not loading', () => {
    render(
      <Button
        leadingIcon={<span data-testid="lead">L</span>}
        trailingIcon={<span data-testid="trail">T</span>}
      >
        Save
      </Button>,
    );
    expect(screen.getByTestId('lead')).toBeDefined();
    expect(screen.getByTestId('trail')).toBeDefined();
  });

  it.each([
    'primary',
    'secondary',
    'outline',
    'ghost',
    'destructive',
    'link',
  ] as const)('renders the %s variant', (variant) => {
    render(<Button variant={variant}>X</Button>);
    expect(screen.getByRole('button', { name: 'X' })).toBeDefined();
  });

  it.each(['sm', 'md', 'lg', 'icon'] as const)(
    'renders the %s size',
    (size) => {
      render(<Button size={size}>X</Button>);
      expect(screen.getByRole('button', { name: 'X' })).toBeDefined();
    },
  );

  it('forwards ref to the underlying button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  it('renders as the child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/elsewhere">Go</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Go' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/elsewhere');
  });

  it('activates on Enter and Space via keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('composes external className via cn()', () => {
    render(<Button className="custom-class">Save</Button>);
    expect(
      screen.getByRole('button', { name: 'Save' }).className,
    ).toContain('custom-class');
  });
});
