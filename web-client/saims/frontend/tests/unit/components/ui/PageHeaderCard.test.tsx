import React from 'react';
import { render, screen } from '@testing-library/react';
import PageHeaderCard from '@/components/ui/PageHeaderCard';
import { User } from 'lucide-react';

describe('PageHeaderCard Component', () => {
  it('renders title correctly', () => {
    render(<PageHeaderCard title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders description if provided', () => {
    render(<PageHeaderCard title="Users" description="Manage all users" />);
    expect(screen.getByText('Manage all users')).toBeInTheDocument();
  });

  it('renders module badge if provided', () => {
    render(<PageHeaderCard title="Assets" moduleBadge="Inventory" />);
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('renders icon if provided', () => {
    const { container } = render(<PageHeaderCard title="Profile" icon={User} />);
    // lucide-react renders an svg
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('renders right content if provided', () => {
    render(
      <PageHeaderCard 
        title="Settings" 
        rightContent={<button>Save Changes</button>} 
      />
    );
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });
});
