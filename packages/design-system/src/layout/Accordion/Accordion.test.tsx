import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';

describe('Accordion', () => {
  it('renders triggers and hides content by default', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Section B</AccordionTrigger>
          <AccordionContent>B body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button', { name: 'Section A' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Section B' })).toBeDefined();
    // Radix may keep content mounted but hidden via display:none.
    // The accessible behavior is what matters: aria-expanded=false on triggers.
    expect(
      screen.getByRole('button', { name: 'Section A' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('expands an item on trigger click (single mode)', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('single mode collapses the previously open item', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>B body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('true');
    await user.click(screen.getByRole('button', { name: 'B' }));
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('false');
    expect(
      screen.getByRole('button', { name: 'B' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('multiple mode allows multiple open items', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>B</AccordionTrigger>
          <AccordionContent>B body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByRole('button', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: 'B' }));
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: 'B' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('respects defaultValue (single)', () => {
    render(
      <Accordion type="single" collapsible defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('respects controlled value + onValueChange (single)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Accordion
        type="single"
        collapsible
        value=""
        onValueChange={onValueChange}
      >
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(onValueChange).toHaveBeenCalledWith('a');
    rerender(
      <Accordion
        type="single"
        collapsible
        value="a"
        onValueChange={onValueChange}
      >
        <AccordionItem value="a">
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('respects disabled items', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a" disabled>
          <AccordionTrigger>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    await user.click(screen.getByRole('button', { name: 'A' }));
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('renders a custom icon on the trigger', () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger icon={<span data-testid="icon">+</span>}>
            A
          </AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(screen.getByTestId('icon')).toBeDefined();
  });

  it('omits the chevron icon when icon=null', () => {
    const { container } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger icon={null}>A</AccordionTrigger>
          <AccordionContent>A body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});
