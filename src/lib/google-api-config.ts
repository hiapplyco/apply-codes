import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

/**
 * Google API Configuration and Client Management
 * 
 * This module provides centralized configuration and client creation for Google APIs
 * including Drive, Docs, and other Google services.
 */

// Environment variables validation
const requiredEnvVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY_ID',
  'GOOGLE_CLOUD_PRIVATE_KEY',
  'GOOGLE_CLOUD_CLIENT_EMAIL',
  'GOOGLE_CLOUD_CLIENT_ID',
  'GOOGLE_CLOUD_CLIENT_X509_CERT_URL',
] as const;

// Validate environment variables
function validateEnvironmentVariables(): boolean {
  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar] && !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Google API scopes
export const GOOGLE_API_SCOPES = {
  DRIVE: {
    FULL_ACCESS: 'https://www.googleapis.com/auth/drive',
    READ_ONLY: 'https://www.googleapis.com/auth/drive.readonly',
    FILE_ACCESS: 'https://www.googleapis.com/auth/drive.file',
    METADATA: 'https://www.googleapis.com/auth/drive.metadata',
  },
  DOCS: {
    FULL_ACCESS: 'https://www.googleapis.com/auth/documents',
    READ_ONLY: 'https://www.googleapis.com/auth/documents.readonly',
  },
  SHEETS: {
    FULL_ACCESS: 'https://www.googleapis.com/auth/spreadsheets',
    READ_ONLY: 'https://www.googleapis.com/auth/spreadsheets.readonly',
  },
  GMAIL: {
    FULL_ACCESS: 'https://www.googleapis.com/auth/gmail.modify',
    READ_ONLY: 'https://www.googleapis.com/auth/gmail.readonly',
    SEND: 'https://www.googleapis.com/auth/gmail.send',
  },
} as const;

// Google OAuth2 client configuration
export const getGoogleOAuth2Config = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  
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
  const projectId = import.meta.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID;
  const privateKeyId = import.meta.env.GOOGLE_CLOUD_PRIVATE_KEY_ID || process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID;
  const privateKey = import.meta.env.GOOGLE_CLOUD_PRIVATE_KEY || process.env.GOOGLE_CLOUD_PRIVATE_KEY;
  const clientEmail = import.meta.env.GOOGLE_CLOUD_CLIENT_EMAIL || process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const clientId = import.meta.env.GOOGLE_CLOUD_CLIENT_ID || process.env.GOOGLE_CLOUD_CLIENT_ID;
  const clientX509CertUrl = import.meta.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL || process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL;

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

// Create Google Auth client
export const createGoogleAuthClient = (scopes: string[] = []) => {
  if (!validateEnvironmentVariables()) {
    throw new Error('Google API environment variables are not properly configured');
  }

  const serviceAccountConfig = getServiceAccountConfig();
  
  return new GoogleAuth({
    credentials: serviceAccountConfig,
    scopes,
  });
};

// Create Google Drive client
export const createGoogleDriveClient = async (accessToken?: string) => {
  if (accessToken) {
    // Use user's access token for client-side operations
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    return google.drive({ version: 'v3', auth });
  } else {
    // Use service account for server-side operations
    const auth = createGoogleAuthClient([
      GOOGLE_API_SCOPES.DRIVE.FULL_ACCESS,
    ]);
    
    return google.drive({ version: 'v3', auth });
  }
};

// Create Google Docs client
export const createGoogleDocsClient = async (accessToken?: string) => {
  if (accessToken) {
    // Use user's access token for client-side operations
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    return google.docs({ version: 'v1', auth });
  } else {
    // Use service account for server-side operations
    const auth = createGoogleAuthClient([
      GOOGLE_API_SCOPES.DOCS.FULL_ACCESS,
    ]);
    
    return google.docs({ version: 'v1', auth });
  }
};

// Create Google Sheets client
export const createGoogleSheetsClient = async (accessToken?: string) => {
  if (accessToken) {
    // Use user's access token for client-side operations
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    return google.sheets({ version: 'v4', auth });
  } else {
    // Use service account for server-side operations
    const auth = createGoogleAuthClient([
      GOOGLE_API_SCOPES.SHEETS.FULL_ACCESS,
    ]);
    
    return google.sheets({ version: 'v4', auth });
  }
};

// Create Gmail client
export const createGmailClient = async (accessToken?: string) => {
  if (accessToken) {
    // Use user's access token for client-side operations
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    return google.gmail({ version: 'v1', auth });
  } else {
    // Use service account for server-side operations
    const auth = createGoogleAuthClient([
      GOOGLE_API_SCOPES.GMAIL.FULL_ACCESS,
    ]);
    
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
  const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar] && !process.env[envVar]);
  
  return {
    isConfigured,
    missingVariables: missingVars,
    availableScopes: Object.values(GOOGLE_API_SCOPES).flat(),
  };
};