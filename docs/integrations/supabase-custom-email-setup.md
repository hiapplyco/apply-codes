# Setting Up Custom Password Reset Emails with Supabase

## Current Issue

The default Supabase password reset email has several problems:
1. Often goes to spam
2. Shows "Reset Password" as plain text instead of a clickable link
3. Cannot be customized with your branding
4. Gmail marks it as dangerous/phishing

## Solution: Disable Default Emails and Use Auth Hooks

### Step 1: Disable Supabase Default Emails

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kxghaajojntkqrmvsngn/auth/templates)
2. Navigate to Authentication → Email Templates
3. Find "Reset Password" template
4. **Disable the template** or set it to not send

### Step 2: Set Up Auth Hooks

Create a database function to capture password reset events:

```sql
-- Create a function to handle password reset requests
CREATE OR REPLACE FUNCTION handle_auth_password_reset()
RETURNS trigger AS $$
DECLARE
  reset_token text;
  user_email text;
BEGIN
  -- Get the reset token and email
  reset_token := NEW.confirmation_token;
  user_email := NEW.email;
  
  -- Call your edge function with the actual reset token
  PERFORM net.http_post(
    url := 'https://kxghaajojntkqrmvsngn.supabase.co/functions/v1/send-password-reset',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := json_build_object(
      'email', user_email,
      'resetUrl', 'https://www.apply.codes/reset-password?token=' || reset_token,
      'companyName', 'Blind Nut'
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for password reset
CREATE TRIGGER on_auth_password_reset
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.confirmation_token IS NOT NULL AND NEW.confirmation_sent_at IS NOT NULL)
  EXECUTE FUNCTION handle_auth_password_reset();
```

### Step 3: Update Edge Function

Update the edge function to handle the actual reset token:

```typescript
interface PasswordResetRequest {
  email: string;
  resetUrl: string; // This will now include the actual token
  companyName?: string;
}
```

### Step 4: Fix Email Template Links

In your SendGrid email template, ensure the reset button uses the full URL with token:

```html
<a href="${resetUrl}" style="...">
  Reset Password
</a>
```

## Alternative: Use Supabase's SMTP Settings

An easier alternative is to configure Supabase to use SendGrid as the SMTP provider:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/kxghaajojntkqrmvsngn/settings/auth)
2. Navigate to Settings → Auth → SMTP Settings
3. Enable "Use Custom SMTP"
4. Enter SendGrid SMTP details:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key
   - Sender email: `hello@hiapply.co`
   - Sender name: `Blind Nut`

This way, Supabase will use SendGrid to send ALL auth emails with proper formatting.

## Why the Current Setup Fails

1. **No Reset Token**: Our custom email doesn't have access to the actual password reset token
2. **Double Emails**: Both Supabase and our custom function send emails
3. **Spam Issues**: Supabase's default email configuration triggers spam filters

## Recommended Approach

Use the SMTP settings approach - it's simpler and ensures all auth emails go through SendGrid with proper formatting and deliverability.