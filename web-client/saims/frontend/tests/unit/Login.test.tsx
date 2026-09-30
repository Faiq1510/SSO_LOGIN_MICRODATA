import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/components/auth/Login';
import { authService } from '@/services/auth.service';

// Mock authService
jest.mock('@/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    verifyOTP: jest.fn(),
    resendOTP: jest.fn(),
  },
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}));

describe('Login Component', () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    expect(screen.getByText('Selamat Datang Kembali')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@perusahaan.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk ke sistem/i })).toBeInTheDocument();
  });

  it('switches to registration form when clicking register link', () => {
    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    // Click switch link
    fireEvent.click(screen.getByText('Belum punya akun? Daftar sekarang'));
    
    // Should show registration form
    expect(screen.getByText('Buat Akun Baru')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Budi Santoso')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('81234567890')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('IT / HR / Finance')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /daftar sekarang/i })).toBeInTheDocument();
  });

  it('displays error message on failed login', async () => {
    (authService.login as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: 'Email atau password salah' } },
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('email@perusahaan.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /masuk ke sistem/i }));

    await waitFor(() => {
      expect(screen.getByText('Email atau password salah')).toBeInTheDocument();
    });
    
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'wrongpass',
    });
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it('calls onLoginSuccess on successful login', async () => {
    const mockResponse = {
      token: 'fake-jwt-token',
      user: { id: 1, name: 'Admin', role: 'Administrator' }
    };
    
    (authService.login as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('email@perusahaan.com'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'correctpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /masuk ke sistem/i }));

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockResponse.token, mockResponse.user);
    });
  });

  it('shows OTP step if user is not verified', async () => {
    (authService.login as jest.Mock).mockRejectedValueOnce({
      response: { data: { error: 'akun anda belum diverifikasi' } },
    });

    render(<Login onLoginSuccess={mockOnLoginSuccess} />);
    
    fireEvent.change(screen.getByPlaceholderText('email@perusahaan.com'), { target: { value: 'unverified@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /masuk ke sistem/i }));

    await waitFor(() => {
      expect(screen.getByText('Verifikasi OTP')).toBeInTheDocument();
      expect(screen.getByText('Silakan verifikasi OTP Anda terlebih dahulu.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument();
    });
  });
});
