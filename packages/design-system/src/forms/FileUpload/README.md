# FileUpload

A drop zone + file picker with multi-file support, MIME-type filtering,
and size-limit enforcement.

## Usage

```tsx
import { FileUpload } from '@tensaw/design-system';

<FileUpload
  onFiles={async (files) => await uploadAttachments(files)}
  accept="image/png,image/jpeg,application/pdf"
  maxFiles={5}
  maxSize={10 * 1024 * 1024}
/>
```

## Props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `onFiles` | `(files: File[]) => void \| Promise<void>` | **required** | Fires when files are selected/dropped |
| `accept` | `string \| Accept` | — | MIME types or extensions; comma-separated string or react-dropzone Accept |
| `maxFiles` | `number` | `1` | Max files per upload |
| `maxSize` | `number` | — | Per-file size limit in bytes |
| `disabled` | `boolean` | `false` | Disables drop + click |
| `onReject` | `(rejections) => void` | — | Fires on files that fail validation |

Built on `react-dropzone`.

## Accessibility

- Click on the drop zone opens the native file picker
- Keyboard: Tab → Enter to open picker
- Drag-over state announces "Drop files to upload" via aria-live
- Rejections announce reason (size / MIME mismatch)

## Related

- `<Img>` — for displaying uploaded images
- Action-aware uploads: build a custom wired component on top of FileUpload

## Anti-patterns

- ❌ **Don't** silently swallow rejections. Wire `onReject` to a Toast so
  the user knows why their file didn't go through.
- ❌ **Don't** set very high `maxFiles` (> 50). UX gets clunky; chunk into
  multiple uploads.
