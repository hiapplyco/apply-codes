# Privacy Policy for Apply Codes Chrome Extension

**Last Updated:** December 4, 2024

## Introduction

Apply Codes ("we", "our", or "us") operates the Apply Codes Chrome Extension. This privacy policy explains how we collect, use, and protect your information when you use our extension.

## Information We Collect

### Information You Provide

- **Google Account Information**: When you sign in with Google, we receive your email address, name, and profile picture to authenticate your session.
- **Job Requirements**: Text you enter as job requirements for candidate evaluation.
- **Content Prompts**: Text you provide for generating outreach content.

### Information Collected Automatically

- **LinkedIn Profile Data**: When you use the "Evaluate Candidate" feature, we temporarily extract publicly visible information from the LinkedIn profile page you're viewing (name, headline, experience, education) to perform the analysis. This data is NOT stored on our servers.

### Information We Do NOT Collect

- We do NOT track your browsing history
- We do NOT collect data from pages other than LinkedIn profiles when you explicitly use our features
- We do NOT sell your personal information to third parties
- We do NOT store LinkedIn profile data after analysis is complete

## How We Use Your Information

- **Authentication**: To verify your identity and maintain your session
- **Feature Functionality**: To provide candidate evaluation, boolean search generation, and content generation services
- **Service Improvement**: To monitor and improve our services (aggregated, non-personal data only)

## Data Storage and Security

- Authentication tokens are stored locally in your browser using Chrome's secure storage API
- Profile analysis is performed in real-time and not persisted
- We use Firebase for secure backend processing
- All data transmission uses HTTPS encryption

## Third-Party Services

We use the following third-party services:

- **Google Sign-In**: For authentication ([Google Privacy Policy](https://policies.google.com/privacy))
- **Firebase**: For backend services ([Firebase Privacy Policy](https://firebase.google.com/support/privacy))
- **Google AI (Gemini)**: For AI-powered analysis ([Google AI Privacy](https://ai.google.dev/terms))

## Data Retention

- Session data is retained until you sign out
- We do not retain LinkedIn profile data after analysis
- You can clear all local data by signing out or removing the extension

## Your Rights

You have the right to:
- Access your data by viewing your profile in the extension
- Delete your data by signing out and removing the extension
- Opt out by using the extension in guest mode (limited features)

## Children's Privacy

Our extension is not intended for users under 13 years of age. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify users of any material changes by updating the "Last Updated" date.

## Contact Us

If you have questions about this privacy policy, please contact us at:

**Email**: support@applycodes.com

## Permissions Explained

Our extension requests the following Chrome permissions:

- **activeTab**: To access the current LinkedIn profile page when you use our features
- **scripting**: To extract profile information from LinkedIn pages
- **storage**: To save your preferences and authentication session locally
- **identity**: To enable Google Sign-In

## Host Permissions

- **linkedin.com**: Required to read LinkedIn profile pages for candidate evaluation
- **cloudfunctions.net**: Required to communicate with our secure backend
- **identitytoolkit.googleapis.com**: Required for Google authentication
