import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FileUpload } from './FileUpload';

function makeFile(name: string, type: string, size = 100): File {
  const f = new File(['x'.repeat(size)], name, { type });
  return f;
}

describe('FileUpload', () => {
  it('renders the default drop zone content', () => {
    render(<FileUpload onFiles={vi.fn()} aria-label="Upload" />);
    expect(screen.getByLabelText('Upload')).toBeDefined();
    expect(
      screen.getByText('Drop files here or click to browse'),
    ).toBeDefined();
  });

  it('exposes the underlying file input', () => {
    const { container } = render(
      <FileUpload onFiles={vi.fn()} aria-label="Upload" />,
    );
    expect(container.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('invokes onFiles with selected files', async () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileUpload onFiles={onFiles} aria-label="Upload" />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    )!;
    const file = makeFile('a.png', 'image/png');
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);
    // react-dropzone runs validators async; allow microtasks.
    await new Promise((r) => setTimeout(r, 0));
    expect(onFiles).toHaveBeenCalled();
    expect(onFiles.mock.calls[0]?.[0][0].name).toBe('a.png');
  });

  it('renders accepted-types hint when accept is given', () => {
    render(
      <FileUpload
        onFiles={vi.fn()}
        accept="image/png,image/jpeg"
        aria-label="Upload"
      />,
    );
    expect(screen.getByText(/Accepted:/)).toBeDefined();
  });

  it('renders custom children when provided as ReactNode', () => {
    render(
      <FileUpload onFiles={vi.fn()} aria-label="Upload">
        <span data-testid="custom">Custom drop zone</span>
      </FileUpload>,
    );
    expect(screen.getByTestId('custom')).toBeDefined();
  });

  it('renders custom children when provided as render-prop', () => {
    render(
      <FileUpload onFiles={vi.fn()} aria-label="Upload">
        {(state) => (
          <span data-testid="rp">
            active={String(state.isDragActive)} files={state.selectedFiles.length}
          </span>
        )}
      </FileUpload>,
    );
    expect(screen.getByTestId('rp').textContent).toContain('active=false');
    expect(screen.getByTestId('rp').textContent).toContain('files=0');
  });

  it('respects disabled (zone gets opacity-50 and aria-disabled)', () => {
    render(<FileUpload onFiles={vi.fn()} disabled aria-label="Upload" />);
    const zone = screen.getByLabelText('Upload');
    expect(zone.className).toContain('opacity-50');
  });
});
