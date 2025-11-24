# Firebase CI/CD Setup Guide

## Overview
This guide explains how to set up the GitHub Actions CI/CD pipeline for automatic Firebase deployments.

## Prerequisites
- Firebase project configured (applycodes-2683f)
- GitHub repository with Actions enabled
- Firebase CLI installed locally

## Setup Steps

### 1. Generate Firebase Token
```bash
firebase login:ci
```
Save the generated token - you'll need it for GitHub Secrets.

### 2. Configure GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Firebase Core
- `FIREBASE_TOKEN` - Token from step 1

#### API Keys
- `GEMINI_API_KEY` - Google Gemini API key
- `NYMERIA_API_KEY` - Nymeria enrichment API key
- `SENDGRID_API_KEY` - SendGrid email API key
- `VITE_OPENAI_API_KEY` - OpenAI API key for Whisper
- `STRIPE_SECRET_KEY` - Stripe secret key (production)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret

#### Supabase (for hybrid approach)
- `VITE_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

#### Firebase Config (for hosting)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Other Frontend Config
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID

## Pipeline Features

### Automatic Triggers
- **Push to main**: Deploys functions and hosting
- **Pull requests**: Runs tests only

### Jobs
1. **Test**: Runs function tests (currently placeholder)
2. **Deploy Functions**: Deploys Cloud Functions to Firebase
3. **Deploy Hosting**: Builds and deploys frontend to Firebase Hosting

### File Monitoring
The pipeline only triggers when these files change:
- `functions/**` - Any function code
- `firebase.json` - Firebase configuration
- `firestore.rules` - Database rules
- `.github/workflows/firebase-deploy.yml` - Pipeline itself

## Local Testing

### Test the pipeline locally
```bash
# Install act (GitHub Actions local runner)
brew install act # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash # Linux

# Run the workflow
act -j test # Run test job
act -j deploy # Run deploy job (requires secrets)
```

### Test functions locally
```bash
cd functions
npm test
npm run serve # Start emulators
```

## Monitoring

### View deployment logs
```bash
firebase functions:log
```

### GitHub Actions dashboard
- Go to repository → Actions tab
- View workflow runs and logs

## Troubleshooting

### Common Issues

1. **Missing secrets error**
   - Ensure all required secrets are set in GitHub
   - Check secret names match exactly

2. **Deployment fails**
   - Check Firebase project exists and is accessible
   - Verify Firebase token is valid: `firebase login:ci`

3. **Build fails**
   - Check Node version matches (20)
   - Verify all dependencies are in package.json

4. **Functions timeout**
   - Check API keys are valid
   - Verify external services are accessible

## Security Notes

- Never commit API keys to the repository
- Rotate Firebase token periodically
- Use least-privilege service accounts
- Enable audit logging in Firebase Console

## Next Steps

1. Add comprehensive tests for functions
2. Add staging environment deployment
3. Implement rollback strategy
4. Add performance monitoring
5. Set up alerts for deployment failures

## Resources
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Firebase CI/CD Guide](https://firebase.google.com/docs/hosting/github-integration)
- [Firebase Functions Testing](https://firebase.google.com/docs/functions/unit-testing)