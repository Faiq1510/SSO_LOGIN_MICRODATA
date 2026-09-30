import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardAnalytics from '@/components/dashboard/DashboardAnalytics';

describe('DashboardAnalytics Component', () => {
  const mockStats = {
    total_assets: 100,
    available_assets: 70,
    borrowed_assets: 20,
    maintenance_assets: 10,
    total_users: 5,
    total_borrowings: 15,
    total_maintenance: 5,
    categories_stats: [
      { category: 'IT', count: 50 },
      { category: 'Elektronik', count: 30 },
      { category: 'Furnitur', count: 20 }
    ],
    conditions_stats: [
      { condition: 'Baik', count: 80 },
      { condition: 'Rusak Ringan', count: 15 },
      { condition: 'Rusak Berat', count: 5 }
    ]
  };

  it('renders total stats correctly', () => {
    render(<DashboardAnalytics stats={mockStats} />);
    
    // Check if the total assets number is rendered
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    
    // Check if available, borrowed, maintenance numbers are rendered
    expect(screen.getAllByText('70').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20').length).toBeGreaterThan(0);
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
  });

  it('renders category chart correctly', () => {
    render(<DashboardAnalytics stats={mockStats} />);
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('50 Aset (50%)')).toBeInTheDocument();
  });

  it('renders condition chart correctly', () => {
    render(<DashboardAnalytics stats={mockStats} />);
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('handles empty stats safely', () => {
    const emptyStats = {
      total_assets: 0,
      available_assets: 0,
      borrowed_assets: 0,
      maintenance_assets: 0,
      total_users: 0,
      total_borrowings: 0,
      total_maintenance: 0,
      categories_stats: [],
      conditions_stats: []
    };
    render(<DashboardAnalytics stats={emptyStats} />);
    
    // Check that percentages don't result in NaN when total is 0
    expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    expect(screen.getByText('Belum ada data visual')).toBeInTheDocument();
  });
});
