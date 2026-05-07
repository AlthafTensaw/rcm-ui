import type { Meta, StoryObj } from '@storybook/react';

import { Img } from './Img';

const meta = {
  title: 'Primitives/Img',
  component: Img,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    src: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=300',
    alt: 'Office building',
    width: 300,
    height: 200,
  },
} satisfies Meta<typeof Img>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BrokenWithFallback: Story = {
  args: {
    src: 'https://example.invalid/no-such-file.png',
    fallbackSrc: 'https://placehold.co/300x200/teal/white?text=Fallback',
  },
};

export const SkeletonWhileLoading: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1554224155-cfa08c2a758f?w=300',
    showSkeleton: true,
  },
};
