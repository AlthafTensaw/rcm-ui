import type { Meta, StoryObj } from '@storybook/react';
import { action } from '../../_storybook/action';

import { FileUpload } from './FileUpload';

const meta = {
  title: 'Forms/FileUpload',
  component: FileUpload,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onFiles: action('onFiles'),
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: 480 }}>
      <FileUpload {...args} />
    </div>
  ),
};

export const ImagesOnly: Story = {
  render: (args) => (
    <div style={{ width: 480 }}>
      <FileUpload
        {...args}
        accept="image/png,image/jpeg"
        maxFiles={3}
      />
    </div>
  ),
};

export const PdfsLargeBatch: Story = {
  render: (args) => (
    <div style={{ width: 480 }}>
      <FileUpload
        {...args}
        accept="application/pdf"
        maxFiles={10}
        maxSize={10 * 1024 * 1024}
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div style={{ width: 480 }}>
      <FileUpload {...args} disabled />
    </div>
  ),
};
