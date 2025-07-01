# Nymeria API Integration Guide

## Overview

Nymeria API provides comprehensive profile enrichment for people and companies, helping you find contact information including personal emails, work emails, and phone numbers. This guide covers integration for profile enrichment and contact discovery.

## Authentication

All API requests require authentication using an API key passed in the `X-API-Key` header.

```bash
curl -H "X-API-Key: YOUR-API-KEY" https://www.nymeria.io/api/v4/person/enrich?email=example@email.com
```

**Important:** Keep your API keys secure and never expose them in client-side code or public repositories.

## Base URL
```
https://www.nymeria.io/api/v4/
```

## Credit System

- **People Enrichment**: 1 credit per successful person enriched
- **People Search**: 1 credit per person returned
- **Company Enrichment**: 1 credit per company enriched
- **Company Search**: 1 credit per company returned

Credit information is returned in response headers:
- `X-Call-Credits-Spent`: Credits consumed by the request
- `X-Call-Credits-Type`: Type of credit spent
- `X-Total-Limit-Remaining`: Remaining credit limit

## People Enrichment

### What Information Do You Need to Enrich?

The person enrichment endpoint accepts **at least one** of the following input parameters:

- `profile`: Public profile URL (LinkedIn, GitHub, etc.)
- `lid`: Numeric LinkedIn identifier  
- `email`: Any email address associated with a person
- `linkedin_username`: LinkedIn username

### Single Person Enrichment

**Endpoint:** `GET /person/enrich`

**Parameters:**
- `profile` (optional): Public profile URL
- `lid` (optional): LinkedIn numeric ID
- `email` (optional): Email address
- `linkedin_username` (optional): LinkedIn username
- `require` (optional): Comma-separated list of required fields (`email`, `phone`, `personal-email`, `professional-email`)

**Example Request:**
```bash
curl -H "X-API-Key: YOUR-API-KEY" \
  "https://www.nymeria.io/api/v4/person/enrich?linkedin_username=wozniaksteve&require=email,phone"
```

**Example Response:**
```json
{
  "status": 200,
  "data": {
    "uuid": "a2528c93-c11c-4d30-b9c2-1d413ec93bb3",
    "first_name": "steve",
    "last_name": "wozniak",
    "location_name": "palo alto, california",
    "location_country": "united states",
    "job_title": "founder",
    "job_company_name": "apple",
    "industry": "technology",
    "personal_emails": ["*****@icloud.com"],
    "work_email": "*****@apple.com",
    "mobile_phone": null,
    "linkedin_username": "wozniaksteve"
  }
}
```

### Bulk Person Enrichment

**Endpoint:** `POST /person/enrich/bulk`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "requests": [
    {
      "params": {
        "linkedin_url": "linkedin.com/in/username"
      },
      "metadata": {
        "internal-id": "user-123"
      }
    },
    {
      "params": {
        "email": "user@example.com"
      }
    }
  ]
}
```

**Response:** Array of individual enrichment results with same format as single enrichment.

## People Search

### What Information Can You Search With?

The people search endpoint accepts one or more of these parameters:

- `first_name`: Person's given name
- `last_name`: Person's family name
- `location`: Location (city, state)
- `country`: Country (e.g., "united states")
- `industry`: Industry name
- `title`: Current job title
- `company`: Current company name

**Endpoint:** `GET /person/search`

**Optional Parameters:**
- `limit`: 1-25 (default: 10)
- `offset`: 0-9999 (default: 0)

**Example Request:**
```bash
curl -H "X-API-Key: YOUR-API-KEY" \
  "https://www.nymeria.io/api/v4/person/search?first_name=steve&last_name=wozniak&company=apple&limit=5"
```

**Example Response:**
```json
{
  "status": 200,
  "meta": {
    "first_name": "steve",
    "last_name": "wozniak",
    "limit": "5",
    "offset": "0"
  },
  "data": [
    {
      "uuid": "2daa700e-ab74-4be9-bf88-dd1b8a94efcd",
      "first_name": "steve", 
      "last_name": "wozniak",
      "location": "palo alto, california",
      "country": "united states",
      "job_title": "co-founder",
      "job_company_name": "apple",
      "industry": "technology",
      "personal_emails": ["*****@icloud.com"],
      "work_email": "*****@apple.com",
      "mobile_phone": null,
      "linkedin_username": "wozniaksteve"
    }
  ],
  "total": 1
}
```

## Company Enrichment

### What Information Do You Need to Enrich Companies?

The company enrichment endpoint accepts **one** of the following:

- `name`: Company name
- `website`: Official website URL
- `profile`: LinkedIn company URL
- `linkedin_id`: Numeric LinkedIn company ID

**Endpoint:** `GET /company/enrich`

**Example Request:**
```bash
curl -H "X-API-Key: YOUR-API-KEY" \
  "https://www.nymeria.io/api/v4/company/enrich?name=apple"
```

**Example Response:**
```json
{
  "status": 200,
  "data": {
    "uuid": "fe6ad720-8c76-45c5-a794-1c92cfea6270",
    "name": "nymeria",
    "url": "nymeria.io",
    "size": "1-10",
    "founded": "2017",
    "industry": "computer software",
    "location": "cedar city, utah",
    "country": "united states",
    "linkedin_id": "19213208",
    "linkedin_url": "linkedin.com/company/nymeria"
  }
}
```

## Finding Contact Information

After enrichment, you can extract contact information from the response:

### Phone Numbers
- `mobile_phone`: Personal mobile number
- Check for additional phone fields in the response

### Email Addresses
- `personal_emails[]`: Array of personal email addresses
- `work_email`: Professional email address

### Other Contact Info
- `linkedin_username`: LinkedIn profile username
- `linkedin_url`: Full LinkedIn profile URL

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Invalid request (missing parameters)
- `401`: Unauthorized (invalid API key)
- `402`: Payment required (credits exhausted)
- `404`: Not found (no matching records)
- `500`: Internal server error

### Error Response Format
```json
{
  "metadata": {
    "id": "request-id"
  },
  "params": {
    "email": "test@example.com"
  },
  "status": 404,
  "error": {
    "type": "not_found",
    "message": "There were no records found matching your request."
  }
}
```

### Error Types
- `invalid_request_error`: Missing or invalid parameters
- `not_found`: No matching records found
- `server_error`: Internal server error
- `account_error`: Plan lapsed or credits exhausted

## Implementation Examples

### Node.js/JavaScript Example
```javascript
const axios = require('axios');

class NymeriaClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://www.nymeria.io/api/v4';
  }

  async enrichPerson(params, requirements = []) {
    try {
      const query = new URLSearchParams(params);
      if (requirements.length > 0) {
        query.append('require', requirements.join(','));
      }

      const response = await axios.get(`${this.baseURL}/person/enrich?${query}`, {
        headers: {
          'X-API-Key': this.apiKey
        }
      });

      return {
        success: true,
        data: response.data.data,
        credits_spent: response.headers['x-call-credits-spent'],
        credits_remaining: response.headers['x-total-limit-remaining']
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status
      };
    }
  }

  async bulkEnrichPeople(requests) {
    try {
      const response = await axios.post(`${this.baseURL}/person/enrich/bulk`, {
        requests
      }, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data.data,
        credits_spent: response.headers['x-call-credits-spent']
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  extractContacts(personData) {
    const contacts = {
      emails: [],
      phones: [],
      social: {}
    };

    // Extract emails
    if (personData.personal_emails) {
      contacts.emails.push(...personData.personal_emails);
    }
    if (personData.work_email) {
      contacts.emails.push(personData.work_email);
    }

    // Extract phone
    if (personData.mobile_phone) {
      contacts.phones.push(personData.mobile_phone);
    }

    // Extract social profiles
    if (personData.linkedin_username) {
      contacts.social.linkedin = `https://linkedin.com/in/${personData.linkedin_username}`;
    }

    return contacts;
  }
}

// Usage example
const client = new NymeriaClient('your-api-key');

// Enrich by email
client.enrichPerson({ email: 'user@example.com' }, ['email', 'phone'])
  .then(result => {
    if (result.success) {
      const contacts = client.extractContacts(result.data);
      console.log('Found contacts:', contacts);
    } else {
      console.error('Enrichment failed:', result.error);
    }
  });
```

### Python Example
```python
import requests
from typing import Dict, List, Optional

class NymeriaClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://www.nymeria.io/api/v4"
    
    def enrich_person(self, params: Dict, requirements: Optional[List[str]] = None) -> Dict:
        headers = {"X-API-Key": self.api_key}
        
        query_params = params.copy()
        if requirements:
            query_params["require"] = ",".join(requirements)
        
        try:
            response = requests.get(
                f"{self.base_url}/person/enrich",
                params=query_params,
                headers=headers
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json()["data"],
                    "credits_spent": response.headers.get("X-Call-Credits-Spent"),
                    "credits_remaining": response.headers.get("X-Total-Limit-Remaining")
                }
            else:
                return {
                    "success": False,
                    "error": response.json().get("error", {}),
                    "status": response.status_code
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def extract_contacts(self, person_data: Dict) -> Dict:
        contacts = {
            "emails": [],
            "phones": [],
            "social": {}
        }
        
        # Extract emails
        if person_data.get("personal_emails"):
            contacts["emails"].extend(person_data["personal_emails"])
        if person_data.get("work_email"):
            contacts["emails"].append(person_data["work_email"])
        
        # Extract phone
        if person_data.get("mobile_phone"):
            contacts["phones"].append(person_data["mobile_phone"])
        
        # Extract social
        if person_data.get("linkedin_username"):
            contacts["social"]["linkedin"] = f"https://linkedin.com/in/{person_data['linkedin_username']}"
        
        return contacts

# Usage
client = NymeriaClient("your-api-key")
result = client.enrich_person({"email": "user@example.com"}, ["email", "phone"])

if result["success"]:
    contacts = client.extract_contacts(result["data"])
    print(f"Found contacts: {contacts}")
else:
    print(f"Error: {result['error']}")
```

## Best Practices

1. **Use Requirements**: Always specify `require` parameter to ensure you get the contact information you need
2. **Bulk Operations**: Use bulk enrichment for multiple profiles to improve efficiency
3. **Error Handling**: Always implement proper error handling for API failures
4. **Credit Monitoring**: Monitor credit usage through response headers
5. **Rate Limiting**: Implement appropriate rate limiting to avoid hitting API limits
6. **Data Privacy**: Handle returned contact information in compliance with privacy regulations

## Integration Workflow

1. **Collect Input Data**: Gather LinkedIn URLs, emails, or other identifiers from your app
2. **Enrich Profiles**: Call Nymeria API to enrich person/company data
3. **Extract Contacts**: Parse response to extract phone numbers and emails
4. **Store Results**: Save enriched data to your database
5. **Handle Errors**: Implement retry logic for failed requests

## Testing

Test your integration with different input types:
- LinkedIn URLs
- Email addresses
- Name + company combinations
- Partial information scenarios

Always test error scenarios like invalid inputs and credit exhaustion.