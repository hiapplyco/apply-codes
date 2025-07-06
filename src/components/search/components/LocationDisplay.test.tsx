import { render, screen } from '@testing-library/react';
import { LocationDisplay, GoogleStyleLocationDisplay } from './LocationDisplay';

describe('LocationDisplay', () => {
  it('renders location without company', () => {
    render(<LocationDisplay location="Atlanta Metropolitan Area" />);
    expect(screen.getByText('Atlanta Metropolitan Area')).toBeInTheDocument();
  });

  it('renders location with company when showCompany is true', () => {
    render(
      <LocationDisplay 
        location="Atlanta Metropolitan Area" 
        company="IGEL Technology" 
        showCompany={true} 
      />
    );
    expect(screen.getByText('Atlanta Metropolitan Area')).toBeInTheDocument();
    expect(screen.getByText('IGEL Technology')).toBeInTheDocument();
  });

  it('does not render company when showCompany is false', () => {
    render(
      <LocationDisplay 
        location="Atlanta Metropolitan Area" 
        company="IGEL Technology" 
        showCompany={false} 
      />
    );
    expect(screen.getByText('Atlanta Metropolitan Area')).toBeInTheDocument();
    expect(screen.queryByText('IGEL Technology')).not.toBeInTheDocument();
  });

  it('returns null when no location provided', () => {
    const { container } = render(<LocationDisplay />);
    expect(container.firstChild).toBeNull();
  });
});

describe('GoogleStyleLocationDisplay', () => {
  it('renders Google-style location display', () => {
    render(
      <GoogleStyleLocationDisplay 
        location="Atlanta Metropolitan Area" 
        company="IGEL Technology" 
      />
    );
    expect(screen.getByText('Atlanta Metropolitan Area')).toBeInTheDocument();
    expect(screen.getByText('IGEL Technology')).toBeInTheDocument();
    expect(screen.getByText('·')).toBeInTheDocument();
  });

  it('renders location without company separator when no company', () => {
    render(
      <GoogleStyleLocationDisplay 
        location="Atlanta Metropolitan Area" 
      />
    );
    expect(screen.getByText('Atlanta Metropolitan Area')).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });

  it('handles various location formats correctly', () => {
    const locations = [
      'New York, NY',
      'San Francisco Bay Area',
      'London, United Kingdom',
      'Remote'
    ];

    locations.forEach(location => {
      const { rerender } = render(
        <GoogleStyleLocationDisplay location={location} />
      );
      expect(screen.getByText(location)).toBeInTheDocument();
    });
  });
});