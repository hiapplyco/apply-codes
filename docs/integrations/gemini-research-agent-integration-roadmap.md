# Gemini Research Agent API Integration Roadmap

## Overview
This roadmap outlines the integration of the Gemini Fullstack LangGraph research agent as an API service into the blind-nut recruitment platform.

## Architecture Overview

```
blind-nut (TypeScript/React)
    ↓
Supabase Edge Function (Proxy)
    ↓
Gemini Research Agent API (Python/LangGraph)
    ↓
Google Search API + Gemini LLM
```

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Deploy Research Agent
- [ ] Deploy Gemini research agent to production environment
  - Option A: Deploy to Google Cloud Run
  - Option B: Deploy to AWS Lambda with container
  - Option C: Deploy to dedicated VPS with Docker
- [ ] Configure environment variables (GEMINI_API_KEY, etc.)
- [ ] Set up monitoring and logging
- [ ] Implement rate limiting and authentication

### 1.2 Create Supabase Edge Function
- [ ] Create new edge function: `supabase/functions/research-agent/`
- [ ] Implement proxy logic to forward requests to research agent
- [ ] Add authentication middleware
- [ ] Handle error responses gracefully
- [ ] Add request/response logging

## Phase 2: Tool Integration (Week 2)

### 2.1 Create Research Tool
```typescript
// supabase/functions/_shared/tools/GeminiResearchTool.ts
export class GeminiResearchTool extends Tool {
  name = 'gemini_research';
  description = 'Performs comprehensive web research using Gemini AI';
  
  async execute(params: { query: string }): Promise<ResearchResult> {
    // Implementation
  }
}
```

### 2.2 Register Tool in ToolRegistry
- [ ] Add GeminiResearchTool to ToolRegistry
- [ ] Define input/output schemas
- [ ] Add tool documentation
- [ ] Create unit tests

### 2.3 Update Agent Orchestration
- [ ] Add research capability to RecruitmentAgent
- [ ] Create workflow for research-augmented candidate search
- [ ] Integrate research results into existing data pipeline

## Phase 3: Frontend Integration (Week 3)

### 3.1 Create Research UI Components
- [ ] Create `ResearchPanel.tsx` component
- [ ] Add research toggle to search forms
- [ ] Display research citations and sources
- [ ] Implement loading states and progress indicators

### 3.2 Update Search Hooks
```typescript
// src/hooks/useResearchEnhancedSearch.ts
export function useResearchEnhancedSearch() {
  const [isResearching, setIsResearching] = useState(false);
  const [researchResults, setResearchResults] = useState(null);
  
  const performResearch = async (query: string) => {
    // Call Supabase edge function
  };
  
  return { performResearch, isResearching, researchResults };
}
```

### 3.3 Integrate with Existing Features
- [ ] Add research option to job requirement analysis
- [ ] Enhance compensation analysis with market research
- [ ] Augment company research in Clarvida reports
- [ ] Add research citations to generated content

## Phase 4: Data Management (Week 4)

### 4.1 Database Schema Updates
```sql
-- Create research_results table
CREATE TABLE research_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  results JSONB NOT NULL,
  sources JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id)
);

-- Add indexes
CREATE INDEX idx_research_results_user_id ON research_results(user_id);
CREATE INDEX idx_research_results_job_id ON research_results(job_id);
```

### 4.2 Caching Strategy
- [ ] Implement Redis caching for research results
- [ ] Set appropriate TTL for different query types
- [ ] Create cache invalidation logic
- [ ] Monitor cache hit rates

## Phase 5: Advanced Features (Week 5-6)

### 5.1 Research Templates
- [ ] Create predefined research templates:
  - Market compensation research
  - Company culture research
  - Industry trends research
  - Competitor analysis
- [ ] Allow custom research prompts

### 5.2 Batch Research Operations
- [ ] Enable bulk research for multiple candidates
- [ ] Implement queue system for large research jobs
- [ ] Add progress tracking for batch operations

### 5.3 Research Analytics
- [ ] Track research usage metrics
- [ ] Analyze research quality and relevance
- [ ] Create research performance dashboard
- [ ] Implement feedback mechanism

## Implementation Details

### API Endpoints

```typescript
// Research Agent API
POST /research
{
  "query": "Senior React Developer salary ranges in San Francisco 2024",
  "max_iterations": 3,
  "include_sources": true
}

// Response
{
  "answer": "Based on my research...",
  "sources": [
    {
      "url": "https://example.com",
      "title": "2024 Tech Salary Report",
      "relevance_score": 0.95
    }
  ],
  "search_queries": ["React developer salary SF", ...],
  "confidence_score": 0.87
}
```

### Error Handling

```typescript
enum ResearchErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_QUERY = 'INVALID_QUERY',
  TIMEOUT = 'TIMEOUT',
  INSUFFICIENT_RESULTS = 'INSUFFICIENT_RESULTS'
}

interface ResearchError {
  code: ResearchErrorCode;
  message: string;
  retryAfter?: number;
}
```

### Security Considerations

1. **API Authentication**
   - Use Supabase JWT tokens
   - Implement API key rotation
   - Add request signing

2. **Rate Limiting**
   - Per-user limits: 100 requests/day
   - Per-organization limits: 1000 requests/day
   - Implement backoff strategy

3. **Data Privacy**
   - Anonymize queries in logs
   - Implement data retention policies
   - Add GDPR compliance features

## Testing Strategy

### Unit Tests
- [ ] Tool execution logic
- [ ] Error handling
- [ ] Response parsing
- [ ] Cache operations

### Integration Tests
- [ ] End-to-end API calls
- [ ] Supabase function integration
- [ ] Frontend component interaction
- [ ] Performance benchmarks

### User Acceptance Testing
- [ ] Beta test with select users
- [ ] Gather feedback on research quality
- [ ] Measure impact on recruitment outcomes
- [ ] A/B test research-enhanced vs standard search

## Deployment Checklist

### Pre-deployment
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation complete
- [ ] Backup strategy in place

### Deployment
- [ ] Deploy research agent to production
- [ ] Deploy Supabase functions
- [ ] Update frontend with feature flags
- [ ] Monitor error rates and performance

### Post-deployment
- [ ] Monitor usage metrics
- [ ] Gather user feedback
- [ ] Optimize based on real usage
- [ ] Plan iteration improvements

## Success Metrics

1. **Technical Metrics**
   - API response time < 5 seconds
   - 99.9% uptime
   - Cache hit rate > 60%
   - Error rate < 0.1%

2. **Business Metrics**
   - 50% of users activate research feature
   - 20% improvement in candidate match quality
   - 30% reduction in time to find candidates
   - 90% user satisfaction with research results

## Timeline Summary

- **Week 1**: Infrastructure setup and deployment
- **Week 2**: Tool integration and orchestration
- **Week 3**: Frontend integration
- **Week 4**: Data management and caching
- **Week 5-6**: Advanced features and optimization

## Next Steps

1. Review and approve roadmap
2. Set up development environment
3. Create project tracking board
4. Assign team members to phases
5. Begin Phase 1 implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-06-27
**Owner**: Engineering Team