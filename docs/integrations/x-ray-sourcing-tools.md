# X-Ray Sourcing Tools Integration Guide

## Overview
X-ray sourcing involves using advanced search operators and techniques to find candidates across various platforms. Here are potential tools and APIs that could enhance the Blind Nut platform's sourcing capabilities.

## Recommended Sourcing Tool Integrations

### 1. **People Data Labs API**
- **Purpose**: Comprehensive people data enrichment and search
- **Features**:
  - Search by skills, companies, locations, education
  - Bulk enrichment capabilities
  - 1.5+ billion person profiles
  - Real-time data updates
- **Implementation Priority**: High
- **Cost**: $299/month starting

### 2. **Hunter.io API**
- **Purpose**: Email finder and verification
- **Features**:
  - Domain search for company emails
  - Email verification
  - Bulk operations
  - Chrome extension for LinkedIn
- **Implementation Priority**: High
- **Cost**: $49/month starting

### 3. **Clearbit API**
- **Purpose**: Company and person enrichment
- **Features**:
  - Company data enrichment
  - Person lookup by email/domain
  - Prospector API for finding leads
  - Risk scoring
- **Implementation Priority**: Medium
- **Cost**: Custom pricing

### 4. **GitHub API Integration**
- **Purpose**: Technical talent sourcing
- **Features**:
  - Search developers by language/technology
  - Repository contribution analysis
  - Activity metrics
  - Location-based search
- **Implementation Priority**: High (for tech roles)
- **Cost**: Free with rate limits

### 5. **Stack Overflow API**
- **Purpose**: Developer talent assessment
- **Features**:
  - Search by tags/expertise
  - Reputation scores
  - Activity analysis
  - Answer quality metrics
- **Implementation Priority**: Medium
- **Cost**: Free with rate limits

### 6. **Indeed Resume Search API**
- **Purpose**: Resume database access
- **Features**:
  - Search resumes by keywords
  - Location filtering
  - Experience level filtering
  - Direct candidate contact
- **Implementation Priority**: Medium
- **Cost**: Pay-per-contact model

### 7. **ZoomInfo API** (Enterprise)
- **Purpose**: B2B contact database
- **Features**:
  - Advanced search filters
  - Intent data
  - Technographics
  - Direct dial phone numbers
- **Implementation Priority**: Low (expensive)
- **Cost**: Enterprise pricing

## Advanced Search Operators Implementation

### Enhanced Boolean Search Builder
```typescript
interface AdvancedSearchOperators {
  // Platform-specific operators
  platforms: {
    linkedin: {
      inurl: "linkedin.com/in/",
      intitle: string[],
      industry: string[],
      school: string[]
    },
    github: {
      site: "github.com",
      language: string[],
      location: string[],
      followers: string
    },
    stackoverflow: {
      site: "stackoverflow.com",
      user: string,
      score: string,
      tags: string[]
    }
  },
  
  // Advanced operators
  operators: {
    AROUND: number, // Proximity search
    BEFORE: string, // Date range
    AFTER: string,
    filetype: string[],
    related: string[]
  }
}
```

### Multi-Platform Search Aggregator
Create a unified search interface that queries multiple platforms:

```typescript
interface MultiPlatformSearch {
  searchQuery: string;
  platforms: ('linkedin' | 'github' | 'stackoverflow' | 'twitter' | 'angellist')[];
  filters: {
    location?: string;
    skills?: string[];
    experience?: string;
    companies?: string[];
  };
}
```

## Implementation Recommendations

### Phase 1: Core Enhancements (1-2 weeks)
1. Improve Boolean search string generation with more operators
2. Add GitHub API integration for developer sourcing
3. Implement Hunter.io for email finding

### Phase 2: Advanced Features (3-4 weeks)
1. Multi-platform search aggregation
2. People Data Labs integration
3. Advanced filtering and scoring

### Phase 3: Enterprise Features (1-2 months)
1. Bulk enrichment capabilities
2. Custom scoring algorithms
3. CRM integration for sourced candidates

## Security Considerations
- API key rotation and management
- Rate limiting implementation
- Data privacy compliance (GDPR, CCPA)
- Secure storage of enriched data

## Cost-Benefit Analysis
| Tool | Monthly Cost | Profiles/Month | Cost per Profile |
|------|--------------|----------------|------------------|
| Nymeria | $49-299 | 1,000-10,000 | $0.03-0.05 |
| Hunter.io | $49-399 | 1,000-50,000 | $0.01-0.05 |
| People Data Labs | $299+ | 10,000+ | $0.03+ |
| GitHub API | Free | Unlimited* | $0 |

*Subject to rate limits

## Next Steps
1. Evaluate which tools align with user needs
2. Create API integration plan
3. Design unified search interface
4. Implement with proper error handling and fallbacks