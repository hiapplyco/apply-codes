import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { Route, Routes } from 'react-router-dom';

// Mock environment variables to disable dev bypass
vi.stubEnv('VITE_BYPASS_AUTH', 'false');

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Navigate component to track navigation
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate">Navigating to {to}</div>),
  };
});

describe('ProtectedRoute', () => {
  const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

  const renderWithRoute = (initialRoute = '/protected') => {
    return render(
      <Routes>
        <Route path="/" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>,
      { initialRoute }
    );
  };

  describe('when loading', () => {
    it('should show loading spinner', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithRoute();

      // Look for the spinner by its CSS classes
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-purple-800');
    });
  });

  describe('when not authenticated', () => {
    it('should redirect to login page', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithRoute();

      expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /login');
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('when authenticated', () => {
    it('should render the protected content', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      renderWithRoute();

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
      });

      const { rerender } = renderWithRoute();
      const firstRender = screen.getByText('Protected Content');

      // Re-render with same props
      rerender(
        <Routes>
          <Route path="/" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      );

      const secondRender = screen.getByText('Protected Content');
      expect(firstRender).toBe(secondRender);
    });
  });
});