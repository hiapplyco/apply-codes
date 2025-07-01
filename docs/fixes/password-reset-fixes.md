# Password Reset Issues & Fixes

This document addresses the password reset issues reported by the tester.

## Issues Identified

1. **Email "From" address shows "blind nut"**
2. **Logo image not loading in email**
3. **Reset link redirects to login page instead of password reset page**
4. **Mobile users can't access password reset**

## Fixes Required

### 1. Fix Email Sender Name

**Issue**: Email shows "blind nut" as sender
**Solution**: Update Supabase Email Configuration

In Supabase Dashboard:
1. Go to **Authentication > Email Templates**
2. Update these fields:
   - **Sender name**: `Apply Support` or `Apply Team`
   - **Sender email**: `noreply@apply.codes` or your verified domain email

### 2. Fix Logo URL in Email Template

**Issue**: Double slash in logo URL causing image load failure
**Current**: `/storage/v1/object/public/logos//APPLYFullwordlogo2025.png`
**Fixed**: `/storage/v1/object/public/logos/APPLYFullwordlogo2025.png`

Update the email template HTML to remove the double slash.

### 3. Fix Site URL Configuration

**CRITICAL**: This is likely the main issue causing redirects to login page.

In Supabase Dashboard:
1. Go to **Authentication > URL Configuration**
2. Set **Site URL** to: `https://www.apply.codes`
3. Ensure **Redirect URLs** includes:
   - `https://www.apply.codes/*`
   - `https://apply.codes/*`
   - `http://localhost:5173/*`

### 4. Fix Email Template Redirect URL

The email template should use the Supabase variable that includes the full URL with token:

```html
<a href="{{ .ConfirmationURL }}">Reset My Password</a>
```

**Important**: The `{{ .ConfirmationURL }}` variable automatically includes:
- Your site URL
- The redirect path
- The authentication token
- Proper URL encoding

### 5. Update Frontend Routing

The current `/reset-password` route needs to handle the Supabase redirect properly.

**Current Issue**: The route might be checking for authentication or not handling the token correctly.

**Solution**: Ensure the password reset page:
1. Is a public route (no authentication required)
2. Properly extracts and validates the token from URL
3. Handles mobile browser redirects

## Complete Fix Checklist

### Supabase Dashboard Settings

1. **Email Configuration** (Authentication > Email Templates)
   - [ ] Sender name: `Apply Team` (not "blind nut")
   - [ ] Sender email: `noreply@apply.codes`
   - [ ] Fix logo URL (remove double slash)

2. **URL Configuration** (Authentication > URL Configuration)
   - [ ] Site URL: `https://www.apply.codes`
   - [ ] Redirect URLs include all domains

3. **Email Template** (Authentication > Email Templates > Reset Password)
   - [ ] Uses `{{ .ConfirmationURL }}` for all links
   - [ ] Logo URL fixed
   - [ ] Proper HTML structure for mobile

### Frontend Code Updates

1. **App.tsx Route Configuration**
   - Ensure `/reset-password` is a public route
   - No authentication checks on this route

2. **PasswordReset Component**
   - Handle token extraction from URL
   - Don't redirect if no session exists
   - Show proper error for invalid/expired tokens

## Mobile-Specific Considerations

1. **Email Client Compatibility**
   - Some mobile email clients strip or modify URLs
   - Provide both button and plain text link
   - Use full URLs, not relative paths

2. **Browser Handling**
   - Mobile browsers may handle redirects differently
   - Ensure responsive design for password reset page
   - Test on Safari (iOS) and Chrome (Android)

## Testing Checklist

1. [ ] Send test password reset email
2. [ ] Verify sender name is correct
3. [ ] Verify logo loads in email
4. [ ] Click reset button - goes to password reset page
5. [ ] Copy/paste link - goes to password reset page
6. [ ] Test on mobile device (not logged in)
7. [ ] Test on desktop (not logged in)
8. [ ] Verify password can be successfully reset

## Immediate Actions

1. **Update Supabase Dashboard**:
   - Fix Site URL to `https://www.apply.codes`
   - Fix sender name and email
   - Add all redirect URLs

2. **Update Email Template**:
   - Fix logo URL double slash
   - Ensure using `{{ .ConfirmationURL }}`

3. **Deploy and Test**:
   - Test complete flow on mobile
   - Verify all links work correctly

## Root Cause

The main issue appears to be the Site URL configuration in Supabase. When not properly set, Supabase may:
- Generate incorrect reset URLs
- Redirect to the wrong domain
- Not include proper authentication tokens

Setting the correct Site URL should resolve most issues.