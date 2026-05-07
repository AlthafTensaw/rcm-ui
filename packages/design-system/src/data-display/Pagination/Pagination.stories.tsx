import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { Pagination } from './Pagination';

const meta = {
  title: 'Data Display/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function Wrapper(
  props: Omit<
    React.ComponentProps<typeof Pagination>,
    'pageIndex' | 'pageSize' | 'onPageChange' | 'onPageSizeChange'
  > & { initialPageSize?: number },
) {
  const { initialPageSize = 25, ...rest } = props;
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  return (
    <Pagination
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={setPageIndex}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPageIndex(0);
      }}
      {...rest}
    />
  );
}

export const Default: Story = {
  render: () => <Wrapper totalRows={137} />,
};

export const ManyPages: Story = {
  render: () => <Wrapper totalRows={4823} />,
};

export const Empty: Story = {
  render: () => <Wrapper totalRows={0} />,
};

export const NoFirstLast: Story = {
  render: () => <Wrapper totalRows={250} showFirstLast={false} />,
};

export const CustomPageSizes: Story = {
  render: () => (
    <Wrapper totalRows={500} pageSizeOptions={[10, 20, 50]} initialPageSize={20} />
  ),
};
