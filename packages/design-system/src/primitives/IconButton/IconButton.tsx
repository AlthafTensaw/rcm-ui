/**
 * IconButton — a square `<Button size="icon">` whose only content is an icon.
 *
 * Because there's no visible text, `aria-label` is required at the type
 * level, not optional — every IconButton must announce itself to assistive
 * technology.
 */
import { forwardRef, type ReactNode } from 'react';

import { Button, type ButtonProps } from '../Button';

export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'leadingIcon' | 'trailingIcon'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ...props }, ref) => {
    return (
      <Button ref={ref} size="icon" {...props}>
        {icon}
      </Button>
    );
  },
);
IconButton.displayName = 'IconButton';
