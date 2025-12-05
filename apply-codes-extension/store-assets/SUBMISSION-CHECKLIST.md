# Chrome Web Store Submission Checklist

## Pre-Submission Requirements

### Required Assets
- [x] Extension icon 16x16 (images/icon16.png)
- [x] Extension icon 48x48 (images/icon48.png)
- [x] Extension icon 128x128 (images/icon128.png)
- [ ] Store icon 128x128 (can reuse icon128.png)
- [ ] At least 1 screenshot (1280x800 or 640x400)
- [ ] Small promo tile 440x280 (optional but recommended)

### Documentation
- [x] Privacy policy (store-assets/privacy-policy.md)
- [x] Store listing description (store-assets/store-listing.md)
- [x] Manifest properly configured

### Code Requirements
- [x] Manifest version 3
- [x] All permissions justified
- [x] No remote code execution
- [x] Content Security Policy compliant

## Chrome Web Store Developer Account Setup

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay one-time $5 registration fee
3. Verify your developer account

## Submission Steps

### 1. Prepare the ZIP Package
```bash
cd apply-codes-extension
zip -r apply-codes-extension.zip . -x "store-assets/*" -x "*.DS_Store" -x ".git/*"
```

### 2. Upload to Chrome Web Store

1. Go to Developer Dashboard
2. Click "New Item"
3. Upload the ZIP file
4. Fill in store listing:
   - **Name**: Apply Codes - AI Recruiting Tools
   - **Description**: Copy from store-listing.md
   - **Category**: Productivity
   - **Language**: English

### 3. Upload Screenshots
Capture screenshots showing:
1. Onboarding welcome screen
2. Main view with candidate evaluation
3. Boolean search generator
4. Content generation results

### 4. Privacy Practices
- Select "This extension collects user data"
- Data types collected:
  - Personal communications (job requirements input)
  - Authentication info (Google sign-in)
  - Website content (LinkedIn profiles)
- Add privacy policy URL

### 5. Distribution
- Select "Public" or "Unlisted" as appropriate
- Choose regions (default: all regions)

### 6. Review Notes for Google
Add a note explaining:
- The extension helps recruiters evaluate LinkedIn candidates
- Uses Firebase for backend AI processing
- Google Sign-In for authentication
- LinkedIn data is NOT stored, only processed in real-time

## Post-Submission

- Review typically takes 1-3 business days
- May receive feedback requiring changes
- After approval, extension goes live automatically

## Important URLs

- Developer Dashboard: https://chrome.google.com/webstore/devconsole
- Developer Terms: https://developer.chrome.com/docs/webstore/program-policies/
- Manifest V3 Docs: https://developer.chrome.com/docs/extensions/mv3/

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-04 | Initial public release |
| 1.2.0 | 2024-12-04 | Auth fixes, improved error handling |
| 1.3.0 | 2024-12-04 | New sidebar UI, PDL/Hunter.io integration, AI chat assistant, Boolean explain |

## Contact

For issues with submission: support@applycodes.com
