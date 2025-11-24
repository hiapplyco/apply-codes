import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor, userEvent } from '@/test/utils';
import { JobPostingForm } from './JobPostingForm';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

vi.mock('@/lib/function-bridge', () => ({
  functionBridge: {
    generateBooleanSearch: vi.fn(),
    enhanceJobDescription: vi.fn(),
    extractNlpTerms: vi.fn(),
    analyzeCompensation: vi.fn(),
    summarizeJob: vi.fn(),
    summarizeTitle: vi.fn(),
  },
}));

const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
}));

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Import mocked module to access mocks
const { functionBridge } = await import('@/lib/function-bridge');

describe('JobPostingForm', () => {
  const mockNavigate = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnError = vi.fn();
  const mockSession = { user: { id: 'user-123' } };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as unknown as Mock).mockReturnValue({ session: mockSession });
    (useNavigate as unknown as Mock).mockReturnValue(mockNavigate);

    mockCollection.mockReturnValue('jobs-collection');
    mockDoc.mockImplementation((arg1: any, arg2?: string, arg3?: string) => {
      if (arg3) return { id: arg3 };
      if (arg2 && !arg3) return { id: arg2 };
      if (arg1 === 'jobs-collection') return { id: 'new-job-id' };
      return { id: 'doc-id' };
    });
    mockGetDoc.mockResolvedValue({ exists: () => false, data: () => ({}) });
    mockSetDoc.mockResolvedValue(undefined);
    mockUpdateDoc.mockResolvedValue(undefined);

    (functionBridge.generateBooleanSearch as any).mockResolvedValue({ success: true, searchString: 'boolean string' });
    (functionBridge.enhanceJobDescription as any).mockResolvedValue({ enhancedDescription: 'enhanced content' });
    (functionBridge.extractNlpTerms as any).mockResolvedValue({ terms: [] });
    (functionBridge.analyzeCompensation as any).mockResolvedValue({ analysis: {} });
    (functionBridge.summarizeJob as any).mockResolvedValue({ summary: 'summary', title: 'Job Title' });
    (functionBridge.summarizeTitle as any).mockResolvedValue({ summary: 'summary', title: 'Job Title' });
  });

  it('renders the form with placeholder text', () => {
    render(<JobPostingForm />);
    expect(screen.getByPlaceholderText(/Title: Software Engineer/)).toBeInTheDocument();
    expect(screen.getByText(/Create Job Posting/)).toBeInTheDocument();
  });

  it('submits a new job posting and calls onSuccess', async () => {
    const user = userEvent.setup();
    render(<JobPostingForm onSuccess={mockOnSuccess} />);

    const textarea = screen.getByPlaceholderText(/Title: Software Engineer/);
    await user.clear(textarea);
    await user.type(textarea, 'Test job content');

    await user.click(screen.getByText(/Create Job Posting/));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-job-id',
          booleanSearch: 'boolean string',
        })
      );
    });
  });

  it('handles submission errors and calls onError', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create job';
    mockSetDoc.mockRejectedValueOnce(new Error(errorMessage));

    render(<JobPostingForm onError={mockOnError} />);

    const textarea = screen.getByPlaceholderText(/Title: Software Engineer/);
    await user.type(textarea, 'Test job content');
    await user.click(screen.getByText(/Create Job Posting/));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Failed to create job');
    });
  });

  it('loads existing job content when editing', async () => {
    const existingContent = 'Existing job content';
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ content: existingContent })
    });

    render(<JobPostingForm jobId="job-123" />);

    expect(screen.getByText('Loading job details...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue(existingContent)).toBeInTheDocument();
    });
  });

  it('handles missing job when editing', async () => {
    mockGetDoc.mockResolvedValueOnce({ exists: () => false, data: () => null });

    render(<JobPostingForm jobId="missing-job" onError={mockOnError} />);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Job not found');
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<JobPostingForm onCancel={mockOnCancel} />);

    await user.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
