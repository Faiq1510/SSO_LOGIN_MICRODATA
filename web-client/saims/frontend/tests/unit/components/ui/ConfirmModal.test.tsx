import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '@/components/ui/ConfirmModal';

describe('ConfirmModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    message: 'This is a test message',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('renders title and message correctly when open', () => {
    render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('This is a test message')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /batal/i });
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('hides cancel button when hideCancel is true', () => {
    render(<ConfirmModal {...defaultProps} hideCancel={true} />);
    expect(screen.queryByRole('button', { name: /batal/i })).not.toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onConfirmMock = jest.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirmMock} confirmText="Hapus" />);
    
    const confirmButton = screen.getByRole('button', { name: /hapus/i });
    fireEvent.click(confirmButton);
    
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling based on type danger', () => {
    render(<ConfirmModal {...defaultProps} type="danger" />);
    const confirmButton = screen.getByRole('button', { name: /konfirmasi/i });
    expect(confirmButton).toHaveClass('bg-red-600');
  });
});
