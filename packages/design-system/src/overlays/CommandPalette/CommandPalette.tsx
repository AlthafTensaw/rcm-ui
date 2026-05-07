/**
 * CommandPalette — Cmd+K global search.
 *
 * Built from `cmdk` inside a Radix Dialog. Consumers register `groups` with
 * items; the palette handles search filtering (cmdk default + `keywords`),
 * arrow-key navigation, Enter to invoke, and Escape to close.
 *
 * The wired version (`<CommandPaletteWired>` in `@tensaw/wired-components`)
 * pulls action lists from the actions registry — this presentational shell
 * is the rendering primitive both versions share.
 */
import { type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';

import { cn } from '../../utils/cn';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  shortcut?: string;
  /** Additional search terms (cmdk includes label by default). */
  keywords?: string[];
  onSelect: () => void;
}

export interface CommandGroup {
  label: string;
  items: CommandItem[];
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  groups: CommandGroup[];
  emptyText?: string;
  className?: string;
}

export function CommandPalette({
  open,
  onOpenChange,
  placeholder = 'Type a command or search…',
  groups,
  emptyText = 'No results found.',
  className,
}: CommandPaletteProps): JSX.Element {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            'fixed left-1/2 top-1/4 z-50 w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg',
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Command palette
          </DialogPrimitive.Title>
          <Command label="Command palette">
            <Command.Input
              placeholder={placeholder}
              className="w-full border-b border-border bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Command.List className="max-h-80 overflow-y-auto p-1">
              <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </Command.Empty>
              {groups.map((group) => (
                <Command.Group
                  key={group.label}
                  heading={group.label}
                  className={cn(
                    '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                    '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold',
                    '[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:text-muted-foreground',
                  )}
                >
                  {group.items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.id}
                      keywords={[item.label, ...(item.keywords ?? [])]}
                      onSelect={() => {
                        item.onSelect();
                        onOpenChange(false);
                      }}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm',
                        'aria-selected:bg-accent aria-selected:text-accent-foreground',
                      )}
                    >
                      {item.icon && (
                        <span className="inline-flex h-4 w-4 items-center text-muted-foreground">
                          {item.icon}
                        </span>
                      )}
                      <span className="flex-1">
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        )}
                      </span>
                      {item.shortcut && (
                        <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                          {item.shortcut}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
CommandPalette.displayName = 'CommandPalette';
