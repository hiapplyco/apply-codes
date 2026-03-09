import { render, screen, waitFor, userEvent } from '@/test/utils';
import { JobPostingForm } from './JobPostingForm';

jest.mock('@/lib/function-bridge', () => ({
  functionBridge: {
    generateBooleanSearch: jest.fn(),
    enhanceJobDescription: jest.fn(),
    extractNlpTerms: jest.fn(),
    analyzeCompensation: jest.fn(),
    summarizeJob: jest.fn(),
    summarizeTitle: jest.fn(),
  },
}));

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
}));

jest.mock('@/context/NewAuthContext', () => ({
  useNewAuth: jest.fn(() => ({
    user: { uid: 'user-123', email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

// Mock next/navigation instead of react-router-dom
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/jobs'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
  useToast: jest.fn(() => ({ toast: jest.fn() })),
}));

// Import mocked module to access mocks
const { functionBridge } = require('@/lib/function-bridge');

describe('JobPostingForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

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
