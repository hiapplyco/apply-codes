# Nymeria API Integration Fix Instructions

## Issue
The Nymeria API integration is not working because the API key is invalid (returning 401 Unauthorized).

## Steps to Fix

### 1. Get a Valid Nymeria API Key
- Sign up at https://www.nymeria.io
- Navigate to your dashboard/API settings
- Generate a new API key

### 2. Update Supabase Secret
```bash
# Update the NYMERIA_API_KEY secret in Supabase
supabase secrets set NYMERIA_API_KEY=your_new_valid_api_key_here
```

### 3. Verify the Fix
After updating the API key, test the integration:

1. **Using the test function:**
```bash
# Deploy and run the test function
supabase functions deploy test-nymeria
```

2. **In the browser console:**
```javascript
// Run this in your app's browser console
async function testNymeria() {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase.functions.invoke('test-nymeria');
  console.log('Test result:', data || error);
}
testNymeria();
```

3. **Test with a real profile:**
```javascript
// Test enriching a LinkedIn profile
async function testEnrichment() {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data, error } = await supabase.functions.invoke('enrich-profile', {
    body: {
      profileUrl: 'https://www.linkedin.com/in/some-profile/'
    }
  });
  console.log('Enrichment result:', data || error);
}
testEnrichment();
```

## Expected Behavior After Fix
- "Get Contact Info" button should work without errors
- Contact information modal should display:
  - Emails
  - Phone numbers
  - Professional information
  - Social media links

## Troubleshooting
If issues persist after updating the API key:

1. Check Supabase logs:
   - Go to Supabase Dashboard > Functions > enrich-profile > Logs

2. Verify the secret was updated:
   ```bash
   supabase secrets list
   ```

3. Ensure the edge function is deployed:
   ```bash
   supabase functions deploy enrich-profile
   ```

## API Documentation
For more details on Nymeria API usage and limits, visit:
https://www.nymeria.io/docs/api