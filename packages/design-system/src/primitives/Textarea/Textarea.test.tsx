import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a textarea by default', () => {
    render(<Textarea placeholder="notes" />);
    const ta = screen.getByPlaceholderText('notes');
    expect(ta.tagName).toBe('TEXTAREA');
  });

  it('honors rows attribute', () => {
    render(<Textarea placeholder="notes" rows={5} />);
    const ta = screen.getByPlaceholderText('notes');
    expect(ta.rows).toBe(5);
  });

  it('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="notes" />);
    const ta = screen.getByPlaceholderText('notes');
    await user.type(ta, 'hello');
    expect(ta.value).toBe('hello');
  });

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="notes" disabled />);
    const ta = screen.getByPlaceholderText('notes');
    await user.type(ta, 'hello');
    expect(ta.value).toBe('');
  });

  it('sets aria-invalid when error is true', () => {
    render(<Textarea placeholder="notes" error />);
    expect(
      screen.getByPlaceholderText('notes').getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('renders the autoResize variant when autoResize is true', () => {
    render(<Textarea placeholder="notes" autoResize minRows={2} maxRows={6} />);
    const ta = screen.getByPlaceholderText('notes');
    expect(ta.tagName).toBe('TEXTAREA');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea ref={ref} placeholder="notes" />);
    expect(ref.current?.tagName).toBe('TEXTAREA');
  });
});
