import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MaintenanceFormModal from '@/components/maintenance/MaintenanceFormModal';
import { assetService } from '@/services/asset.service';
import { userService } from '@/services/user.service';
import { maintenanceService } from '@/services/maintenance.service';

jest.mock('@/services/asset.service', () => ({
  assetService: {
    getAssets: jest.fn(),
  }
}));

jest.mock('@/services/user.service', () => ({
  userService: {
    getUsers: jest.fn(),
  }
}));

jest.mock('@/services/maintenance.service', () => ({
  maintenanceService: {
    createMaintenance: jest.fn(),
    updateDetails: jest.fn(),
  }
}));

describe('MaintenanceFormModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  
  const mockAdminUser = { id: 'admin1', name: 'Admin', role: 'Administrator' as const, email: 'admin@test.com', phone: '123', department: 'IT' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (assetService.getAssets as jest.Mock).mockResolvedValue({
      data: [
        { id: 'JKT-IT-26-0001', name: 'PC', status: 'Tersedia' },
        { id: 'JKT-IT-26-0002', name: 'Mac', status: 'Maintenance' } // Should be filtered out
      ]
    });
    
    (userService.getUsers as jest.Mock).mockResolvedValue([
      { id: 'tech1', name: 'Tech One', role: 'Teknisi' },
      { id: 'staff1', name: 'Staff', role: 'Staff' }
    ]);
  });

  it('renders correctly and fetches assets/technicians', async () => {
    render(
      <MaintenanceFormModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        currentUser={mockAdminUser}
      />
    );

    expect(screen.getByText('Jadwalkan Maintenance Baru')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(assetService.getAssets).toHaveBeenCalled();
      expect(userService.getUsers).toHaveBeenCalled();
    });

    // Check if Tersedia asset is an option
    await waitFor(() => {
      expect(document.querySelector('option[value="JKT-IT-26-0001"]')).toBeInTheDocument();
    });
    // Tech should be an option
    expect(document.querySelector('option[value="tech1"]')).toBeInTheDocument();
  });

  it('submits form correctly', async () => {
    (maintenanceService.createMaintenance as jest.Mock).mockResolvedValue({});

    render(
      <MaintenanceFormModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        currentUser={mockAdminUser}
      />
    );

    await waitFor(() => {
      expect(document.querySelector('option[value="JKT-IT-26-0001"]')).toBeInTheDocument();
    });

    const selects = document.querySelectorAll('select');
    const assetSelect = selects[0]; // Aset yang Tersedia
    fireEvent.change(assetSelect, { target: { value: 'JKT-IT-26-0001' } });

    const techSelect = selects[1]; // Teknisi Pengampu
    fireEvent.change(techSelect, { target: { value: 'tech1' } });

    fireEvent.click(screen.getByRole('button', { name: /Jadwalkan Sekarang/i }));

    await waitFor(() => {
      expect(maintenanceService.createMaintenance).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('renders edit mode correctly', async () => {
    const editData = {
      id: '1',
      asset_id: 'JKT-IT-26-0099',
      asset_name: 'Server Lama',
      technician_id: 'tech1',
      technician_name: 'Tech One',
      type: 'Perbaikan' as const,
      status: 'Dijadwalkan' as const,
      payment_status: 'Menunggu Pembayaran',
      cost: 500000,
      estimated_cost: 500000,
      notes: 'Ganti pasta',
      scheduled_date: '2025-01-01',
      created_at: '',
      updated_at: ''
    };

    render(
      <MaintenanceFormModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSave={mockOnSave} 
        currentUser={mockAdminUser}
        editData={editData}
      />
    );

    expect(screen.getByText('Edit Pengajuan Maintenance')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Ganti pasta')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
    });
  });
});
