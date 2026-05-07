import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Trash2 } from 'lucide-react';

import { Button } from './Button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Versatile button component with variants for visual hierarchy. Use `<IconButton>` for icon-only buttons (auto-handles `aria-label`); use `<ActionButton>` from `@tensaw/wired-components` for buttons that dispatch a registered action.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    asChild: { control: 'boolean' },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---- Variants -------------------------------------------------------------

export const Primary: Story = {
  args: { variant: 'primary', children: 'Save changes' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancel' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Edit' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Dismiss' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete claim' },
};

export const LinkVariant: Story = {
  name: 'Link',
  args: { variant: 'link', children: 'Learn more' },
};

// ---- Sizes ----------------------------------------------------------------

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Medium: Story = {
  args: { size: 'md', children: 'Medium (default)' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

// ---- States ---------------------------------------------------------------

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Saving…' },
};

export const LoadingDestructive: Story = {
  args: { variant: 'destructive', loading: true, children: 'Deleting…' },
};

// ---- Icons ----------------------------------------------------------------

export const WithLeadingIcon: Story = {
  args: {
    leadingIcon: <Mail size={16} />,
    children: 'Send email',
  },
};

export const WithTrailingIcon: Story = {
  args: {
    trailingIcon: <Mail size={16} />,
    children: 'Inbox',
  },
};

export const DestructiveWithIcon: Story = {
  args: {
    variant: 'destructive',
    leadingIcon: <Trash2 size={16} />,
    children: 'Delete',
  },
};

// ---- Edge cases -----------------------------------------------------------

export const VeryLongLabel: Story = {
  args: {
    children:
      'This is a very long label that demonstrates how the button handles overflow when forced into a narrow container.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Buttons with long labels grow horizontally; consumers wanting a fixed width should set `className` with `w-*` utilities.',
      },
    },
  },
};
