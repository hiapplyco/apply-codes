# Email Anti-Spam Configuration Guide

## DNS Configuration (Most Important!)

### 1. SPF Record
Add this TXT record to your DNS:
```
v=spf1 include:sendgrid.net include:_spf.google.com ~all
```

### 2. DKIM Records
These should already be configured from your SendGrid setup:
- `s1._domainkey.hiapply.co`
- `s2._domainkey.hiapply.co`

### 3. DMARC Record
You already have this configured:
```
_dmarc.hiapply.co TXT "v=DMARC1; p=none; rua=mailto:james@hiapply.co"
```

Consider upgrading to:
```
v=DMARC1; p=quarantine; rua=mailto:james@hiapply.co; ruf=mailto:james@hiapply.co; pct=100
```

## SendGrid Configuration

### 1. Sender Authentication
- ✅ Domain authenticated (hiapply.co)
- ✅ Link branding configured
- ✅ DKIM/SPF records verified

### 2. IP Warmup
- SendGrid automatically handles IP warmup for new accounts
- Start with small volumes and gradually increase

### 3. Sender Reputation
- Monitor your sender score at senderscore.org
- Check blacklists at mxtoolbox.com/blacklists

## Email Content Best Practices

### 1. Subject Lines
- Personalize with `{{ .Email }}`
- Keep under 50 characters
- Avoid ALL CAPS and excessive punctuation
- No spam trigger words (FREE, URGENT, ACT NOW)

### 2. Email Body
- **Text-to-Image Ratio**: At least 60% text, 40% images
- **Links**: Use full URLs, not URL shorteners
- **Personalization**: Use recipient's email in greeting
- **Physical Address**: Required by CAN-SPAM Act
- **Unsubscribe Link**: Improves reputation even for transactional emails

### 3. HTML Best Practices
- Use tables for layout (better email client support)
- Inline CSS only (no external stylesheets)
- Alt text for all images
- Fallback fonts for web fonts
- Test with Litmus or Email on Acid

## Supabase SMTP Configuration

Your current SendGrid SMTP settings in Supabase:
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Your SendGrid API Key]
From Email: hello@hiapply.co
From Name: Blind Nut
```

## Testing Tools

### 1. Spam Score Testing
- [Mail-Tester](https://www.mail-tester.com/) - Free spam score checker
- [GlockApps](https://glockapps.com/) - Inbox placement testing
- [Postmark Spam Check](https://spamcheck.postmarkapp.com/)

### 2. Email Preview
- [Litmus](https://litmus.com/) - Test across email clients
- [Email on Acid](https://www.emailonacid.com/)
- SendGrid's Email Testing feature

## Monitoring & Maintenance

### 1. SendGrid Analytics
Monitor these metrics:
- **Delivery Rate**: Should be >98%
- **Open Rate**: 20-30% for transactional emails
- **Bounce Rate**: Should be <2%
- **Spam Reports**: Should be <0.1%

### 2. Feedback Loops
- Set up feedback loops with major ISPs
- Monitor abuse complaints
- Remove complainers immediately

### 3. List Hygiene
- Remove hard bounces automatically
- Honor unsubscribe requests immediately
- Don't send to role addresses (admin@, info@, etc.)

## Quick Wins to Implement Now

1. **Update DMARC Policy**
   ```
   v=DMARC1; p=quarantine; rua=mailto:james@hiapply.co; pct=100
   ```

2. **Add List-Unsubscribe Header**
   In your SendGrid email settings, add:
   ```
   List-Unsubscribe: <mailto:unsubscribe@hiapply.co>, <https://www.apply.codes/unsubscribe>
   ```

3. **Warm Up Your Domain**
   - Start with 50 emails/day
   - Increase by 50% each day
   - Monitor bounce rates

4. **Set Up Google Postmaster Tools**
   - Register at postmaster.google.com
   - Monitor your domain reputation
   - Track Gmail delivery issues

## Emergency: If Emails Still Go to Spam

1. **Check Blacklists**
   ```bash
   # Check if your IP/domain is blacklisted
   curl https://mxtoolbox.com/api/v1/lookup/blacklist/hiapply.co
   ```

2. **Test with Mail-Tester**
   - Send test email to the address they provide
   - Fix any issues scoring below 8/10

3. **Contact SendGrid Support**
   - They can check your account reputation
   - May need to request dedicated IP

4. **Implement Double Opt-In**
   - For new signups, require email confirmation
   - Dramatically improves deliverability

## Template Modifications for Better Delivery

Replace spam-trigger phrases:
- ❌ "Click here" → ✅ "Select this link"
- ❌ "Free trial" → ✅ "Trial period"
- ❌ "Act now" → ✅ "Get started"
- ❌ "Limited time" → ✅ "Available for 7 days"

## Final Checklist

- [ ] SPF record includes SendGrid
- [ ] DKIM records verified in SendGrid
- [ ] DMARC policy set to at least p=none
- [ ] Physical address in email footer
- [ ] Personalization tokens used
- [ ] Subject line under 50 characters
- [ ] No spam trigger words
- [ ] HTML validates correctly
- [ ] Plain text version included
- [ ] Unsubscribe link present
- [ ] Tested with spam checker
- [ ] Monitoring set up in SendGrid