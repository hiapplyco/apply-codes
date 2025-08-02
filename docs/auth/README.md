# Authentication System

This document provides a comprehensive overview of the authentication system for the Apply platform, covering email/password, Google OAuth, and phone-based authentication, as well as the password reset workflow.

## Core Components & Hooks

The authentication system is built around a few key components and hooks that work together to manage the user's session and protect routes.

-   **`useAuthSession` (Hook):** This is the heart of the authentication logic, directly interacting with the Supabase client.
-   **`AuthContext` (Context):** This context provider wraps the application, making the authentication state available to all components.
-   **`useAuth` (Hook):** A simple consumer hook that allows components to easily access the authentication state.
-   **`ProtectedRoute` (Component):** This component acts as a gatekeeper for routes that require an authenticated user.

## Authentication Flows

### 1. Email & Password

The user-facing authentication process is handled by the `ClarvidaLogin` page, which serves as the entry point for both user login and signup. It uses a single form for both actions, with a toggle to switch between "Sign In" and "Sign Up" modes.

### 2. Google OAuth (One Tap)

We've implemented Google Sign-In using the modern Google Identity Services approach, which provides a seamless, popup-based authentication experience.

#### Setup Instructions:
1.  **Google Cloud Console:**
    -   Create a project and enable the "Google Identity Toolkit API".
    -   Create an OAuth 2.0 Client ID for a "Web application".
    -   Configure Authorized JavaScript origins and redirect URIs.
2.  **Supabase Dashboard:**
    -   Enable the Google provider in the Authentication settings.
    -   Add your Google Client ID.
3.  **Environment Variables:**
    -   Add `VITE_GOOGLE_CLIENT_ID` to your `.env.local` file.

### 3. Phone Authentication (Twilio)

We've implemented a secure phone authentication system using Supabase Auth with Twilio Verify for SMS OTP verification.

#### Setup Instructions:
1.  **Twilio Configuration:**
    -   Create a Twilio account and a new Verify Service.
    -   Obtain your Account SID, Auth Token, and Verify Service SID.
2.  **Supabase Dashboard:**
    -   Enable the Phone provider in the Authentication settings.
    -   Configure the Twilio settings with your credentials.

## Password Reset Workflow

The password reset workflow uses Supabase Auth's built-in functionality with the PKCE flow for enhanced security.

### User Flow:
1.  **Requesting a Reset:**
    -   The user navigates to `/reset-password-request` and enters their email.
    -   The system calls `resetPasswordForEmail` to send a secure reset link.
2.  **Resetting the Password:**
    -   The user clicks the link in the email, which redirects them to `/reset-password` with a secure token.
    -   The page validates the session and allows the user to set a new password.

## Security Considerations

-   **PKCE Flow:** Protects against authorization code interception.
-   **Nonce Implementation:** Cryptographic nonce generation for Google OAuth to prevent replay attacks.
-   **Token Security:** Reset tokens are single-use and expire after a set time.
-   **Rate Limiting:** Supabase implements rate limiting by default to prevent abuse.
