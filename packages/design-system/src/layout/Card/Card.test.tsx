import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it.each(['default', 'subtle', 'outline'] as const)(
    'renders the %s variant',
    (variant) => {
      const { container } = render(<Card variant={variant}>x</Card>);
      expect(container.firstChild).not.toBeNull();
    },
  );

  it.each(['none', 'sm', 'md', 'lg'] as const)('renders the %s padding', (p) => {
    const { container } = render(<Card padding={p}>x</Card>);
    expect(container.firstChild).not.toBeNull();
  });

  it('forwards ref to the root div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>x</Card>);
    expect(ref.current?.tagName).toBe('DIV');
  });

  it('passes through className', () => {
    render(<Card className="custom-x">x</Card>);
    expect(screen.getByText('x').className).toContain('custom-x');
  });
});

describe('Card sub-components', () => {
  it('renders Header / Title / Description / Content / Footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title text</CardTitle>
          <CardDescription>Description text</CardDescription>
        </CardHeader>
        <CardContent>Content text</CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(
      'Title text',
    );
    expect(screen.getByText('Description text')).toBeDefined();
    expect(screen.getByText('Content text')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Action' })).toBeDefined();
  });

  it('CardTitle renders as h3', () => {
    render(<CardTitle>Heading</CardTitle>);
    const h = screen.getByRole('heading', { level: 3 });
    expect(h.textContent).toBe('Heading');
  });

  it('forwards refs on each sub-component', () => {
    const headerRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descRef = createRef<HTMLParagraphElement>();
    const contentRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();
    render(
      <Card>
        <CardHeader ref={headerRef}>
          <CardTitle ref={titleRef}>t</CardTitle>
          <CardDescription ref={descRef}>d</CardDescription>
        </CardHeader>
        <CardContent ref={contentRef}>c</CardContent>
        <CardFooter ref={footerRef}>f</CardFooter>
      </Card>,
    );
    expect(headerRef.current?.tagName).toBe('DIV');
    expect(titleRef.current?.tagName).toBe('H3');
    expect(descRef.current?.tagName).toBe('P');
    expect(contentRef.current?.tagName).toBe('DIV');
    expect(footerRef.current?.tagName).toBe('DIV');
  });
});
