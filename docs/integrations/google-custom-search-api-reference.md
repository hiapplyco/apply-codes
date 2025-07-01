# Google Custom Search JSON API v1 Reference

## Overview

The Google Custom Search JSON API allows you to develop websites and applications to retrieve and display search results from Google Programmable Search Engine programmatically.

**Service Name:** `customsearch`  
**Service URL:** `https://customsearch.googleapis.com`  
**Discovery Document:** `https://www.googleapis.com/discovery/v1/apis/customsearch/v1/rest`

## Authentication

**OAuth Scope Required:**
```
https://www.googleapis.com/auth/cse
```

## Endpoints

### 1. Custom Search Engine List
**Endpoint:** `GET https://customsearch.googleapis.com/customsearch/v1`  
**Method:** `cse.list`  
**Description:** Returns metadata about the search performed, metadata about the engine used for the search, and the search results.

### 2. Site Restricted Search
**Endpoint:** `GET https://customsearch.googleapis.com/customsearch/v1/siterestrict`  
**Method:** `cse.siterestrict.list`  
**Description:** Similar to the primary endpoint but with site restriction capabilities.

## Request Parameters

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Query string for search |
| `cx` | string | The Programmable Search Engine ID to use for this request |

### Optional Parameters

#### General Search Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `c2coff` | string | Enables or disables Simplified and Traditional Chinese Search | |
| `cr` | string | Restricts search results to documents originating in a particular country | |
| `dateRestrict` | string | Restricts results based on date. Format: `d[number]` (days), `w[number]` (weeks), `m[number]` (months), `y[number]` (years) | |
| `exactTerms` | string | Identifies a phrase that all documents in the search results must contain | |
| `excludeTerms` | string | Identifies a word or phrase that should not appear in any documents in the search results | |
| `fileType` | string | Restricts results to files of a specified extension (e.g., pdf, doc, xls) | |
| `filter` | string | Controls duplicate content filter. Values: `0` (off), `1` (on) | `1` |
| `gl` | string | Geolocation of end user (two-letter country code) | |
| `googlehost` | string | The local Google domain to use for search | |
| `highRange` | string | Specifies the ending value for a search range | |
| `hl` | string | Sets the user interface language | |
| `hq` | string | Appends additional query terms to the query | |
| `linkSite` | string | Specifies that all search results should contain a link to a particular URL | |
| `lowRange` | string | Specifies the starting value for a search range | |
| `lr` | string | Restricts the search to documents written in a particular language | |
| `num` | integer | Number of search results to return (1-10) | `10` |
| `orTerms` | string | Provides additional search terms where each result must contain at least one term | |
| `rights` | string | Filters based on licensing (e.g., cc_publicdomain, cc_attribute) | |
| `safe` | string | Search safety level. Values: `active`, `off` | `off` |
| `searchType` | string | Specifies the search type. Value: `image` | |
| `siteSearch` | string | Restricts results to URLs from a specified site | |
| `siteSearchFilter` | string | Controls site search inclusion/exclusion. Values: `e` (exclude), `i` (include) | |
| `sort` | string | The sort expression to apply to results | |
| `start` | integer | The index of the first result to return (1-based) | |

#### Image Search Parameters

| Parameter | Type | Description | Values |
|-----------|------|-------------|--------|
| `imgColorType` | string | Returns images of a specific color type | `color`, `gray`, `mono`, `trans` |
| `imgDominantColor` | string | Returns images of a specific dominant color | `black`, `blue`, `brown`, `gray`, `green`, `orange`, `pink`, `purple`, `red`, `teal`, `white`, `yellow` |
| `imgSize` | string | Returns images of a specified size | `huge`, `icon`, `large`, `medium`, `small`, `xlarge`, `xxlarge` |
| `imgType` | string | Returns images of a type | `clipart`, `face`, `lineart`, `stock`, `photo`, `animated` |

## Response Structure

### Main Response Object

```json
{
  "kind": "customsearch#search",
  "url": {
    "type": "string",
    "template": "string"
  },
  "queries": {
    "previousPage": [
      {
        "title": "string",
        "totalResults": "string",
        "searchTerms": "string",
        "count": "integer",
        "startIndex": "integer",
        "inputEncoding": "string",
        "outputEncoding": "string",
        "safe": "string",
        "cx": "string"
      }
    ],
    "request": [
      {
        "title": "string",
        "totalResults": "string",
        "searchTerms": "string",
        "count": "integer",
        "startIndex": "integer",
        "inputEncoding": "string",
        "outputEncoding": "string",
        "safe": "string",
        "cx": "string"
      }
    ],
    "nextPage": [
      {
        "title": "string",
        "totalResults": "string",
        "searchTerms": "string",
        "count": "integer",
        "startIndex": "integer",
        "inputEncoding": "string",
        "outputEncoding": "string",
        "safe": "string",
        "cx": "string"
      }
    ]
  },
  "promotions": [
    {
      "title": "string",
      "htmlTitle": "string",
      "link": "string",
      "displayLink": "string",
      "bodyLines": [
        {
          "title": "string",
          "htmlTitle": "string",
          "url": "string",
          "link": "string"
        }
      ],
      "image": {
        "source": "string",
        "width": "integer",
        "height": "integer"
      }
    }
  ],
  "context": {
    "title": "string",
    "facets": [
      [
        {
          "label": "string",
          "anchor": "string",
          "label_with_op": "string"
        }
      ]
    ]
  },
  "searchInformation": {
    "searchTime": "number",
    "formattedSearchTime": "string",
    "totalResults": "string",
    "formattedTotalResults": "string"
  },
  "spelling": {
    "correctedQuery": "string",
    "htmlCorrectedQuery": "string"
  },
  "items": [
    {
      "kind": "customsearch#result",
      "title": "string",
      "htmlTitle": "string",
      "link": "string",
      "displayLink": "string",
      "snippet": "string",
      "htmlSnippet": "string",
      "cacheId": "string",
      "formattedUrl": "string",
      "htmlFormattedUrl": "string",
      "pagemap": {},
      "mime": "string",
      "fileFormat": "string",
      "image": {
        "contextLink": "string",
        "height": "integer",
        "width": "integer",
        "byteSize": "integer",
        "thumbnailLink": "string",
        "thumbnailHeight": "integer",
        "thumbnailWidth": "integer"
      },
      "labels": [
        {
          "name": "string",
          "displayName": "string",
          "label_with_op": "string"
        }
      ]
    }
  ]
}
```

### Search Result Item Structure

Each item in the `items` array represents a search result with the following structure:

```json
{
  "kind": "customsearch#result",
  "title": "string",
  "htmlTitle": "string",
  "link": "string",
  "displayLink": "string",
  "snippet": "string",
  "htmlSnippet": "string",
  "cacheId": "string",
  "formattedUrl": "string",
  "htmlFormattedUrl": "string",
  "pagemap": {
    "cse_thumbnail": [
      {
        "src": "string",
        "width": "string",
        "height": "string"
      }
    ],
    "metatags": [
      {
        "og:image": "string",
        "og:type": "string",
        "og:title": "string",
        "og:description": "string"
      }
    ],
    "cse_image": [
      {
        "src": "string"
      }
    ]
  },
  "mime": "string",
  "fileFormat": "string",
  "image": {
    "contextLink": "string",
    "height": "integer",
    "width": "integer", 
    "byteSize": "integer",
    "thumbnailLink": "string",
    "thumbnailHeight": "integer",
    "thumbnailWidth": "integer"
  },
  "labels": [
    {
      "name": "string",
      "displayName": "string",
      "label_with_op": "string"
    }
  ]
}
```

## Example Requests

### Basic Search Request
```bash
GET https://customsearch.googleapis.com/customsearch/v1?q=lectures&cx=YOUR_ENGINE_ID&key=YOUR_API_KEY
```

### Image Search Request
```bash
GET https://customsearch.googleapis.com/customsearch/v1?q=flowers&cx=YOUR_ENGINE_ID&searchType=image&key=YOUR_API_KEY
```

### Paginated Request
```bash
GET https://customsearch.googleapis.com/customsearch/v1?q=technology&cx=YOUR_ENGINE_ID&start=11&num=10&key=YOUR_API_KEY
```

### Site-Restricted Search
```bash
GET https://customsearch.googleapis.com/customsearch/v1?q=android&cx=YOUR_ENGINE_ID&siteSearch=developer.android.com&key=YOUR_API_KEY
```

## Error Responses

Error responses follow the standard Google API error format:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid Value",
    "errors": [
      {
        "domain": "global",
        "reason": "invalid",
        "message": "Invalid Value"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameter value |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Access denied, quota exceeded |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limits and Quotas

- **Default quota:** 100 queries per day for free tier
- **Queries per second:** Subject to per-project limits
- **Maximum results per query:** 10

## Best Practices

1. **Cache Results**: Implement caching to reduce API calls and improve performance
2. **Handle Errors Gracefully**: Implement exponential backoff for rate limit errors
3. **Use Specific Parameters**: Be specific with search parameters to get more relevant results
4. **Monitor Usage**: Track your API usage to avoid hitting quotas
5. **Optimize Queries**: Use filters and restrictions to narrow down results

## Additional Resources

- [Google Custom Search Engine](https://programmablesearchengine.google.com/)
- [API Client Libraries](https://developers.google.com/custom-search/v1/libraries)
- [Pricing and Quotas](https://developers.google.com/custom-search/v1/overview#pricing)
- [Support and Community](https://groups.google.com/g/google-custom-search)