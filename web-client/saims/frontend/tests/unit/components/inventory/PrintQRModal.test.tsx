import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintQRModal from '@/components/inventory/PrintQRModal';

// Mock window.print and window.open
const mockPrint = jest.fn();
const mockOpen = jest.fn().mockReturnValue({
  document: {
    write: jest.fn(),
    close: jest.fn(),
  },
});

beforeAll(() => {
  window.print = mockPrint;
  window.open = mockOpen;
});

describe('PrintQRModal Component', () => {
  const mockAsset = {
    id: 'JKT-IT-26-0001',
    name: 'Server Dell',
    category: 'IT',
    location: 'Jakarta',
    status: 'Tersedia' as const,
    condition: 'Baik' as const,
    qr_code: 'saims-qr-test',
    purchase_date: '2023-01-01',
    serial_number: 'SN123',
    description: 'Server Dell'
  };
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if not open', () => {
    render(<PrintQRModal isOpen={false} onClose={mockOnClose} asset={mockAsset} />);
    expect(screen.queryByText('Cetak QR Code')).not.toBeInTheDocument();
  });

  it('renders asset details when open', () => {
    render(<PrintQRModal isOpen={true} onClose={mockOnClose} asset={mockAsset} />);
    expect(screen.getByText('Cetak QR Code')).toBeInTheDocument();
    expect(screen.getByText('JKT-IT-26-0001')).toBeInTheDocument();
    expect(screen.getByText('Server Dell')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<PrintQRModal isOpen={true} onClose={mockOnClose} asset={mockAsset} />);
    fireEvent.click(screen.getByRole('button', { name: /Batal/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('triggers window.open when Print is clicked', () => {
    render(<PrintQRModal isOpen={true} onClose={mockOnClose} asset={mockAsset} />);
    fireEvent.click(screen.getByRole('button', { name: /Cetak Sekarang/i }));
    
    expect(mockOpen).toHaveBeenCalled();
  });
});
