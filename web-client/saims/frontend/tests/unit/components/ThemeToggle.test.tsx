import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from 'next-themes';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

describe('ThemeToggle Component', () => {
  const setThemeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders sun icon when theme is dark', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      setTheme: setThemeMock,
      resolvedTheme: 'dark',
    });

    // Mock useEffect to simulate mounted state
    jest.spyOn(React, 'useEffect').mockImplementationOnce(f => f());

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  it('calls setTheme when clicked', () => {
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: setThemeMock,
      resolvedTheme: 'light',
    });

    jest.spyOn(React, 'useEffect').mockImplementationOnce(f => f());

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button', { name: /toggle theme/i });
    fireEvent.click(button);
    
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });
});
