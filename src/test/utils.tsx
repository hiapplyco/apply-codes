import { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock ProjectContext for tests
const mockProjectContextValue = {
  projects: [],
  loading: false,
  selectedProjectId: null,
  selectedProject: undefined,
  setSelectedProjectId: () => {},
  createProject: async () => null,
  updateProject: async () => true,
  archiveProject: async () => true,
  refetch: async () => {},
};

// Create a mock ProjectContext
const ProjectContext = createContext(mockProjectContextValue);

function MockProjectProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProjectContext.Provider value={mockProjectContextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  window.history.pushState({}, 'Test page', initialRoute);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MockProjectProvider>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </MockProjectProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Custom test utilities
export { renderWithProviders as render };