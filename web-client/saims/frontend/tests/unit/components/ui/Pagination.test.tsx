import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, { getPaginationRange } from '@/components/ui/Pagination';

describe('getPaginationRange utility', () => {
  it('returns all pages when totalPages <= 7', () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('truncates pages with ellipsis when totalPages > 7', () => {
    const range = getPaginationRange(1, 27);
    expect(range).toContain('...');
    expect(range[0]).toBe(1);
    expect(range[range.length - 1]).toBe(27);
  });
});

describe('Pagination Component', () => {
  it('renders correct page info and buttons', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={27}
        totalItems={261}
        itemsPerPage={10}
        onPageChange={onPageChange}
        itemName="data log"
      />
    );

    expect(screen.getByText(/Menampilkan/i)).toBeInTheDocument();
    expect(screen.getByText('261')).toBeInTheDocument();
    expect(screen.getByText(/data log/i)).toBeInTheDocument();
  });

  it('calls onPageChange when next button is clicked', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        totalItems={100}
        itemsPerPage={10}
        onPageChange={onPageChange}
      />
    );

    const nextBtn = screen.getByLabelText('Halaman Selanjutnya');
    fireEvent.click(nextBtn);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
