import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

describe('ProtectedRoute Component', () => {
  const mockRouterPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockRouterPush });
  });

  it('redirects to login if user cookie is not present', async () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
    
    // Children should not be rendered
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children if user is authenticated and no specific roles are required', async () => {
    const mockUser = { id: 1, role: 'Staff' };
    (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(mockUser));

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
    
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('renders children if user role is in allowedRoles', async () => {
    const mockUser = { id: 1, role: 'Administrator' };
    (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(mockUser));

    render(
      <ProtectedRoute allowedRoles={['Administrator', 'Supervisor']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Content')).toBeInTheDocument();
    });
    
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('redirects to dashboard if user role is NOT in allowedRoles', async () => {
    const mockUser = { id: 1, role: 'Staff' };
    (Cookies.get as jest.Mock).mockReturnValue(JSON.stringify(mockUser));

    render(
      <ProtectedRoute allowedRoles={['Administrator', 'Supervisor']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
    });
    
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to login if cookie is malformed (JSON parse error)', async () => {
    (Cookies.get as jest.Mock).mockReturnValue('invalid-json');

    render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/login');
    });
  });
});
