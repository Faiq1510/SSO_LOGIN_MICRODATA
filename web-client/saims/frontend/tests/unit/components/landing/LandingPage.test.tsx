import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from '@/components/landing/LandingPage';

jest.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Mock ResizeObserver for lucide-react if needed (though not strictly necessary here, 
// sometimes useful if testing library complains about dimensions)
window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('LandingPage Component', () => {
  it('renders main heading correctly', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Kelola Aset/i)).toBeInTheDocument();
  });

  it('renders theme toggle', () => {
    render(<LandingPage />);
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('renders feature cards', () => {
    render(<LandingPage />);
    expect(screen.getAllByText('Inventory Barang').length).toBeGreaterThan(0);
    expect(screen.getAllByText('QR Code Tracking').length).toBeGreaterThan(0);
  });

  it('renders role section', () => {
    render(<LandingPage />);
    expect(screen.getByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('Teknisi')).toBeInTheDocument();
  });

  it('renders CTA login buttons', () => {
    render(<LandingPage />);
    const loginLinks = screen.getAllByRole('link', { name: /Login/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    
    const startLinks = screen.getAllByRole('link', { name: /Mulai Sekarang/i });
    expect(startLinks.length).toBeGreaterThan(0);
  });
});
