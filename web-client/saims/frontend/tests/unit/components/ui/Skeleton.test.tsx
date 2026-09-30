import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton Component', () => {
  it('renders correctly with default styles', () => {
    const { container } = render(<Skeleton />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toBeInTheDocument();
    expect(skeletonElement).toHaveClass('animate-pulse');
    expect(skeletonElement).toHaveClass('rounded-md');
    expect(skeletonElement).toHaveClass('bg-gray-200');
    expect(skeletonElement).toHaveClass('dark:bg-gray-800');
  });

  it('accepts and applies custom className', () => {
    const { container } = render(<Skeleton className="w-10 h-10 mt-2" />);
    const skeletonElement = container.firstChild as HTMLElement;
    
    expect(skeletonElement).toHaveClass('w-10');
    expect(skeletonElement).toHaveClass('h-10');
    expect(skeletonElement).toHaveClass('mt-2');
    expect(skeletonElement).toHaveClass('animate-pulse');
  });
});
