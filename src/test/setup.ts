import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Disable auth bypass in test environment
process.env.NEXT_PUBLIC_BYPASS_AUTH = 'false';

// Mock ProjectContext globally
jest.mock('@/context/ProjectContext', () => ({
  useProjectContext: () => ({
    projects: [],
    loading: false,
    selectedProjectId: null,
    selectedProject: undefined,
    setSelectedProjectId: jest.fn(),
    createProject: jest.fn().mockResolvedValue(null),
    updateProject: jest.fn().mockResolvedValue(true),
    archiveProject: jest.fn().mockResolvedValue(true),
    refetch: jest.fn().mockResolvedValue(undefined),
  }),
  ProjectProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// Suppress console errors in tests by default
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
