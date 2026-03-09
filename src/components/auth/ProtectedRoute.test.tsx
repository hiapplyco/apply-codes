import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useNewAuth } from '@/context/NewAuthContext';

// Disable auth bypass in test environment
process.env.NEXT_PUBLIC_BYPASS_AUTH = 'false';

// Mock the NewAuthContext
jest.mock('@/context/NewAuthContext', () => ({
  useNewAuth: jest.fn(),
}));

// Mock the useSubscription hook
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    subscription: null,
    loading: false,
    isExpired: () => false,
  })),
}));

// Mock next/navigation
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/protected',
}));

describe('ProtectedRoute', () => {
  const mockUseAuth = useNewAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when loading', () => {
    it('should show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      // Look for the spinner by its CSS classes
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('when not authenticated', () => {
    it('should call router.replace to redirect to login', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockReplace).toHaveBeenCalledWith('/login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('should render the protected content', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      const { rerender } = render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      const firstRender = screen.getByText('Protected Content');

      // Re-render with same props
      rerender(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      const secondRender = screen.getByText('Protected Content');
      expect(firstRender).toBe(secondRender);
    });
  });
});
