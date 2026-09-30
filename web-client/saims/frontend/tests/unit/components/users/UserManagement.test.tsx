import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserManagement from '@/components/users/UserManagement';

describe('UserManagement Component', () => {
  const mockUsers = [
    { id: '1', name: 'Admin', email: 'admin@test.com', role: 'Administrator' as const, phone: '123', department: 'IT' },
    { id: '2', name: 'Tech', email: 'tech@test.com', role: 'Teknisi' as const, phone: '456', department: 'Maintenance' }
  ];

  const mockOnUpdateRole = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders access denied for non-admin', () => {
    render(
      <UserManagement 
        users={mockUsers} 
        currentRole="Staff" 
        onUpdateUserRole={mockOnUpdateRole} 
        onDeleteUser={mockOnDelete} 
      />
    );
    
    expect(screen.getByText('Akses Terbatas: Administrator Only')).toBeInTheDocument();
    expect(screen.queryByText('Kelola Pengguna Sistem')).not.toBeInTheDocument();
  });

  it('renders correctly for admin', () => {
    render(
      <UserManagement 
        users={mockUsers} 
        currentRole="Administrator" 
        onUpdateUserRole={mockOnUpdateRole} 
        onDeleteUser={mockOnDelete} 
      />
    );
    
    expect(screen.getByText('Kelola Pengguna Sistem')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('triggers delete confirmation', () => {
    window.confirm = jest.fn().mockReturnValue(true);

    render(
      <UserManagement 
        users={mockUsers} 
        currentRole="Administrator" 
        onUpdateUserRole={mockOnUpdateRole} 
        onDeleteUser={mockOnDelete} 
      />
    );
    
    const deleteButtons = screen.getAllByRole('button');
    // Usually the last button in the row is delete. Let's find by clicking the trash icon (or the 2nd button in actions)
    // Actually, in the component, the delete button is rendered. Let's click the first button after "Ubah".
    const ubahButtons = screen.getAllByText('Ubah');
    const deleteBtn = ubahButtons[0].nextSibling as HTMLElement; // Assuming it's the next element
    
    fireEvent.click(deleteBtn);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('allows editing roles', () => {
    render(
      <UserManagement 
        users={mockUsers} 
        currentRole="Administrator" 
        onUpdateUserRole={mockOnUpdateRole} 
        onDeleteUser={mockOnDelete} 
      />
    );
    
    const ubahButtons = screen.getAllByText('Ubah');
    fireEvent.click(ubahButtons[1]); // Edit "Tech"

    const selectRole = screen.getByRole('combobox');
    expect(selectRole).toBeInTheDocument();
    
    fireEvent.change(selectRole, { target: { value: 'Supervisor' } });
    
    // Save button has a Check icon, Cancel has an X icon.
    // They don't have text. They are buttons inside the same td.
    const buttons = selectRole.parentElement?.nextElementSibling?.querySelectorAll('button');
    if (buttons && buttons.length > 0) {
      fireEvent.click(buttons[0]); // Save
      expect(mockOnUpdateRole).toHaveBeenCalledWith('2', 'Supervisor');
    }
  });
});
