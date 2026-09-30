import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorView from '@/components/ui/ErrorView';

describe('ErrorView Component', () => {
  it('renders 404 page correctly', () => {
    render(<ErrorView code={404} />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Halaman Tidak Ditemukan')).toBeInTheDocument();
    expect(screen.getByText(/Kembali ke Dashboard/i)).toBeInTheDocument();
  });

  it('renders 500 page correctly with retry button', () => {
    const onRetry = jest.fn();
    render(<ErrorView code={500} onRetry={onRetry} />);

    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('Kendala Server Internal')).toBeInTheDocument();
    
    const retryBtn = screen.getByText('Coba Lagi');
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
