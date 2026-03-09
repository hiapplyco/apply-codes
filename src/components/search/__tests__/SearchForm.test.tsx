
import { render } from '@testing-library/react';
import { SearchForm } from '../SearchForm';

// Mock the hooks
jest.mock('../hooks/useSearchForm', () => ({
  useSearchForm: () => ({
    searchText: '',
    setSearchText: jest.fn(),
    companyName: '',
    setCompanyName: jest.fn(),
    isProcessing: false,
    searchType: 'general',
    setSearchType: jest.fn(),
    searchString: '',
    setSearchString: jest.fn(),
    handleSubmit: jest.fn(),
    handleFileUpload: jest.fn()
  })
}));

const mockProps = {
  userId: 'test-user-id',
  onJobCreated: jest.fn(),
  currentJobId: 1,
  isProcessingComplete: false,
  source: 'default' as const,
  hideSearchTypeToggle: false,
  submitButtonText: 'Submit',
  onSubmitStart: jest.fn(),
  onShowGoogleSearch: jest.fn()
};

describe('SearchForm', () => {
  it('renders search form elements', () => {
    const { container } = render(<SearchForm {...mockProps} />);

    expect(container.querySelector('form')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { container } = render(<SearchForm {...mockProps} />);

    expect(container).toBeTruthy();
  });
});
