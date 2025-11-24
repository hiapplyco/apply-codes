import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Disable auth bypass in test environment
vi.stubEnv('VITE_BYPASS_AUTH', 'false');

// Mock ProjectContext globally
vi.mock('@/context/ProjectContext', () => ({
  useProjectContext: () => ({
    projects: [],
    loading: false,
    selectedProjectId: null,
    selectedProject: undefined,
    setSelectedProjectId: vi.fn(),
    createProject: vi.fn().mockResolvedValue(null),
    updateProject: vi.fn().mockResolvedValue(true),
    archiveProject: vi.fn().mockResolvedValue(true),
    refetch: vi.fn().mockResolvedValue(undefined),
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
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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