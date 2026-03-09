
import { render } from '@testing-library/react';
import { SearchFormContent } from '../SearchFormContent';

// Mock the required props
const mockProps = {
  searchText: '',
  isProcessing: false,
  isScrapingProfiles: false,
  searchString: '',
  onSearchTextChange: jest.fn(),
  onFileUpload: jest.fn(),
  onSubmit: jest.fn(),
  hideSearchTypeToggle: false,
  submitButtonText: 'Submit',
  onTextUpdate: jest.fn()
};

describe('SearchFormContent', () => {
  it('renders form content', () => {
    const { container } = render(<SearchFormContent {...mockProps} />);

    expect(container.querySelector('form')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { container } = render(<SearchFormContent {...mockProps} />);

    expect(container).toBeTruthy();
  });
});
