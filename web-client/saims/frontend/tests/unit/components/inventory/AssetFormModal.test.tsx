import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AssetFormModal from '@/components/inventory/AssetFormModal';
import { assetService } from '@/services/asset.service';

jest.mock('@/services/asset.service', () => ({
  assetService: {
    createAsset: jest.fn(),
    createBulkAssets: jest.fn(),
    updateAsset: jest.fn(),
  },
}));

describe('AssetFormModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open for create', () => {
    render(<AssetFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    
    expect(screen.getByText('Registrasi Aset Baru')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Contoh: iPad Pro M2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Simpan Aset/i })).toBeInTheDocument();
  });

  it('populates form fields when editing an asset', async () => {
    const mockAsset = {
      id: 'JKT-IT-26-0001',
      name: 'MacBook Pro',
      category: 'IT',
      location: 'Jakarta',
      status: 'Tersedia' as const,
      condition: 'Baik' as const,
      qr_code: 'qr',
      purchase_date: '2023-01-01',
      serial_number: 'SN123',
      description: 'M2 Chip'
    };

    render(<AssetFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} asset={mockAsset} />);
    
    expect(screen.getByText('Edit Aset (JKT-IT-26-0001)')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SN123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('M2 Chip')).toBeInTheDocument();
  });

  it('calls createAsset and onSave when submitting valid data', async () => {
    (assetService.createAsset as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<AssetFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    
    fireEvent.change(screen.getByPlaceholderText(/Contoh: iPad Pro M2/i), { target: { value: 'New Monitor' } });
    fireEvent.change(screen.getByPlaceholderText(/SN-128490DX/i), { target: { value: 'MON-123' } });
    fireEvent.change(screen.getByPlaceholderText(/Masukkan detail tambahan/i), { target: { value: '27 inch 4K' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Simpan Aset/i }));

    await waitFor(() => {
      expect(assetService.createAsset).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('calls createBulkAssets and onSave when quantity > 1', async () => {
    (assetService.createBulkAssets as jest.Mock).mockResolvedValueOnce([{ id: 'JKT-IT-26-0001' }]);

    render(<AssetFormModal isOpen={true} onClose={mockOnClose} onSave={mockOnSave} />);
    
    // Change quantity to 2
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    
    // Fill common details
    fireEvent.change(screen.getByPlaceholderText(/Contoh: iPad Pro M2/i), { target: { value: 'Bulk Monitor' } });
    fireEvent.change(screen.getByPlaceholderText(/Masukkan detail tambahan/i), { target: { value: 'Bulk desc' } });
    
    // Fill serial numbers for dynamic rows
    const snInputs = screen.getAllByPlaceholderText('S/N unit');
    expect(snInputs).toHaveLength(2);
    
    fireEvent.change(snInputs[0], { target: { value: 'SN-BULK-1' } });
    fireEvent.change(snInputs[1], { target: { value: 'SN-BULK-2' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Simpan Aset/i }));

    await waitFor(() => {
      expect(assetService.createBulkAssets).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Bulk Monitor',
        items: [
          { serial_number: 'SN-BULK-1', condition: 'Baik', status: 'Tersedia' },
          { serial_number: 'SN-BULK-2', condition: 'Baik', status: 'Tersedia' },
        ]
      }));
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});
