# Google Cloud Platform Setup Guide

This guide provides step-by-step instructions for setting up Google Cloud Platform (GCP) services to enable Google Drive and Google Docs API integration in the Apply platform.

## Prerequisites

- Google account with administrative privileges
- Access to [Google Cloud Console](https://console.cloud.google.com/)
- Basic understanding of API authentication and OAuth 2.0

## 1. Create a Google Cloud Project

### Step 1: Access Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Accept the Terms of Service if prompted

### Step 2: Create New Project
1. Click the project selector dropdown in the top navigation bar
2. Click "New Project"
3. Enter project details:
   - **Project name**: `apply-codes-prod` (or your preferred name)
   - **Organization**: Select your organization (if applicable)
   - **Location**: Choose appropriate organization or "No organization"
4. Click "Create"
5. Wait for project creation to complete
6. **Important**: Note down your **Project ID** (displayed in the project info panel)

## 2. Enable Required APIs

### Step 1: Navigate to APIs & Services
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Or use the search bar to find "APIs & Services"

### Step 2: Enable Google Drive API
1. Search for "Google Drive API"
2. Click on "Google Drive API" from the results
3. Click "Enable"
4. Wait for the API to be enabled (this may take a few minutes)

### Step 3: Enable Google Docs API
1. Search for "Google Docs API"
2. Click on "Google Docs API" from the results
3. Click "Enable"
4. Wait for the API to be enabled

### Step 4: Enable Google Sheets API (Optional)
1. Search for "Google Sheets API"
2. Click on "Google Sheets API" from the results
3. Click "Enable"

### Step 5: Enable Gmail API (Optional)
1. Search for "Gmail API"
2. Click on "Gmail API" from the results
3. Click "Enable"

## 3. Create Service Account

### Step 1: Navigate to Service Accounts
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"

### Step 2: Service Account Details
1. **Service account name**: `apply-codes-service-account`
2. **Service account ID**: `apply-codes-service` (auto-generated)
3. **Description**: `Service account for Apply platform Google APIs integration`
4. Click "Create and Continue"

### Step 3: Grant Permissions (Optional)
1. For basic usage, you can skip this step
2. Click "Continue" then "Done"

### Step 4: Generate Service Account Key
1. In the Service Accounts list, click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Select "JSON" format
5. Click "Create"
6. **Important**: Download and securely store the JSON key file
7. **Security Warning**: Never commit this file to version control

## 4. Configure OAuth 2.0 for Web Applications

### Step 1: Create OAuth 2.0 Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, configure the OAuth consent screen first (see next section)

### Step 2: OAuth Client Configuration
1. **Application type**: Web application
2. **Name**: `Apply Codes Web Client`
3. **Authorized JavaScript origins**:
   - `https://www.apply.codes`
   - `https://apply.codes`
   - `http://localhost:5173` (for development)
4. **Authorized redirect URIs**:
   - `https://www.apply.codes/auth/callback`
   - `https://apply.codes/auth/callback`
   - `http://localhost:5173/auth/callback` (for development)
5. Click "Create"
6. **Important**: Note down the **Client ID** and **Client Secret**

## 5. Configure OAuth Consent Screen

### Step 1: Select User Type
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for public applications) or "Internal" (for G Suite organizations)
3. Click "Create"

### Step 2: App Information
1. **App name**: `Apply Codes`
2. **User support email**: Your support email address
3. **App logo**: Upload your application logo (optional)
4. **App domain**: `apply.codes`
5. **Authorized domains**: 
   - `apply.codes`
   - `www.apply.codes`
6. **Developer contact information**: Your email address
7. Click "Save and Continue"

### Step 3: Scopes
1. Click "Add or Remove Scopes"
2. Add the following scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/spreadsheets` (if using Sheets)
3. Click "Update"
4. Click "Save and Continue"

### Step 4: Test Users (for External apps)
1. Add test user email addresses during development
2. Click "Add Users" and enter email addresses
3. Click "Save and Continue"

### Step 5: Summary
1. Review all settings
2. Click "Back to Dashboard"

## 6. Environment Variables Setup

### Step 1: Extract Service Account Information
From your downloaded JSON key file, extract the following values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project-id.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account%40project-id.iam.gserviceaccount.com"
}
```

### Step 2: Configure Environment Variables
Add these variables to your `.env.local` file:

```env
# Google OAuth 2.0 Client
VITE_GOOGLE_CLIENT_ID=your_oauth_client_id_here

# Google Drive & Docs API
VITE_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key_here
VITE_GOOGLE_DOCS_API_KEY=your_google_docs_api_key_here

# Google Service Account (from JSON key file)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_CLOUD_CLIENT_ID=your-service-account-client-id
GOOGLE_CLOUD_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/service-account%40project-id.iam.gserviceaccount.com
```

**Important Notes:**
- Replace all placeholder values with actual values from your Google Cloud setup
- For the `GOOGLE_CLOUD_PRIVATE_KEY`, ensure line breaks are preserved using `\n`
- Never commit the `.env.local` file to version control

## 7. API Key Configuration (Optional)

### Step 1: Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key"

### Step 2: Restrict API Key
1. **API restrictions**: Select "Restrict key"
2. Choose the APIs you want to restrict to:
   - Google Drive API
   - Google Docs API
   - Google Sheets API (if applicable)
3. **Application restrictions**: Choose "HTTP referrers"
4. Add your domain restrictions:
   - `https://apply.codes/*`
   - `https://www.apply.codes/*`
   - `http://localhost:5173/*` (for development)
5. Click "Save"

## 8. Testing the Setup

### Step 1: Install Dependencies
```bash
npm install googleapis @google-cloud/docs google-auth-library
```

### Step 2: Test Authentication
Create a simple test script to verify your setup:

```typescript
import { createGoogleDriveClient, isGoogleApiConfigured } from '@/lib/google-api-config';

async function testGoogleApiSetup() {
  console.log('Testing Google API setup...');
  
  // Check if configuration is valid
  const isConfigured = isGoogleApiConfigured();
  console.log('Is configured:', isConfigured);
  
  if (!isConfigured) {
    console.error('Google API is not properly configured');
    return;
  }
  
  try {
    // Test Drive API access
    const driveClient = await createGoogleDriveClient();
    const response = await driveClient.files.list({
      pageSize: 1,
      fields: 'files(id, name)',
    });
    
    console.log('Drive API test successful:', response.data);
  } catch (error) {
    console.error('Drive API test failed:', error);
  }
}

testGoogleApiSetup();
```

### Step 3: Verify Environment Variables
Run this in your application console:

```typescript
import { getGoogleApiStatus } from '@/lib/google-api-config';

const status = getGoogleApiStatus();
console.log('Google API Status:', status);
```

## 9. Security Best Practices

### Service Account Security
1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Key Rotation**: Regularly rotate service account keys
3. **Secure Storage**: Store keys securely, never in version control
4. **Monitoring**: Monitor API usage and set up alerts

### OAuth 2.0 Security
1. **HTTPS Only**: Always use HTTPS for redirect URIs
2. **Domain Restrictions**: Restrict authorized domains
3. **Regular Audits**: Regularly review OAuth consent screen and permissions

### API Key Security
1. **API Restrictions**: Always restrict API keys to specific APIs
2. **Referrer Restrictions**: Limit usage to specific domains
3. **Rate Limiting**: Implement client-side rate limiting

## 10. Troubleshooting

### Common Issues

#### "Invalid Credentials" Error
- Verify service account JSON key is correctly formatted
- Check that private key includes proper line breaks
- Ensure project ID matches the one in the service account

#### "Access Denied" Error
- Verify APIs are enabled in the project
- Check OAuth consent screen configuration
- Ensure proper scopes are requested

#### "Quota Exceeded" Error
- Check API usage limits in Google Cloud Console
- Implement proper rate limiting in your application
- Consider requesting quota increases if needed

#### "Invalid Redirect URI" Error
- Verify redirect URIs in OAuth client configuration
- Ensure URIs exactly match (including protocols and trailing slashes)
- Check that the domain is authorized

### Debug Steps
1. **Check Console Logs**: Look for detailed error messages
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test with Google APIs Explorer**: Use the official testing tool
4. **Check API Quotas**: Monitor usage in Google Cloud Console

## 11. Monitoring and Maintenance

### Monitoring
1. **API Usage**: Monitor API quotas and usage patterns
2. **Error Rates**: Track error rates and types
3. **Performance**: Monitor response times and latency

### Maintenance
1. **Key Rotation**: Rotate service account keys quarterly
2. **Permission Audits**: Regularly review and update permissions
3. **Dependency Updates**: Keep Google client libraries updated
4. **Security Reviews**: Perform regular security assessments

## 12. Cost Considerations

### Free Tier Limits
- Google Drive API: 1 billion API calls per day
- Google Docs API: 100 requests per 100 seconds per user
- Google Sheets API: 300 requests per minute per project

### Paid Features
- Beyond free tier limits, standard Google Cloud pricing applies
- Consider implementing caching to reduce API calls
- Monitor usage to avoid unexpected charges

## 13. Support and Resources

### Documentation
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Docs API Documentation](https://developers.google.com/docs/api)
- [Google Cloud Console](https://console.cloud.google.com/)

### Community
- [Google Cloud Community](https://cloud.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-api)
- [Google Developers Discord](https://discord.gg/google-dev-community)

### Support
- [Google Cloud Support](https://cloud.google.com/support)
- [Google Developers Support](https://developers.google.com/support)

---

## Quick Setup Checklist

- [ ] Create Google Cloud Project
- [ ] Enable Google Drive API
- [ ] Enable Google Docs API
- [ ] Create Service Account
- [ ] Generate Service Account Key
- [ ] Create OAuth 2.0 Client ID
- [ ] Configure OAuth Consent Screen
- [ ] Set up Environment Variables
- [ ] Test API Access
- [ ] Implement Security Best Practices
- [ ] Set up Monitoring

**Estimated Setup Time**: 30-45 minutes for first-time setup

**Next Steps**: After completing this setup, you can use the Google API configuration utilities in `/src/lib/google-api-config.ts` to integrate Google services into your application.