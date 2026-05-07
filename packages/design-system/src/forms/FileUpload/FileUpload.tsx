/**
 * FileUpload — drag-and-drop file zone.
 *
 * Wraps `react-dropzone`. Default content is a dashed-border zone with
 * "Drop files here or click to browse." Consumers can pass a render-prop
 * `children` to fully customize the inner UI while still inheriting the
 * dropzone behavior.
 *
 * Accept patterns follow react-dropzone's `accept` shape (record of
 * MIME → extensions). For simpler use cases, pass a comma-separated string
 * of MIME types / extensions and we'll convert.
 */
import { useMemo, type ReactNode } from 'react';
import {
  useDropzone,
  type Accept,
  type FileRejection,
} from 'react-dropzone';
import { Upload as UploadIcon } from 'lucide-react';

import { cn } from '../../utils/cn';

export interface DropzoneState {
  isDragActive: boolean;
  isDragReject: boolean;
  selectedFiles: File[];
}

export interface FileUploadProps {
  onFiles: (files: File[]) => void | Promise<void>;
  /** Either a comma-separated MIME/ext string, or a react-dropzone Accept. */
  accept?: string | Accept;
  /** Default 1. */
  maxFiles?: number;
  /** Bytes. */
  maxSize?: number;
  disabled?: boolean;
  /**
   * Custom content. Either a ReactNode (renders as the zone's child) or a
   * render-prop receiving the dropzone state.
   */
  children?: ReactNode | ((state: DropzoneState) => ReactNode);
  /** Forward rejected files (over-size, wrong type) to the consumer. */
  onReject?: (rejections: FileRejection[]) => void;
  className?: string;
  'aria-label'?: string;
  id?: string;
}

/**
 * Convert "image/*,application/pdf" or ".png,.pdf" into the
 * react-dropzone Accept record shape.
 */
function normalizeAccept(input: string | Accept | undefined): Accept | undefined {
  if (!input) return undefined;
  if (typeof input !== 'string') return input;
  const out: Record<string, string[]> = {};
  for (const raw of input.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (raw.startsWith('.')) {
      // Extension only — group under a wildcard MIME so dropzone accepts it.
      const list = (out['*/*'] ??= []);
      list.push(raw);
    } else {
      out[raw] = [];
    }
  }
  return out;
}

export function FileUpload({
  onFiles,
  accept,
  maxFiles = 1,
  maxSize,
  disabled,
  children,
  onReject,
  className,
  'aria-label': ariaLabel = 'File upload',
  id,
}: FileUploadProps): JSX.Element {
  const acceptObj = useMemo(() => normalizeAccept(accept), [accept]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
  } = useDropzone({
    onDrop: (accepted, rejections) => {
      if (rejections.length > 0) onReject?.(rejections);
      if (accepted.length > 0) void onFiles(accepted);
    },
    accept: acceptObj,
    maxFiles,
    maxSize,
    disabled,
    multiple: maxFiles !== 1,
  });

  const state: DropzoneState = {
    isDragActive,
    isDragReject,
    selectedFiles: acceptedFiles as File[],
  };

  const content =
    typeof children === 'function'
      ? (children as (s: DropzoneState) => ReactNode)(state)
      : children ?? (
          <div className="flex flex-col items-center gap-2 text-center">
            <UploadIcon
              className="h-6 w-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-foreground">
              {isDragActive
                ? isDragReject
                  ? 'File type not accepted'
                  : 'Drop here'
                : 'Drop files here or click to browse'}
            </p>
            {accept && (
              <p className="text-xs text-muted-foreground">
                Accepted:{' '}
                {typeof accept === 'string' ? accept : Object.keys(accept).join(', ')}
              </p>
            )}
          </div>
        );

  return (
    <div
      {...getRootProps({
        id,
        'aria-label': ariaLabel,
        className: cn(
          'flex w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed bg-background p-6 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragActive && !isDragReject && 'border-primary bg-accent/30',
          isDragReject && 'border-destructive bg-destructive/10',
          !isDragActive && 'border-input hover:bg-accent/20',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        ),
      })}
    >
      <input {...getInputProps()} />
      {content}
    </div>
  );
}
FileUpload.displayName = 'FileUpload';
