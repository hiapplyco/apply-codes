# PDL Search Firebase Cloud Function

## Overview
The `pdlSearch` function provides access to People Data Labs API for comprehensive person and company data enrichment and search capabilities. This function has been migrated from Supabase Edge Functions to Firebase Cloud Functions.

## Features
- **Person Enrichment**: Get detailed profile information for a specific person
- **Company Enrichment**: Get detailed information about a specific company
- **Person Search**: Find multiple people matching search criteria
- **Company Search**: Find multiple companies matching search criteria
- **Advanced Filtering**: Support for complex search queries and pagination
- **Contact Information**: Access to emails, phone numbers, and social profiles

## API Endpoints

### 1. Person Enrichment
Get detailed information about a specific person using various identifiers.

```javascript
POST /pdlSearch
{
  "searchType": "person_enrich",
  "searchParams": {
    "email": "john.doe@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Google"
  }
}
```

**Required Parameters** (at least one of):
- `profile` - LinkedIn profile URL
- `email` - Email address
- `phone` - Phone number
- `email_hash` - SHA256 hash of email
- `lid` - LinkedIn ID
- `(first_name AND last_name) OR name` + location information

### 2. Company Enrichment
Get detailed information about a specific company.

```javascript
POST /pdlSearch
{
  "searchType": "company_enrich",
  "searchParams": {
    "name": "Google Inc",
    "website": "google.com",
    "ticker": "GOOGL"
  }
}
```

**Required Parameters** (at least one of):
- `name` - Company name
- `ticker` - Stock ticker symbol
- `website` - Company website
- `profile` - LinkedIn company profile URL

### 3. Person Search
Find multiple people matching search criteria.

```javascript
POST /pdlSearch
{
  "searchType": "person_search",
  "searchParams": {
    "job_title": "Software Engineer",
    "location_name": "San Francisco",
    "job_company_name": "Google",
    "skills": ["JavaScript", "React", "Node.js"]
  },
  "pagination": {
    "size": 20,
    "from": 0
  }
}
```

### 4. Company Search
Find multiple companies matching search criteria.

```javascript
POST /pdlSearch
{
  "searchType": "company_search",
  "searchParams": {
    "industry": "Technology",
    "size": "1000-5000",
    "location_name": "San Francisco",
    "founded": "2000-2020"
  },
  "pagination": {
    "size": 15,
    "from": 0
  }
}
```

## Response Format

### Person Data Structure
```javascript
{
  "data": {
    "id": "person_id",
    "full_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "emails": ["john.doe@company.com"],
    "phone_numbers": ["+1-555-123-4567"],
    "job_title": "Senior Software Engineer",
    "job_company_name": "Google",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "location_names": ["San Francisco, CA"],
    "skills": ["JavaScript", "Python", "React"],
    "education": [...],
    "experience": [...],
    "hasContactInfo": true,
    "hasEmploymentInfo": true
  },
  "source": "peopledatalabs",
  "searchType": "person_enrich",
  "credits_used": 1,
  "credits_remaining": 999
}
```

### Company Data Structure
```javascript
{
  "data": {
    "id": "company_id",
    "name": "Google Inc",
    "display_name": "Google",
    "size": "10000+",
    "employee_count": 150000,
    "founded": 1998,
    "industry": "Technology",
    "website": "google.com",
    "linkedin_url": "https://linkedin.com/company/google",
    "location_name": "Mountain View, CA",
    "ticker": "GOOGL",
    "hasContactInfo": true,
    "hasLocationInfo": true
  },
  "source": "peopledatalabs",
  "searchType": "company_enrich",
  "credits_used": 1,
  "credits_remaining": 999
}
```

## Environment Variables
Set the following environment variable in Firebase Functions:

```bash
# People Data Labs API Key
PDL_API_KEY=your_pdl_api_key_here
# or
PEOPLE_DATA_LABS_API_KEY=your_pdl_api_key_here
```

## Rate Limits
- **Person/Company Enrichment**: 100/minute (free tier), 1,000/minute (paid plans)
- **Person/Company Search**: Varies by plan
- Credits are charged per successful match/search

## Error Handling
The function includes comprehensive error handling:

- **400**: Validation errors (missing or invalid parameters)
- **401**: Invalid API key
- **404**: No results found (returns empty data)
- **429**: Rate limit exceeded
- **500**: Server errors

## Usage Examples

### Frontend Integration
```javascript
// Call from React component
const searchPeople = async (searchParams) => {
  const response = await fetch('/api/pdlSearch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      searchType: 'person_search',
      searchParams,
      pagination: { size: 20, from: 0 }
    })
  });

  const data = await response.json();
  return data;
};
```

### Backend Integration
```javascript
// Call from another Cloud Function
const axios = require('axios');

const enrichPerson = async (email) => {
  const response = await axios.post('https://your-region-your-project.cloudfunctions.net/pdlSearch', {
    searchType: 'person_enrich',
    searchParams: { email }
  });

  return response.data;
};
```

## Migration Notes
This function replaces the Supabase Edge Function with the following changes:
- Converted from Deno to Node.js
- Uses `axios` instead of `fetch`
- Migrated from `Deno.env.get()` to `process.env`
- Updated to Firebase Functions v1 format
- Maintained all original API functionality and data structures
- Added comprehensive error handling and validation

## Testing
Run the test file to validate function behavior:
```bash
cd functions
node test-pdl-search.js
```

## Credits and Billing
- Each successful enrichment consumes 1 credit
- Search operations may consume multiple credits depending on result size
- Monitor usage through PDL dashboard or response headers
- Consider implementing caching to reduce API calls

## Security
- API keys are stored securely in Firebase Functions environment
- All requests include CORS headers for browser compatibility
- Input validation prevents malformed requests
- Error messages don't expose sensitive information