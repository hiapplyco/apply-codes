# Send Email Function Migration

## Overview

The `send-email` Edge Function has been successfully migrated from Supabase to Firebase Cloud Functions. This provides a comprehensive email sending service with support for:

- Basic text and HTML emails
- Email templates (SendGrid Dynamic Templates)
- Bulk email sending with rate limiting
- File attachments
- Email tracking (open/click tracking)
- Comprehensive logging and error handling

## Migration Changes

### From Supabase Edge Function (Deno) to Firebase Cloud Function (Node.js)

1. **Runtime Change**: Deno → Node.js
2. **Environment Variables**: `Deno.env.get()` → `process.env` or `functions.config()`
3. **HTTP Framework**: `serve()` → `functions.https.onCall()`
4. **HTTP Client**: `fetch()` → `axios` (for external APIs)
5. **Authentication**: Supabase Auth → Firebase Auth context
6. **Database**: Supabase PostgreSQL → Firestore (for logging)

## Functions Exported

### 1. `sendEmail` (Primary Function)

**Purpose**: Send individual emails with comprehensive options

**Usage**:
```javascript
const result = await firebase.functions().httpsCallable('sendEmail')({
  to: 'recipient@example.com',
  subject: 'Your Subject Here',
  body: 'Plain text content',
  htmlBody: '<p>HTML content</p>', // Optional
  recipientName: 'John Doe', // Optional
  from: 'custom@example.com', // Optional (defaults to hello@hiapply.co)
  fromName: 'Custom Sender', // Optional (defaults to Apply Team)
  attachments: [ // Optional
    {
      content: 'base64EncodedContent',
      filename: 'document.pdf',
      type: 'application/pdf'
    }
  ],
  trackingOptions: { // Optional
    clickTracking: true,
    openTracking: true,
    subscriptionTracking: false
  }
});
```

### 2. `sendBulkEmails`

**Purpose**: Send multiple emails efficiently with batch processing

**Usage**:
```javascript
const result = await firebase.functions().httpsCallable('sendBulkEmails')({
  emails: [
    {
      to: 'user1@example.com',
      subject: 'Subject 1',
      body: 'Body 1',
      recipientName: 'User 1'
    },
    {
      to: 'user2@example.com',
      subject: 'Subject 2',
      body: 'Body 2',
      recipientName: 'User 2'
    }
  ],
  batchSize: 10 // Optional, defaults to 10
});
```

### 3. `sendTemplatedEmail`

**Purpose**: Send emails using SendGrid Dynamic Templates

**Usage**:
```javascript
const result = await firebase.functions().httpsCallable('sendTemplatedEmail')({
  to: 'recipient@example.com',
  templateId: 'd-1234567890abcdef', // SendGrid template ID
  templateData: {
    candidateName: 'John Doe',
    companyName: 'Your Company',
    customMessage: 'Welcome!'
  },
  recipientName: 'John Doe',
  trackingOptions: {
    clickTracking: true,
    openTracking: true
  }
});
```

## Configuration Required

### Firebase Configuration

Set the SendGrid API key using Firebase CLI:
```bash
firebase functions:config:set sendgrid.api_key="your_sendgrid_api_key_here"
```

Or use environment variables (for local development):
```bash
export SENDGRID_API_KEY="your_sendgrid_api_key_here"
```

### SendGrid Setup

1. Create a SendGrid account
2. Generate an API key with mail sending permissions
3. Verify your sender domain/email in SendGrid
4. Set up Dynamic Templates if using templated emails

## Error Handling

The functions use Firebase-specific error handling:

- `invalid-argument`: Missing required parameters
- `failed-precondition`: Missing configuration (API keys)
- `not-found`: Resource not found
- `internal`: SendGrid or processing errors
- `unauthenticated`: Authentication issues
- `permission-denied`: Authorization issues

## Logging

All email activities are logged to Firestore collections:

- `email_logs`: Individual email sending logs
- `bulk_email_logs`: Bulk email operation logs
- `outreach_logs`: Specific outreach email logs (from send-outreach-email)

Log entries include:
- Recipient email
- Subject
- Status (sent/failed)
- Template ID (if used)
- Tracking options
- User ID (if authenticated)
- Timestamps
- Error messages (if failed)

## Rate Limiting

- Bulk emails are processed in configurable batches (default: 10)
- 1-second delay between batches to respect SendGrid rate limits
- Individual email functions have no built-in rate limiting

## Security Features

- Firebase Authentication context validation
- SendGrid API key stored in Firebase config (not in code)
- Input validation for all parameters
- Comprehensive error logging without exposing sensitive data

## Testing

A test script is provided at `test-send-email.js` that includes:
- Validation error testing
- Mock function structure validation
- Example usage patterns

To run basic validation tests:
```bash
node test-send-email.js
```

For full testing with actual email sending, deploy to Firebase and test via the console.

## Migration Status

✅ **Completed**:
- Function structure migrated from Deno to Node.js
- SendGrid integration maintained
- Error handling enhanced for Firebase
- Logging migrated to Firestore
- Bulk sending capability added
- Template support enhanced
- Attachment support maintained
- Tracking options expanded

📋 **Next Steps**:
1. Update frontend calls to use new Firebase function endpoints
2. Set up SendGrid API key in Firebase config
3. Test all email scenarios in staging environment
4. Update any existing email templates for new template function

## Frontend Integration Example

Replace Supabase Edge Function calls:

**Before (Supabase)**:
```javascript
const { data, error } = await supabase.functions.invoke('send-email', {
  body: { to, subject, body }
});
```

**After (Firebase)**:
```javascript
const sendEmail = firebase.functions().httpsCallable('sendEmail');
const result = await sendEmail({ to, subject, body });
```

## Dependencies

The following npm packages are required and already included in package.json:
- `@sendgrid/mail`: SendGrid email service
- `firebase-functions`: Firebase Cloud Functions runtime
- `firebase-admin`: Firebase Admin SDK for Firestore logging

All dependencies are properly configured and ready for deployment.