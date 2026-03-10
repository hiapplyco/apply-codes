/**
 * Google API scopes — pure constant (no server-side dependencies).
 *
 * Extracted from google-api-config.ts so client components can import
 * scopes without pulling in the `googleapis` Node.js package.
 */

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
