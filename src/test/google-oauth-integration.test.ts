import { GoogleTokenManager } from '@/lib/google-token-manager';
import { GOOGLE_API_SCOPES } from '@/lib/google-api-config';

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockGetDocs = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  serverTimestamp: () => 'timestamp'
}));

jest.mock('@/lib/function-bridge', () => ({
  functionBridge: {
    refreshGoogleToken: jest.fn(),
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock('@/lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-id', email: 'test@example.com' } },
  db: {}
}));

// Import the mocked module to get access to the mock functions
const { functionBridge } = require('@/lib/function-bridge');

describe('GoogleTokenManager', () => {
  let tokenManager: GoogleTokenManager;
  const mockAccount = {
    id: 'account-1',
    email: 'user@gmail.com',
    name: 'Test User',
    accessToken: 'valid-token',
    refreshToken: 'refresh-token',
    scopes: [GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS],
    tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    tokenManager = GoogleTokenManager.getInstance();
    jest.clearAllMocks();

    mockCollection.mockReturnValue('collection-path');
    mockOrderBy.mockReturnValue('order-by');
    mockQuery.mockReturnValue('query-ref');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: mockAccount.id,
          data: () => ({
            email: mockAccount.email,
            name: mockAccount.name,
            accessToken: mockAccount.accessToken,
            refreshToken: mockAccount.refreshToken,
            scopes: mockAccount.scopes,
            tokenExpiry: mockAccount.tokenExpiry,
            createdAt: mockAccount.createdAt,
            lastUsed: mockAccount.createdAt,
          })
        }
      ]
    });
    mockDoc.mockImplementation((...segments: any[]) => segments.join('/'));
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({
      email: mockAccount.email,
      name: mockAccount.name,
      accessToken: mockAccount.accessToken,
      refreshToken: mockAccount.refreshToken,
      scopes: mockAccount.scopes,
      tokenExpiry: mockAccount.tokenExpiry,
      createdAt: mockAccount.createdAt,
      lastUsed: mockAccount.createdAt,
    }) });
    mockUpdateDoc.mockResolvedValue(undefined);
    // Use the actual mock from the mocked module
    (functionBridge.refreshGoogleToken as any).mockResolvedValue({
      access_token: 'refreshed-token',
      expires_at: new Date(Date.now() + 3600000).toISOString()
    });
  });

  afterEach(() => {
    tokenManager.cleanup();
  });

  it('returns existing access token when valid', async () => {
    const token = await tokenManager.getValidAccessToken();
    expect(token).toBe('valid-token');
    expect(functionBridge.refreshGoogleToken).not.toHaveBeenCalled();
  });

  it('refreshes token when expiring soon', async () => {
    const expiringAccount = {
      ...mockAccount,
      accessToken: 'old-token',
      tokenExpiry: new Date(Date.now() + 60000).toISOString(),
    };

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: expiringAccount.id,
          data: () => ({
            email: expiringAccount.email,
            name: expiringAccount.name,
            accessToken: expiringAccount.accessToken,
            refreshToken: expiringAccount.refreshToken,
            scopes: expiringAccount.scopes,
            tokenExpiry: expiringAccount.tokenExpiry,
            createdAt: expiringAccount.createdAt,
            lastUsed: expiringAccount.createdAt,
          })
        }
      ]
    });

    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({
      email: expiringAccount.email,
      name: expiringAccount.name,
      accessToken: expiringAccount.accessToken,
      refreshToken: expiringAccount.refreshToken,
      scopes: expiringAccount.scopes,
      tokenExpiry: expiringAccount.tokenExpiry,
      createdAt: expiringAccount.createdAt,
      lastUsed: expiringAccount.createdAt,
    }) });

    const token = await tokenManager.getValidAccessToken();
    expect(token).toBe('refreshed-token');
    expect(functionBridge.refreshGoogleToken).toHaveBeenCalledWith({ refreshToken: expiringAccount.refreshToken });
  });

  it('handles missing refresh token gracefully', async () => {
    const accountWithoutRefresh = {
      ...mockAccount,
      refreshToken: undefined,
      // Set token to be expiring soon (within 5 minutes) to trigger refresh attempt
      tokenExpiry: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    };

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: accountWithoutRefresh.id,
          data: () => ({
            email: accountWithoutRefresh.email,
            name: accountWithoutRefresh.name,
            accessToken: accountWithoutRefresh.accessToken,
            refreshToken: accountWithoutRefresh.refreshToken,
            scopes: accountWithoutRefresh.scopes,
            tokenExpiry: accountWithoutRefresh.tokenExpiry,
            createdAt: accountWithoutRefresh.createdAt,
            lastUsed: accountWithoutRefresh.createdAt,
          })
        }
      ]
    });

    mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({
      email: accountWithoutRefresh.email,
      name: accountWithoutRefresh.name,
      accessToken: accountWithoutRefresh.accessToken,
      refreshToken: accountWithoutRefresh.refreshToken,
      scopes: accountWithoutRefresh.scopes,
      tokenExpiry: accountWithoutRefresh.tokenExpiry,
      createdAt: accountWithoutRefresh.createdAt,
      lastUsed: accountWithoutRefresh.createdAt,
    }) });

    const token = await tokenManager.getValidAccessToken();
    expect(token).toBeNull();
  });
});
