# Beautiful Email Templates for Supabase Auth

Copy and paste these templates into your Supabase Email Templates settings.

## Base HTML Template Structure

All templates use this consistent design with your brand colors (purple gradient).

### Important Notes:
- Logo URL: `https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png`
- Keep all `{{ .Variable }}` placeholders exactly as shown - these are Supabase template variables
- Set template type to **HTML** not plain text

### Available Supabase Tokens:
- `{{ .ConfirmationURL }}` - The confirmation/action link
- `{{ .Token }}` - Raw token value
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - Recipient's email
- `{{ .Data }}` - Additional data
- `{{ .RedirectTo }}` - Redirect URL after action

---

## Anti-Spam Optimization Tips

To prevent emails from going to spam:

1. **SPF, DKIM, DMARC Records** - Ensure these are properly configured in your DNS
2. **Avoid Spam Trigger Words** - We've avoided words like "free", "click here", "urgent"
3. **Balanced Text-to-Image Ratio** - Our templates have plenty of text content
4. **Include Physical Address** - Add your business address in the footer
5. **Personalization** - Use `{{ .Email }}` token to personalize emails
6. **Plain Text Version** - Include a text version alongside HTML
7. **Proper HTML Structure** - Clean, valid HTML with inline CSS
8. **Unsubscribe Link** - Although not needed for transactional emails, it helps reputation

## 1. Reset Password Template (Anti-Spam Optimized)

**Subject:** Password Reset Request for {{ .Email }}

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Password Reset</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 16px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>Note:</strong> If you're having trouble finding this email, please check your spam folder.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
              </p>
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 10px 0 0 0;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Best regards,<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Plain Text Version (Add this alongside HTML for better deliverability)

```
Password Reset Request

Hi {{ .Email }},

We received a request to reset your password for your Blind Nut account.

To reset your password, visit this link:
{{ .ConfirmationURL }}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

Having trouble? Make sure to check your spam folder as automated emails sometimes end up there.

Best regards,
The Blind Nut Team

--
Blind Nut | 1234 Market Street, San Francisco, CA 94103
To manage your email preferences, visit: {{ .SiteURL }}/unsubscribe?email={{ .Email }}
```

---

## 2. Confirm Signup Template

**Subject:** Welcome to Blind Nut - Please Confirm Your Email

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Welcome to Blind Nut! 🎉</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Thanks for signing up! We're excited to have you on board. Please confirm your email address to get started with AI-powered recruitment search.
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Confirm Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #f0f4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">What's next?</h3>
                <ul style="color: #666666; font-size: 14px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li>Generate powerful boolean search strings with AI</li>
                  <li>Search across LinkedIn, Indeed, and more</li>
                  <li>Enrich candidate profiles with contact information</li>
                  <li>Save and organize your top candidates</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                If you didn't sign up for Blind Nut, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Happy recruiting!<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link Template

**Subject:** Your Magic Link for Blind Nut

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link Login</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Magic Link 🪄</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                Click the button below to instantly log in to your Blind Nut account - no password needed!
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Log In to Blind Nut
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #fff4e6; border-left: 4px solid #ff9800; padding: 16px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>Security Note:</strong> This link expires in 1 hour and can only be used once.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                If you didn't request this login link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Secure, passwordless login<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address Template

**Subject:** Confirm Your New Email Address - Blind Nut

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Email Change Request</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                We received a request to change your email address. Please confirm this change by clicking the button below:
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Confirm Email Change
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #fee; border-left: 4px solid #f44336; padding: 16px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>Important:</strong> If you didn't request this change, please secure your account immediately by changing your password.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                This link will expire in 1 hour for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Stay secure,<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Invite User Template

**Subject:** You're Invited to Join Blind Nut

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">You're Invited! 🎊</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                You've been invited to join Blind Nut - the AI-powered recruitment search platform that helps you find the best candidates faster than ever before.
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #f0f4ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">Why join Blind Nut?</h3>
                <ul style="color: #666666; font-size: 14px; line-height: 22px; margin: 0; padding-left: 20px;">
                  <li>AI-powered boolean search generation</li>
                  <li>Multi-platform candidate search</li>
                  <li>Automated contact enrichment</li>
                  <li>Smart candidate organization</li>
                  <li>Time-saving recruitment workflows</li>
                </ul>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                This invitation link expires in 7 days.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Welcome aboard!<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication Template

**Subject:** Security Check - Please Reauthenticate

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reauthentication Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <img src="https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png" alt="Blind Nut" style="height: 50px; margin-bottom: 20px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Security Check 🔐</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                Hi {{ .Email }},
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                For your security, we need you to confirm your identity. This is required when accessing sensitive account features.
              </p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Confirm It's Me
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 30px 0 0 0;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="color: #667eea; font-size: 14px; line-height: 20px; margin: 5px 0 30px 0; word-break: break-all;">
                <a href="{{ .ConfirmationURL }}" style="color: #667eea; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <div style="background-color: #fff4e6; border-left: 4px solid #ff9800; padding: 16px; margin: 20px 0;">
                <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                  <strong>Why am I seeing this?</strong> You're trying to access a sensitive feature that requires additional verification for your protection.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 0;">
                If you didn't attempt to access your account, please secure it immediately by changing your password.
              </p>
              
              <p style="color: #999999; font-size: 13px; line-height: 18px; margin: 10px 0 0 0;">
                This link expires in 10 minutes for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
                Keeping your account secure,<br>
                <strong>The Blind Nut Team</strong>
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2025 Blind Nut. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">
                Blind Nut | 1234 Market Street, San Francisco, CA 94103<br>
                <a href="{{ .SiteURL }}/unsubscribe?email={{ .Email }}" style="color: #999999; text-decoration: underline;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Implementation Steps

1. **Logo is Ready**
   - Logo URL is already included in all templates
   - Using: `https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos//APPLYFullwordlogo2025.png`

2. **Apply Templates in Supabase (With Anti-Spam Settings)**
   - Go to [Authentication → Email Templates](https://supabase.com/dashboard/project/kxghaajojntkqrmvsngn/auth/templates)
   - For each template type:
     - Select the template (e.g., "Reset Password")
     - Set "Template Type" to **HTML**
     - Copy and paste the corresponding template
     - Update the subject line to include `{{ .Email }}` for personalization
     - Enable "Include plain text version" if available
     - Save changes

3. **Update Your Business Address**
   - Replace `1234 Market Street, San Francisco, CA 94103` with your actual business address
   - This is required by CAN-SPAM Act and improves deliverability

3. **Test Each Template**
   - Send test emails to verify formatting
   - Check both desktop and mobile rendering
   - Verify all links work correctly

## Email Best Practices

1. **Spam Prevention**
   - HTML emails with proper structure reduce spam scores
   - Authenticated domain (SendGrid) improves deliverability
   - Clear unsubscribe/ignore instructions help reputation

2. **Mobile Optimization**
   - All templates are responsive
   - Buttons are large and touch-friendly
   - Text is readable on small screens

3. **Branding Consistency**
   - Purple gradient matches your app design
   - Consistent footer and header across all emails
   - Professional yet friendly tone

4. **Security Messages**
   - Clear expiration times for links
   - Instructions for users who didn't request the action
   - Security tips where appropriate