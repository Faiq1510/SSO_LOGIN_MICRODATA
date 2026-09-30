import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { notificationService } from '@/services/notificationService';
import { useRouter, usePathname } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/services/notificationService', () => ({
  notificationService: {
    getMyNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  },
}));

jest.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe('DashboardLayout Component', () => {
  const mockRouterPush = jest.fn();
  const mockUser = { id: 1, name: 'Test User', role: 'Administrator' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    (notificationService.getMyNotifications as jest.Mock).mockResolvedValue({
      data: [],
      unread_count: 0,
    });
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'saims_token') return 'fake-token';
      if (key === 'saims_user') return JSON.stringify(mockUser);
      return null;
    });
    Storage.prototype.removeItem = jest.fn();
  });

  it('redirects to login if user is not authenticated', () => {
    Storage.prototype.getItem = jest.fn().mockReturnValue(null);
    render(<DashboardLayout><div>Content</div></DashboardLayout>);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });

  it('renders layout and children when authenticated', async () => {
    render(<DashboardLayout><div>Dashboard Content</div></DashboardLayout>);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
    });
  });

  it('shows logout confirmation modal and logs out', async () => {
    render(<DashboardLayout><div>Content</div></DashboardLayout>);
    
    await waitFor(() => {
      expect(screen.getByTitle('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Logout'));
    
    expect(screen.getByText('Konfirmasi Keluar')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: /ya, keluar/i }));
    
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('saims_token');
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('saims_user');
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });

  it('toggles sidebar on desktop', async () => {
    render(<DashboardLayout><div>Content</div></DashboardLayout>);
    
    await waitFor(() => {
      expect(screen.getAllByTitle('Toggle Sidebar').length).toBeGreaterThan(0);
    });

    const toggleBtn = screen.getAllByTitle('Toggle Sidebar')[0];
    fireEvent.click(toggleBtn);
    
    // It should collapse (hide text like "SAIMS")
    expect(screen.queryByText('SAIMS')).not.toBeInTheDocument();
  });
});
