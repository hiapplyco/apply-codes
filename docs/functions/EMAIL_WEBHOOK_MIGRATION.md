# Email Webhook Migration - Supabase to Firebase

## Overview

Successfully migrated the `process-email-webhook` Edge Function from Supabase to Firebase Cloud Functions. This function handles SendGrid webhook events for email tracking and analytics.

## Migration Details

### Source Pattern (Supabase)
- **Source**: `/supabase/functions/process-email-webhook/` (didn't exist - created from scratch)
- **Runtime**: Deno
- **Pattern**: `serve()` function with CORS handling

### Target Implementation (Firebase)
- **Target**: `/functions/process-email-webhook.js`
- **Runtime**: Node.js
- **Pattern**: `functions.https.onRequest()` for webhook endpoint

## Key Changes Made

### 1. Runtime Conversion
- **Deno to Node.js**: Converted from Deno imports to Node.js requires
- **Environment Variables**: Changed `Deno.env.get()` to `process.env` and `functions.config()`
- **Crypto**: Used Node.js built-in `crypto` module for signature verification

### 2. Function Structure
- **Main Function**: `processEmailWebhook` - HTTP request handler for SendGrid webhooks
- **Helper Functions**: `getEmailEvents` and `getEmailAnalytics` - callable functions for data retrieval
- **Authentication**: Webhook signature verification using HMAC-SHA256

### 3. Database Integration
- **Firestore Collections**:
  - `email_events`: All webhook events
  - `email_logs`: Email status tracking (updated from existing send-email function)
  - `email_status`: Current status per email address
  - `email_analytics`: Daily aggregated metrics
  - `email_suppressions`: Bounce/spam/unsubscribe suppression list
  - `email_clicks`: Detailed click tracking
  - `group_unsubscribes`: Group-specific unsubscribes
  - `group_resubscribes`: Group-specific resubscribes

## Supported SendGrid Events

### Core Events
- ✅ **delivered**: Email successfully delivered
- ✅ **open**: Email opened by recipient
- ✅ **click**: Link clicked in email
- ✅ **bounce**: Email bounced (temporary or permanent)
- ✅ **dropped**: Email dropped by SendGrid
- ✅ **deferred**: Email temporarily deferred
- ✅ **processed**: Email accepted by SendGrid

### Spam & Unsubscribe Events
- ✅ **spam_report**: Email marked as spam
- ✅ **unsubscribe**: Global unsubscribe
- ✅ **group_unsubscribe**: Group-specific unsubscribe
- ✅ **group_resubscribe**: Group-specific resubscribe

## Security Features

### Webhook Verification
- **Signature Verification**: HMAC-SHA256 signature validation
- **Timestamp Validation**: Prevents replay attacks
- **Environment Configuration**: Webhook secret from Firebase config
- **Development Mode**: Allows unsigned requests when no secret configured

### Data Protection
- **Suppression Lists**: Automatic bounce/spam/unsubscribe handling
- **Rate Limiting**: Built into Firebase Cloud Functions
- **CORS Protection**: Proper CORS headers for webhook endpoint

## Configuration

### Environment Variables
```bash
# Firebase Functions Config
firebase functions:config:set sendgrid.webhook_secret="your-webhook-secret"

# Or set in .env for local development
SENDGRID_WEBHOOK_SECRET=your-webhook-secret
```

### SendGrid Webhook Setup
1. Go to SendGrid Dashboard → Settings → Mail Settings → Event Webhook
2. Set HTTP POST URL: `https://your-region-your-project.cloudfunctions.net/processEmailWebhook`
3. Select events to track
4. Set signing key (matches your webhook secret)

## Usage Examples

### 1. Processing Webhooks (Automatic)
SendGrid automatically sends webhooks to your endpoint. No manual intervention needed.

### 2. Getting Email Events
```javascript
// Get recent events for an email
const events = await getEmailEvents({
  email: 'user@example.com',
  limit: 50
});
```

### 3. Getting Analytics
```javascript
// Get analytics for date range
const analytics = await getEmailAnalytics({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

## Data Structures

### Email Event Document
```javascript
{
  event_id: 'unique-event-id',
  email: 'recipient@example.com',
  event_type: 'open|click|bounce|delivered|etc',
  timestamp: Firestore.Timestamp,
  message_id: 'sendgrid-message-id',
  smtp_id: 'smtp-message-id',
  user_agent: 'Mozilla/5.0...',
  ip_address: '192.168.1.1',
  url: 'https://clicked-url.com', // for click events
  reason: 'bounce reason', // for bounce events
  created_at: Firestore.Timestamp
}
```

### Email Analytics Document
```javascript
{
  date: '2024-01-01', // Document ID
  opens: 245,
  clicks: 89,
  bounces: 12,
  drops: 3,
  spam_reports: 1,
  unsubscribes: 2,
  created_at: Firestore.Timestamp,
  updated_at: Firestore.Timestamp
}
```

### Email Status Document
```javascript
{
  email: 'user@example.com',
  status: 'delivered|opened|clicked|bounced|etc',
  delivered_at: Firestore.Timestamp,
  opened_at: Firestore.Timestamp,
  clicked_at: Firestore.Timestamp,
  clicked_url: 'https://last-clicked-url.com',
  updated_at: Firestore.Timestamp
}
```

## Testing

### Local Testing with Emulator
```bash
# Start Firebase emulator
firebase emulators:start

# Run test suite
cd functions
node test-email-webhook.js
```

### Test Scenarios Covered
1. **Valid Webhook**: Proper signature and events
2. **Invalid Signature**: Rejected with 401
3. **No Signature**: Allowed in development mode
4. **Multiple Events**: Batch processing
5. **Helper Functions**: Event retrieval and analytics

### Manual Testing
```bash
# Test with curl
curl -X POST http://localhost:5001/your-project/us-central1/processEmailWebhook \
  -H "Content-Type: application/json" \
  -H "X-Event-Webhook-Signature: sha256=your-signature" \
  -H "X-Event-Webhook-Timestamp: 1234567890" \
  -d '[{"email":"test@example.com","event":"delivered","timestamp":1234567890}]'
```

## Performance Considerations

### Optimizations
- **Batch Processing**: Handles multiple events per webhook call
- **Async Operations**: Non-blocking database writes
- **Error Handling**: Graceful degradation on non-critical failures
- **Firestore Transactions**: Atomic analytics updates

### Monitoring
- **Cloud Functions Logs**: All events logged with details
- **Error Tracking**: Failed events logged but don't block processing
- **Analytics Tracking**: Daily aggregation for performance monitoring

## Integration with Existing System

### Email Logs Update
The webhook automatically updates existing `email_logs` documents created by the `send-email` function, providing end-to-end email tracking.

### Suppression List Management
Automatic management of email suppression lists for:
- Hard bounces
- Spam reports
- Unsubscribes

### Analytics Dashboard
Ready for integration with analytics dashboards using the `getEmailAnalytics` function.

## Deployment

### Deploy to Firebase
```bash
cd functions
firebase deploy --only functions:processEmailWebhook,functions:getEmailEvents,functions:getEmailAnalytics
```

### Verify Deployment
```bash
# Check function URLs
firebase functions:list

# Test webhook endpoint
curl -X POST https://your-region-your-project.cloudfunctions.net/processEmailWebhook \
  -H "Content-Type: application/json" \
  -d '[]'
```

## Migration Status: ✅ COMPLETE

- [x] Create Firebase Cloud Function for webhook processing
- [x] Implement signature verification
- [x] Handle all SendGrid event types
- [x] Database schema design
- [x] Email status tracking
- [x] Analytics aggregation
- [x] Suppression list management
- [x] Helper functions for data retrieval
- [x] Comprehensive testing
- [x] Documentation
- [x] Integration with existing email system

## Next Steps

1. **Configure SendGrid**: Update webhook URL to point to Firebase function
2. **Monitor Performance**: Watch logs and analytics after deployment
3. **Dashboard Integration**: Connect analytics to frontend dashboard
4. **Alerting**: Set up monitoring for bounce rates and spam reports

---

**Migration completed**: 2024-09-27
**Function endpoint**: `processEmailWebhook`
**Helper functions**: `getEmailEvents`, `getEmailAnalytics`
**Test file**: `test-email-webhook.js`