/**
 * DocumentViewer — minimal native viewer per locked decision.
 *
 * Uses native browser PDF rendering (<iframe>) for PDFs and <img> for images.
 * Zero JS deps. No zoom/page controls — those are browser-native within the
 * iframe.
 *
 * Trade-offs vs react-pdf (rejected option):
 *   + Zero bundle cost
 *   + No CORS issues if PDF is same-origin
 *   - No programmatic zoom or page navigation from the host app
 *   - Browser PDF UI varies (Chrome's is good, Firefox's is good, Safari's is
 *     basic)
 *   - Mobile Safari may force download instead of inline render — fallback
 *     prompts the user to download in that case.
 *
 * For the EOB review screen which needs more sophisticated page control, a
 * future <DocumentViewer mode="advanced" /> can opt into react-pdf without
 * changing this component's API.
 */

import { useState, type CSSProperties } from 'react';

export interface DocumentViewerProps {
  /** URL or blob URL to the document. */
  src: string;
  /** Document type. Auto-detected from src extension if omitted. */
  type?: 'pdf' | 'image' | 'auto';
  /** Display name for download fallback. */
  filename?: string;
  /** Height. Default 600. */
  height?: number | string;
  /** Show fullscreen toggle. Default true. */
  showFullscreen?: boolean;
  /** Show download link. Default true. */
  showDownload?: boolean;
}

export function DocumentViewer({
  src,
  type = 'auto',
  filename,
  height = 600,
  showFullscreen = true,
  showDownload = true,
}: DocumentViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resolvedType = type === 'auto' ? detectType(src) : type;

  const containerStyle: CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        position: 'relative',
        width: '100%',
        height,
        background: 'var(--tw-color-surface-muted, #F9FAFB)',
        border: '1px solid var(--tw-color-border-muted, #E5E7EB)',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      };

  const toolbarStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid var(--tw-color-border-muted, #E5E7EB)',
    background: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
  };

  const filenameStyle: CSSProperties = {
    color: 'var(--tw-color-text-secondary, #6B7280)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: 12,
  };

  const linkStyle: CSSProperties = {
    color: 'var(--tw-color-text-link, #149A9A)',
    textDecoration: 'none',
    fontSize: 12,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
  };

  return (
    <div style={containerStyle} aria-label={filename ? `Document: ${filename}` : 'Document'}>
      <div style={toolbarStyle}>
        <span style={filenameStyle}>{filename ?? src.split('/').pop() ?? 'Document'}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {showDownload ? (
            <a href={src} download={filename} style={linkStyle}>
              Download
            </a>
          ) : null}
          {showFullscreen ? (
            <button
              type="button"
              onClick={() => { setIsFullscreen((v) => !v); }}
              style={linkStyle}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
            >
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {resolvedType === 'image' ? (
          <img
            src={src}
            alt={filename ?? 'Document'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#FFFFFF' }}
          />
        ) : (
          <iframe
            src={src}
            title={filename ?? 'Document'}
            style={{ width: '100%', height: '100%', border: 'none', background: '#FFFFFF' }}
          />
        )}
      </div>
    </div>
  );
}

function detectType(src: string): 'pdf' | 'image' {
  const lower = src.toLowerCase().split('?')[0] ?? '';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp') ||
    lower.endsWith('.svg')
  ) {
    return 'image';
  }
  return 'pdf';
}
