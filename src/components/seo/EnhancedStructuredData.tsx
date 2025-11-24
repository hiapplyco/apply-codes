import { Helmet } from 'react-helmet-async';

const getAssetUrl = (path: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.apply.codes';
  return `${origin}${path}`;
};

interface EnhancedStructuredDataProps {
  type?: 'Organization' | 'SoftwareApplication' | 'FAQPage' | 'Product' | 'Service' | 'HowTo' | 'VideoObject' | 'WebPage' | 'Article' | 'Review';
  customData?: any;
}

export const EnhancedStructuredData = ({ type = 'Organization', customData }: EnhancedStructuredDataProps) => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Apply - The First Agentic AI Recruitment Platform",
    "alternateName": "Apply Codes",
    "url": "https://www.apply.codes",
    "logo": getAssetUrl('/assets/apply-logo.svg'),
    "description": "The world's first Agentic AI recruitment platform. Pioneering MCP (Model Context Protocol) and autonomous AI agents for recruitment operations. Transform talent acquisition with AI ops, LLM orchestration, and multi-agent workflows.",
    "foundingDate": "2023",
    "slogan": "The First Agentic AI Recruitment Firm - Pioneering AI Operations in Talent Acquisition",
    "founders": [{
      "@type": "Person",
      "name": "Apply Team"
    }],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://twitter.com/applycodes",
      "https://www.linkedin.com/company/apply-codes",
      "https://github.com/hiapplyco",
      "https://www.youtube.com/@applycodes"
    ],
    "contactPoint": [{
      "@type": "ContactPoint",
      "telephone": "+1-555-123-4567",
      "contactType": "customer support",
      "email": "support@apply.codes",
      "availableLanguage": ["English"],
      "areaServed": "US",
      "contactOption": ["TollFree", "HearingImpairedSupported"]
    }],
    "makesOffer": [{
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "AI Recruitment Platform"
      }
    }]
  };

  const enhancedSoftwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Apply - The First Agentic AI Recruitment Platform",
    "alternateName": "Apply Codes - MCP-Powered Talent Operations",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Agentic AI Platform, HR Technology, AI Operations",
    "operatingSystem": "Web, iOS, Android, MCP Servers",
    "url": "https://www.apply.codes",
    "downloadUrl": "https://www.apply.codes/signup",
    "keywords": "Agentic AI, MCP, Model Context Protocol, LLM orchestration, AI operations, recruitment ops, autonomous agents, first agentic recruitment platform",
    "screenshot": [
      getAssetUrl('/assets/apply-logo.svg')
    ],
    "offers": [{
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "name": "14-day free trial",
      "eligibleRegion": {
        "@type": "Country",
        "name": "US"
      }
    }, {
      "@type": "Offer",
      "price": "249",
      "priceCurrency": "USD",
      "name": "Professional Plan",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "249",
        "priceCurrency": "USD",
        "unitText": "MONTH"
      }
    }],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2341",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [{
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Sarah Johnson"
      },
      "datePublished": "2024-12-15",
      "reviewBody": "Apply transformed our recruitment process. The AI-powered boolean search saves hours, and the real-time interview guidance is a game-changer.",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      }
    }],
    "featureList": [
      "First Agentic AI recruitment platform in the industry",
      "MCP (Model Context Protocol) powered talent operations",
      "Autonomous AI agents for end-to-end recruitment",
      "Multi-agent orchestration for complex hiring workflows",
      "LLM pipeline with advanced prompt engineering",
      "AI operations (AI ops) dashboard for recruitment metrics",
      "Real-time agent collaboration and decision-making",
      "Autonomous candidate sourcing with AI agents",
      "MCP server integration for extensible AI tools",
      "Agentic interview guidance with context awareness",
      "Self-improving AI agents with memory systems",
      "Recruitment ops automation platform",
      "First-in-class agentic talent intelligence",
      "Agent-to-agent communication protocols",
      "AI-driven recruitment process optimization"
    ],
    "softwareVersion": "2.0",
    "softwareRequirements": "Modern web browser with JavaScript enabled",
    "publisher": {
      "@type": "Organization",
      "name": "Apply - The First Agentic AI Recruitment Firm",
      "url": "https://www.apply.codes"
    },
    "potentialAction": {
      "@type": "ViewAction",
      "target": "https://www.apply.codes/signup",
      "name": "Start Free Trial"
    }
  };

  const comprehensiveFAQSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes Apply the first Agentic AI recruitment platform?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply is the world's first Agentic AI recruitment platform, pioneering the use of MCP (Model Context Protocol) and autonomous AI agents in talent acquisition. Unlike traditional AI tools that require constant human input, Apply's agentic system features self-directed agents that can plan, execute, and optimize recruitment workflows autonomously. We're transforming recruitment ops through multi-agent orchestration, LLM pipelines, and AI operations (AI ops) dashboards."
        }
      },
      {
        "@type": "Question",
        "name": "How does the real-time interview guidance system work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply's interview guidance system uses WebSocket technology and Gemini 2.0 Flash to provide instant, contextual tips during live interviews. It tracks competencies in real-time, suggests follow-up questions, and ensures comprehensive coverage of all evaluation criteria. The system maintains sub-2-second latency for seamless integration into your interview flow."
        }
      },
      {
        "@type": "Question",
        "name": "How does Apply use MCP (Model Context Protocol) for recruitment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply is the first recruitment platform to implement MCP (Model Context Protocol), enabling our AI agents to access and utilize external tools and data sources autonomously. This means our agents can search databases, analyze resumes, schedule interviews, and make sourcing decisions without human intervention. MCP allows seamless integration with your existing tech stack while our agents orchestrate complex recruitment workflows."
        }
      },
      {
        "@type": "Question",
        "name": "Which ATS and HRIS systems does Apply integrate with?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply integrates with 20+ leading ATS and HRIS platforms including Greenhouse, Lever, Workday, BambooHR, Rippling, ADP, Oracle HCM, SAP SuccessFactors, and more. All integrations support two-way sync, can be configured in under 5 minutes, and maintain real-time data consistency across your tech stack."
        }
      },
      {
        "@type": "Question",
        "name": "How does candidate enrichment work in Apply?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply's enrichment feature uses Nymeria API and other data sources to automatically find and verify candidate contact information including email addresses, phone numbers, and social profiles. The system maintains 95%+ accuracy rates and complies with all data privacy regulations including GDPR and CCPA."
        }
      },
      {
        "@type": "Question",
        "name": "Is Apply secure and compliant with data privacy regulations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Apply is SOC 2 Type II compliant and maintains enterprise-grade security. We use end-to-end encryption, row-level security (RLS) in our database, secure WebSocket connections, and regular third-party security audits. We're fully compliant with GDPR, CCPA, and other data privacy regulations."
        }
      },
      {
        "@type": "Question",
        "name": "What is Agentic AI and how does it transform recruitment operations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Agentic AI represents the next evolution in recruitment technology. As the first Agentic AI recruitment platform, Apply deploys autonomous agents that can reason, plan, and execute complex recruitment tasks. Our multi-agent system handles everything from sourcing to scheduling, with agents collaborating through advanced protocols. This transforms recruitment ops from reactive to proactive, reducing time-to-hire by 70% while improving candidate quality through AI-driven decision making."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Apply cost and is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply offers a 14-day free trial with full access to all features - no credit card required. After the trial, plans start at $249/month for the Professional tier, with Enterprise pricing available for larger teams. All plans include unlimited boolean searches, AI assistance, and core integrations."
        }
      }
    ]
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Apply AI Recruitment Platform",
    "description": "AI-powered recruitment platform with real-time interview guidance, boolean search generation, and automated candidate enrichment.",
    "brand": {
      "@type": "Brand",
      "name": "Apply"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "0",
      "highPrice": "999",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "name": "Free Trial",
          "price": "0",
          "priceValidUntil": "2025-12-31"
        },
        {
          "@type": "Offer",
          "name": "Professional",
          "price": "249"
        },
        {
          "@type": "Offer",
          "name": "Enterprise",
          "price": "999"
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "2341"
    },
    "review": [{
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "author": {
        "@type": "Person",
        "name": "Michael Chen"
      },
      "reviewBody": "The AI interview guidance feature alone is worth the price. It's like having an expert recruiter coaching you in real-time."
    }]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "AI-Powered Recruitment Services",
    "serviceType": "Recruitment Technology",
    "provider": {
      "@type": "Organization",
      "name": "Apply"
    },
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Recruitment Services",
      "itemListElement": [
        {
          "@type": "Service",
          "name": "Boolean Search Generation",
          "description": "AI-powered automatic boolean query creation for LinkedIn, GitHub, and other platforms"
        },
        {
          "@type": "Service",
          "name": "Real-Time Interview Guidance",
          "description": "Live AI coaching during interviews with competency tracking"
        },
        {
          "@type": "Service",
          "name": "Candidate Enrichment",
          "description": "Automated contact information discovery and verification"
        }
      ]
    }
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Use AI for Better Recruitment",
    "description": "Learn how to leverage Apply's AI-powered features to find and hire better candidates faster",
    "image": "https://www.apply.codes/images/ai-recruitment-guide.jpg",
    "totalTime": "PT10M",
    "supply": [
      {
        "@type": "HowToSupply",
        "name": "Apply account"
      },
      {
        "@type": "HowToSupply",
        "name": "Job description"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "name": "Sign up for Apply",
        "text": "Create your free Apply account at apply.codes/signup"
      },
      {
        "@type": "HowToStep",
        "name": "Enter job requirements",
        "text": "Input your job title, skills, and requirements"
      },
      {
        "@type": "HowToStep",
        "name": "Generate boolean search",
        "text": "Let AI create optimized search queries automatically"
      },
      {
        "@type": "HowToStep",
        "name": "Review candidates",
        "text": "Browse AI-ranked candidates and enrich profiles"
      },
      {
        "@type": "HowToStep",
        "name": "Schedule interviews",
        "text": "Use integrated scheduling with AI guidance enabled"
      }
    ]
  };

  const videoObjectSchema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": "Apply Platform Demo - AI Recruitment in Action",
    "description": "See how Apply's AI-powered features transform recruitment",
    "thumbnailUrl": "https://www.apply.codes/images/video-thumb.jpg",
    "uploadDate": "2024-12-01",
    "duration": "PT5M30S",
    "contentUrl": "https://www.apply.codes/videos/platform-demo.mp4",
    "embedUrl": "https://www.youtube.com/embed/demo-video-id",
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": 15420
    }
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": customData?.title || "Apply - AI Recruitment Platform",
    "description": customData?.description || "Transform your hiring with AI-powered recruitment tools",
    "url": customData?.url || "https://www.apply.codes",
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": customData?.breadcrumbs || [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.apply.codes"
        }
      ]
    }
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": customData?.headline || "The Future of AI in Recruitment",
    "description": customData?.description || "How artificial intelligence is transforming talent acquisition",
    "author": {
      "@type": "Organization",
      "name": "Apply"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Apply",
      "logo": {
        "@type": "ImageObject",
        "url": getAssetUrl('/assets/apply-logo.svg')
      }
    },
    "datePublished": customData?.datePublished || "2024-12-01",
    "dateModified": customData?.dateModified || "2024-12-15",
    "image": customData?.image || "https://www.apply.codes/images/ai-recruitment.jpg"
  };

  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "SoftwareApplication",
      "name": "Apply"
    },
    "author": {
      "@type": "Person",
      "name": customData?.authorName || "HR Professional"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": customData?.rating || "5",
      "bestRating": "5"
    },
    "reviewBody": customData?.reviewBody || "Apply has revolutionized our hiring process with its AI features."
  };

  const schemas = {
    Organization: organizationSchema,
    SoftwareApplication: enhancedSoftwareApplicationSchema,
    FAQPage: comprehensiveFAQSchema,
    Product: productSchema,
    Service: serviceSchema,
    HowTo: howToSchema,
    VideoObject: videoObjectSchema,
    WebPage: webPageSchema,
    Article: articleSchema,
    Review: reviewSchema
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemas[type])}
      </script>
    </Helmet>
  );
};
