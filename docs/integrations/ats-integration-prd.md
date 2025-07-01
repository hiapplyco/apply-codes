# ATS Integration PRD - Apply.codes Platform

## Executive Summary

This document outlines the product requirements for building a comprehensive ATS integration page within the apply.codes platform. The integration will support major ATS providers (Lever, Greenhouse, Rippling, Jobvite, HireEZ) and enable seamless data synchronization, content generation, and analytics capabilities.

## 1. Project Overview

### 1.1 Objectives
- Create a unified integration hub for connecting with existing ATS platforms
- Enable bi-directional data synchronization for recruitment workflows
- Support content generation and data analysis capabilities
- Provide both traditional API and MCP (Model Context Protocol) access
- Ensure enterprise-grade security and compliance

### 1.2 Key Stakeholders
- **Development Team**: Implementation and maintenance
- **Product Team**: Feature prioritization and user experience
- **Customer Success**: Client onboarding and support
- **Security Team**: Compliance and data protection

## 2. Technical Architecture

### 2.1 High-Level Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Apply.codes   │────▶│  Integration Hub │────▶│   ATS Systems   │
│    Platform     │◀────│   (API Gateway)  │◀────│ (Lever, etc.)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  MCP Interface  │     │  Webhook Handler │     │   Data Store    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### 2.2 Core Components
1. **API Gateway**: Central routing and authentication layer
2. **Integration Adapters**: ATS-specific connection modules
3. **Data Synchronization Engine**: Real-time and batch sync capabilities
4. **Webhook Processor**: Event-driven updates handler
5. **MCP Connector**: Model Context Protocol interface
6. **Analytics Engine**: Data processing and insights generation

## 3. ATS Integration Specifications

### 3.1 Lever Integration

#### Authentication
- **Method**: API Key (HTTP Basic Auth)
- **Implementation**: Store encrypted API keys per customer
- **Permissions**: Request granular endpoint permissions

#### Core Endpoints to Implement
```javascript
// Required endpoints
GET    /v1/candidates
POST   /v1/candidates
GET    /v1/opportunities
POST   /v1/opportunities
GET    /v1/jobs
GET    /v1/stages
POST   /v1/notes
GET    /v1/sources
```

#### Data Sync Features
- Real-time candidate status updates via webhooks
- Batch synchronization for job postings (hourly)
- Bi-directional note and activity logging

### 3.2 Greenhouse Integration

#### Authentication
- **Method**: API Key (HTTP Header)
- **Implementation**: Harvest API for recruiting data
- **Rate Limits**: 100 requests/minute

#### Core Endpoints to Implement
```javascript
// Required endpoints
GET    /v1/jobs
GET    /v1/candidates
POST   /v1/candidates
GET    /v1/applications
POST   /v1/applications/{id}/advance
GET    /v1/scorecards
POST   /v1/notes
```

#### Data Sync Features
- Custom field mapping for client-specific data
- Scorecard integration for AI-powered analysis
- Application stage progression tracking

### 3.3 Rippling Integration

#### Authentication
- **Method**: OAuth 2.0
- **Implementation**: OAuth flow with refresh token management
- **Scopes**: employees:read, jobs:write, org:read

#### Core Endpoints to Implement
```javascript
// Required endpoints
GET    /v1/employees
GET    /v1/jobs
POST   /v1/jobs
GET    /v1/departments
GET    /v1/custom-fields
POST   /v1/candidates
```

#### Data Sync Features
- Employee-to-candidate conversion workflows
- Organizational hierarchy synchronization
- Custom field mapping for HRIS data

### 3.4 Jobvite Integration

#### Authentication
- **Method**: API Token
- **Implementation**: Bearer token in headers
- **Rate Limits**: 60 requests/minute

#### Core Endpoints to Implement
```javascript
// Required endpoints
GET    /v2/candidates
POST   /v2/candidates
GET    /v2/job
GET    /v2/requisition
POST   /v2/application
GET    /v2/interview
```

#### Data Sync Features
- Interview scheduling synchronization
- Requisition-to-job mapping
- Candidate communication tracking

### 3.5 HireEZ Integration

#### Authentication
- **Method**: Bearer Token
- **Implementation**: API key management system
- **Focus**: Sourcing and engagement

#### Core Endpoints to Implement
```javascript
// Required endpoints
POST   /v1/talent/search
GET    /v1/projects
POST   /v1/projects/{id}/export
GET    /v1/contacts
POST   /v1/engagement/campaigns
```

#### Data Sync Features
- Talent pool synchronization
- Engagement campaign tracking
- Export to ATS automation

## 4. MCP (Model Context Protocol) Integration

### 4.1 MCP Server Implementation
```javascript
// MCP server configuration
{
  "name": "apply-codes-ats-mcp",
  "version": "1.0.0",
  "description": "MCP server for ATS integrations",
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": true
  }
}
```

### 4.2 MCP Tools to Expose
1. **candidate_search**: Search across all connected ATS systems
2. **job_analysis**: Analyze job requirements and match candidates
3. **content_generation**: Generate job descriptions and candidate communications
4. **pipeline_analytics**: Analyze recruitment funnel metrics
5. **bulk_operations**: Perform batch updates across systems

### 4.3 MCP Resources
- Candidate profiles with enriched data
- Job posting templates
- Analytics dashboards
- Integration status and health metrics

## 5. Core Features Implementation

### 5.1 Universal Search
- Implement unified search across all connected ATS platforms
- Support for complex queries with filters
- Real-time result aggregation

### 5.2 Content Generation Engine
```javascript
// Content generation API
POST /api/content/generate
{
  "type": "job_description",
  "context": {
    "role": "Software Engineer",
    "company": "TechCorp",
    "requirements": ["Python", "AWS", "React"]
  }
}
```

### 5.3 Analytics Dashboard
- Time-to-hire metrics
- Source effectiveness analysis
- Candidate pipeline visualization
- Drop-off rate analysis
- Diversity metrics

### 5.4 Webhook Management
```javascript
// Webhook registration endpoint
POST /api/webhooks/register
{
  "ats": "lever",
  "events": ["candidate.created", "application.updated"],
  "callback_url": "https://apply.codes/webhooks/lever"
}
```

## 6. Security & Compliance

### 6.1 Authentication & Authorization
- Implement OAuth 2.0 for user authentication
- API key management with rotation policies
- Role-based access control (RBAC)
- IP whitelisting for enterprise clients

### 6.2 Data Protection
- End-to-end encryption for data in transit (TLS 1.3)
- AES-256 encryption for data at rest
- PII data anonymization capabilities
- Data retention policies per client requirements

### 6.3 Compliance Requirements
- GDPR compliance with right to erasure
- CCPA compliance for California residents
- SOC 2 Type II certification readiness
- EEOC compliance for US clients

### 6.4 Audit & Monitoring
```javascript
// Audit log structure
{
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user_123",
  "action": "candidate.updated",
  "ats": "greenhouse",
  "changes": {...},
  "ip_address": "192.168.1.1"
}
```

## 7. Error Handling & Reliability

### 7.1 Retry Logic
```javascript
// Exponential backoff implementation
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};
```

### 7.2 Circuit Breaker Pattern
- Implement circuit breakers for each ATS integration
- Auto-disable failing integrations after threshold
- Health check endpoints for monitoring

### 7.3 Error Categorization
1. **Transient Errors**: Network issues, rate limits
2. **Authentication Errors**: Invalid credentials, expired tokens
3. **Data Errors**: Validation failures, missing required fields
4. **System Errors**: ATS downtime, maintenance windows

## 8. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
- [ ] Set up API Gateway infrastructure
- [ ] Implement authentication service
- [ ] Create base integration framework
- [ ] Set up monitoring and logging

### Phase 2: Core Integrations (Weeks 5-12)
- [ ] Week 5-6: Lever integration
- [ ] Week 7-8: Greenhouse integration
- [ ] Week 9-10: Rippling integration
- [ ] Week 11-12: Jobvite and HireEZ integrations

### Phase 3: Advanced Features (Weeks 13-16)
- [ ] Universal search implementation
- [ ] Content generation engine
- [ ] Analytics dashboard
- [ ] MCP server development

### Phase 4: Polish & Launch (Weeks 17-20)
- [ ] Security audit and fixes
- [ ] Performance optimization
- [ ] Documentation and API reference
- [ ] Beta testing with select clients

## 9. API Documentation Structure

### 9.1 REST API Endpoints
```yaml
openapi: 3.0.0
info:
  title: Apply.codes ATS Integration API
  version: 1.0.0
paths:
  /api/v1/candidates:
    get:
      summary: Search candidates across all ATS
      parameters:
        - name: query
          in: query
          schema:
            type: string
        - name: ats
          in: query
          schema:
            type: array
            items:
              type: string
```

### 9.2 MCP Protocol Documentation
- Tool definitions with JSON Schema
- Resource specifications
- Authentication flow
- Example implementations

## 10. Success Metrics

### 10.1 Technical KPIs
- API response time < 200ms (p95)
- Sync latency < 5 seconds for real-time updates
- 99.9% uptime SLA
- Zero data loss guarantee

### 10.2 Business KPIs
- Number of active integrations per customer
- Data points synchronized per day
- Content pieces generated
- Time saved per recruiter

### 10.3 User Experience Metrics
- Integration setup time < 10 minutes
- Error rate < 0.1%
- Customer satisfaction score > 4.5/5

## 11. Technical Requirements

### 11.1 Infrastructure
- **Hosting**: AWS/GCP with multi-region support
- **Database**: PostgreSQL for relational data, Redis for caching
- **Message Queue**: RabbitMQ/AWS SQS for async processing
- **Monitoring**: DataDog/New Relic for APM

### 11.2 Development Stack
```javascript
// Recommended tech stack
{
  "backend": {
    "language": "Node.js/TypeScript",
    "framework": "NestJS",
    "orm": "TypeORM"
  },
  "api": {
    "gateway": "Kong/AWS API Gateway",
    "documentation": "OpenAPI 3.0"
  },
  "testing": {
    "unit": "Jest",
    "integration": "Supertest",
    "e2e": "Cypress"
  }
}
```

## 12. Support & Maintenance

### 12.1 Developer Resources
- Comprehensive API documentation
- Interactive API playground
- Sample code in multiple languages
- Video tutorials and guides

### 12.2 Customer Support
- Integration setup assistance
- Troubleshooting guides
- Status page for real-time updates
- Priority support for enterprise clients

## Appendix A: Data Models

### Candidate Schema
```typescript
interface Candidate {
  id: string;
  email: string;
  name: {
    first: string;
    last: string;
  };
  phone?: string;
  resume?: {
    url: string;
    parsedData: object;
  };
  source: string;
  atsData: {
    [atsName: string]: {
      id: string;
      lastSynced: Date;
      customFields: object;
    };
  };
}
```

### Job Schema
```typescript
interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  department: string;
  location: string;
  atsData: {
    [atsName: string]: {
      id: string;
      status: 'open' | 'closed' | 'draft';
      customFields: object;
    };
  };
}
```

## Appendix B: Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| ATS001 | Authentication failed | Check API credentials |
| ATS002 | Rate limit exceeded | Implement backoff |
| ATS003 | Invalid data format | Validate request payload |
| ATS004 | ATS service unavailable | Retry with exponential backoff |
| ATS005 | Insufficient permissions | Request additional scopes |

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Q2 2025