/**
 * Google API Configuration and Client Management
 *
 * NOTE: This module imports `googleapis` (Node.js only).
 * For client-side code that only needs scopes, import from '@/lib/google-scopes' instead.
 */

// Re-export scopes for backward compatibility
export { GOOGLE_API_SCOPES } from './google-scopes';
import { GOOGLE_API_SCOPES } from './google-scopes';

// Lazy-import googleapis to avoid bundling in client code when tree-shaking fails.
// These functions should only be called server-side or in test code.
let _google: typeof import('googleapis').google | null = null;
let _GoogleAuth: typeof import('google-auth-library').GoogleAuth | null = null;

async function getGoogle() {
  if (!_google) {
    const mod = await import('googleapis');
    _google = mod.google;
  }
  return _google;
}

async function getGoogleAuth() {
  if (!_GoogleAuth) {
    const mod = await import('google-auth-library');
    _GoogleAuth = mod.GoogleAuth;
  }
  return _GoogleAuth;
}

// Environment variables validation
const requiredEnvVars = [
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY',
  'GOOGLE_CLOUD_CLIENT_EMAIL',
  'GOOGLE_CLOUD_CLIENT_ID',
  'GOOGLE_CLOUD_CLIENT_X509_CERT_URL',
] as const;

// Validate environment variables
function validateEnvironmentVariables(): boolean {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

// Google OAuth2 client configuration
export const getGoogleOAuth2Config = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Google OAuth2 client ID is required');
  }

  return {
    clientId,
    redirectUri: window.location.origin,
    scope: [
      GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
      GOOGLE_API_SCOPES.DOCS.FULL_ACCESS,
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };
};

// Service account configuration
export const getServiceAccountConfig = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const privateKeyId = process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID;
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const clientId = process.env.GOOGLE_CLOUD_CLIENT_ID;
  const clientX509CertUrl = process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL;

  if (!projectId || !privateKeyId || !privateKey || !clientEmail || !clientId || !clientX509CertUrl) {
    throw new Error('Google Cloud service account configuration is incomplete');
  }

  return {
    type: 'service_account',
    project_id: projectId,
    private_key_id: privateKeyId,
    private_key: privateKey.replace(/\\n/g, '\n'),
    client_email: clientEmail,
    client_id: clientId,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: clientX509CertUrl,
  };
};

// Create Google Auth client (server-side only)
export const createGoogleAuthClient = async (scopes: string[] = []) => {
  if (!validateEnvironmentVariables()) {
    throw new Error('Google API environment variables are not properly configured');
  }

  const GoogleAuthClass = await getGoogleAuth();
  const serviceAccountConfig = getServiceAccountConfig();

  return new GoogleAuthClass({
    credentials: serviceAccountConfig,
    scopes,
  });
};

// Create Google Drive client (server-side only)
export const createGoogleDriveClient = async (accessToken?: string) => {
  const google = await getGoogle();

  if (accessToken) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: 'v3', auth });
  } else {
    const { GOOGLE_API_SCOPES } = await import('./google-scopes');
    const auth = await createGoogleAuthClient([GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS]);
    return google.drive({ version: 'v3', auth });
  }
};

// Create Google Docs client (server-side only)
export const createGoogleDocsClient = async (accessToken?: string) => {
  const google = await getGoogle();

  if (accessToken) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.docs({ version: 'v1', auth });
  } else {
    const { GOOGLE_API_SCOPES } = await import('./google-scopes');
    const auth = await createGoogleAuthClient([GOOGLE_API_SCOPES.DOCS.FULL_ACCESS]);
    return google.docs({ version: 'v1', auth });
  }
};

// Create Google Sheets client (server-side only)
export const createGoogleSheetsClient = async (accessToken?: string) => {
  const google = await getGoogle();

  if (accessToken) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.sheets({ version: 'v4', auth });
  } else {
    const { GOOGLE_API_SCOPES } = await import('./google-scopes');
    const auth = await createGoogleAuthClient([GOOGLE_API_SCOPES.SHEETS.FULL_ACCESS]);
    return google.sheets({ version: 'v4', auth });
  }
};

// Create Gmail client (server-side only)
export const createGmailClient = async (accessToken?: string) => {
  const google = await getGoogle();

  if (accessToken) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return google.gmail({ version: 'v1', auth });
  } else {
    const { GOOGLE_API_SCOPES } = await import('./google-scopes');
    const auth = await createGoogleAuthClient([GOOGLE_API_SCOPES.GMAIL.FULL_ACCESS]);
    return google.gmail({ version: 'v1', auth });
  }
};

// Google OAuth2 helper for client-side authentication
export const initiateGoogleOAuth = () => {
  const config = getGoogleOAuth2Config();
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  window.location.href = authUrl.toString();
};

// Extract Google file ID from URL
export const extractGoogleFileId = (url: string): string | null => {
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Check if environment is properly configured
export const isGoogleApiConfigured = (): boolean => {
  return validateEnvironmentVariables();
};

// Configuration status
export const getGoogleApiStatus = () => {
  const isConfigured = isGoogleApiConfigured();
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  return {
    isConfigured,
    missingVariables: missingVars,
    availableScopes: Object.values(GOOGLE_API_SCOPES).flat(),
  };
};