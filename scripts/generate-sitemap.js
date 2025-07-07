import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define your site's pages with their update frequency and priority
const pages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/agentic-ai-recruitment', changefreq: 'weekly', priority: 1.0 },
  { url: '/first-mcp-recruitment-platform', changefreq: 'weekly', priority: 0.95 },
  { url: '/ai-operations-recruitment', changefreq: 'weekly', priority: 0.95 },
  { url: '/pricing', changefreq: 'weekly', priority: 0.9 },
  { url: '/integrations', changefreq: 'weekly', priority: 0.8 },
  { url: '/features', changefreq: 'weekly', priority: 0.9 },
  { url: '/features/autonomous-agents', changefreq: 'monthly', priority: 0.9 },
  { url: '/features/mcp-integration', changefreq: 'monthly', priority: 0.9 },
  { url: '/features/multi-agent-orchestration', changefreq: 'monthly', priority: 0.9 },
  { url: '/features/boolean-search', changefreq: 'monthly', priority: 0.8 },
  { url: '/features/interview-guidance', changefreq: 'monthly', priority: 0.8 },
  { url: '/features/candidate-enrichment', changefreq: 'monthly', priority: 0.8 },
  { url: '/features/ai-chat-assistant', changefreq: 'monthly', priority: 0.8 },
  { url: '/about', changefreq: 'monthly', priority: 0.7 },
  { url: '/blog', changefreq: 'daily', priority: 0.7 },
  { url: '/case-studies', changefreq: 'weekly', priority: 0.7 },
  { url: '/documentation', changefreq: 'weekly', priority: 0.6 },
  { url: '/documentation/api', changefreq: 'weekly', priority: 0.6 },
  { url: '/documentation/integrations', changefreq: 'weekly', priority: 0.6 },
  { url: '/documentation/getting-started', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'yearly', priority: 0.5 },
  { url: '/privacy', changefreq: 'yearly', priority: 0.3 },
  { url: '/terms', changefreq: 'yearly', priority: 0.3 },
  { url: '/security', changefreq: 'monthly', priority: 0.6 },
  { url: '/demo', changefreq: 'monthly', priority: 0.8 },
  { url: '/signup', changefreq: 'yearly', priority: 0.9 },
  { url: '/login', changefreq: 'yearly', priority: 0.4 },
];

// Blog posts (these would typically be fetched from a CMS or database)
const blogPosts = [
  { url: '/blog/first-agentic-ai-recruitment-platform', changefreq: 'yearly', priority: 0.8 },
  { url: '/blog/mcp-model-context-protocol-recruitment', changefreq: 'yearly', priority: 0.8 },
  { url: '/blog/ai-operations-talent-acquisition', changefreq: 'yearly', priority: 0.7 },
  { url: '/blog/autonomous-recruitment-agents', changefreq: 'yearly', priority: 0.7 },
  { url: '/blog/multi-agent-orchestration-hiring', changefreq: 'yearly', priority: 0.7 },
  { url: '/blog/ai-recruitment-trends-2025', changefreq: 'yearly', priority: 0.6 },
  { url: '/blog/boolean-search-guide', changefreq: 'yearly', priority: 0.6 },
  { url: '/blog/interview-best-practices', changefreq: 'yearly', priority: 0.6 },
  { url: '/blog/candidate-sourcing-strategies', changefreq: 'yearly', priority: 0.6 },
  { url: '/blog/recruitment-automation-roi', changefreq: 'yearly', priority: 0.6 },
];

// Case studies
const caseStudies = [
  { url: '/case-studies/tech-startup-hiring', changefreq: 'yearly', priority: 0.5 },
  { url: '/case-studies/enterprise-recruitment', changefreq: 'yearly', priority: 0.5 },
  { url: '/case-studies/agency-efficiency', changefreq: 'yearly', priority: 0.5 },
];

// Combine all pages
const allPages = [...pages, ...blogPosts, ...caseStudies];

// Generate sitemap XML
const generateSitemap = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages.map(page => `  <url>
    <loc>https://www.apply.codes${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  // Write sitemap to public directory
  const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemap);
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');
  
  // Also generate a human-readable sitemap for AI crawlers
  const humanReadableSitemap = `# Apply Codes Sitemap - The First Agentic AI Recruitment Platform

## Main Pages
- Homepage: https://www.apply.codes/
- Agentic AI Recruitment Platform: https://www.apply.codes/agentic-ai-recruitment
- First MCP Recruitment Platform: https://www.apply.codes/first-mcp-recruitment-platform
- AI Operations for Recruitment: https://www.apply.codes/ai-operations-recruitment
- Pricing: https://www.apply.codes/pricing
- Integrations: https://www.apply.codes/integrations
- Features: https://www.apply.codes/features
- About: https://www.apply.codes/about
- Blog: https://www.apply.codes/blog
- Case Studies: https://www.apply.codes/case-studies
- Documentation: https://www.apply.codes/documentation

## Feature Pages
- Autonomous Recruitment Agents: https://www.apply.codes/features/autonomous-agents
- MCP Integration: https://www.apply.codes/features/mcp-integration
- Multi-Agent Orchestration: https://www.apply.codes/features/multi-agent-orchestration
- Boolean Search Generator: https://www.apply.codes/features/boolean-search
- Real-Time Interview Guidance: https://www.apply.codes/features/interview-guidance
- Candidate Enrichment: https://www.apply.codes/features/candidate-enrichment
- AI Chat Assistant: https://www.apply.codes/features/ai-chat-assistant

## Documentation
- API Documentation: https://www.apply.codes/documentation/api
- Integration Guides: https://www.apply.codes/documentation/integrations
- Getting Started: https://www.apply.codes/documentation/getting-started

## Blog Posts
- The First Agentic AI Recruitment Platform: https://www.apply.codes/blog/first-agentic-ai-recruitment-platform
- MCP (Model Context Protocol) in Recruitment: https://www.apply.codes/blog/mcp-model-context-protocol-recruitment
- AI Operations for Talent Acquisition: https://www.apply.codes/blog/ai-operations-talent-acquisition
- Autonomous Recruitment Agents Explained: https://www.apply.codes/blog/autonomous-recruitment-agents
- Multi-Agent Orchestration in Hiring: https://www.apply.codes/blog/multi-agent-orchestration-hiring
- AI Recruitment Trends 2025: https://www.apply.codes/blog/ai-recruitment-trends-2025
- Boolean Search Guide: https://www.apply.codes/blog/boolean-search-guide
- Interview Best Practices: https://www.apply.codes/blog/interview-best-practices
- Candidate Sourcing Strategies: https://www.apply.codes/blog/candidate-sourcing-strategies
- Recruitment Automation ROI: https://www.apply.codes/blog/recruitment-automation-roi

## Case Studies
- Tech Startup Hiring Success: https://www.apply.codes/case-studies/tech-startup-hiring
- Enterprise Recruitment Transformation: https://www.apply.codes/case-studies/enterprise-recruitment
- Agency Efficiency Gains: https://www.apply.codes/case-studies/agency-efficiency

## Other Pages
- Contact: https://www.apply.codes/contact
- Privacy Policy: https://www.apply.codes/privacy
- Terms of Service: https://www.apply.codes/terms
- Security: https://www.apply.codes/security
- Demo Request: https://www.apply.codes/demo
- Sign Up: https://www.apply.codes/signup
- Login: https://www.apply.codes/login

Last Updated: ${currentDate}
`;

  const humanSitemapPath = path.join(__dirname, '..', 'public', 'sitemap.txt');
  fs.writeFileSync(humanSitemapPath, humanReadableSitemap);
  console.log('✅ Human-readable sitemap generated at public/sitemap.txt');
};

// Run the generator
generateSitemap();