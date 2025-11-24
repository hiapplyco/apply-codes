import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSearchForm } from '../hooks/useSearchForm';

vi.mock('@/lib/function-bridge', () => ({
  functionBridge: {
    generateBooleanSearch: vi.fn(),
    processJobRequirements: vi.fn(),
    enhanceJobDescription: vi.fn(),
    extractNlpTerms: vi.fn(() => Promise.resolve({ terms: [] })),
    analyzeCompensation: vi.fn(() => Promise.resolve({ analysis: {} })),
    summarizeJob: vi.fn(() => Promise.resolve({ summary: 'summary', title: 'Job Title' })),
    summarizeTitle: vi.fn(() => Promise.resolve({ summary: 'summary', title: 'Job Title' })),
  },
}));

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockAddDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  storage: {},
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ state: null }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import mocked module to access mocks
const { functionBridge } = await import('@/lib/function-bridge');

describe('useSearchForm', () => {
  const mockOnJobCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (functionBridge.generateBooleanSearch as any).mockResolvedValue({ success: true, searchString: 'boolean string' });
    (functionBridge.processJobRequirements as any).mockResolvedValue({ searchString: 'boolean string' });
    (functionBridge.enhanceJobDescription as any).mockResolvedValue({ enhancedDescription: 'enhanced content' });

    mockCollection.mockReturnValue('jobs-collection');
    mockDoc.mockImplementation((...segments: any[]) => segments.join('/'));
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockAddDoc.mockResolvedValue({ id: 'mock-doc-id' });
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useSearchForm('test-user', mockOnJobCreated, null)
    );

    expect(result.current.searchText).toBe('');
    expect(result.current.companyName).toBe('');
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.searchType).toBe('candidates');
  });

  it('updates search text correctly', async () => {
    const { result } = renderHook(() =>
      useSearchForm('test-user', mockOnJobCreated, null)
    );

    act(() => {
      result.current.setSearchText('new search text');
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    expect(result.current.searchText).toBe('new search text');
  });

  it('handles form submission correctly', async () => {
    const { result } = renderHook(() =>
      useSearchForm('test-user', mockOnJobCreated, null)
    );

    act(() => {
      result.current.setSearchText('test content');
    });

    await act(async () => {
      await result.current.handleSubmit(new Event('submit') as any);
    });

    expect(mockOnJobCreated).toHaveBeenCalled();
    expect(functionBridge.processJobRequirements).toHaveBeenCalled();
  });
});
