import { Helmet } from 'react-helmet-async';

interface StructuredDataProps {
  type?: 'Organization' | 'SoftwareApplication' | 'FAQPage';
}

export const StructuredData = ({ type = 'Organization' }: StructuredDataProps) => {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Apply",
    "url": "https://www.apply.codes",
    "logo": "https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/APPLYFullwordlogo2025.png",
    "description": "AI-powered recruitment platform that helps modern hiring teams find better candidates 40% faster through intelligent sourcing, screening, and 20+ integrations.",
    "sameAs": [
      "https://twitter.com/applycodes",
      "https://www.linkedin.com/company/apply-codes",
      "https://github.com/hiapplyco"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-123-4567",
      "contactType": "customer support",
      "email": "support@apply.codes",
      "availableLanguage": ["English"]
    }
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Apply Recruitment Platform",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": "2025-12-31",
      "description": "14-day free trial"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "2341",
      "bestRating": "5",
      "worstRating": "1"
    },
    "screenshot": "https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/screenshots/apply-dashboard.png",
    "featureList": [
      "AI-powered boolean search generation",
      "Automated candidate screening",
      "20+ ATS and HRIS integrations",
      "Contact enrichment with Nymeria",
      "AI chat assistant for recruitment",
      "Video interview scheduling",
      "Bulk operations",
      "Real-time analytics"
    ],
    "softwareVersion": "2.0",
    "publisher": {
      "@type": "Organization",
      "name": "Apply",
      "url": "https://www.apply.codes"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Apply and how does it help with recruitment?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply is an AI-powered recruitment platform that helps hiring teams find qualified candidates 40% faster. It uses artificial intelligence to generate boolean searches, screen resumes, enrich contact information, and integrate with 20+ ATS and HRIS systems."
        }
      },
      {
        "@type": "Question",
        "name": "How many integrations does Apply support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply supports over 20 integrations including popular ATS systems like Greenhouse and Lever, HRIS platforms like Workday and BambooHR, and data enrichment tools like Nymeria and Hunter.io. All integrations feature two-way sync and can be set up in 5 minutes."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a free trial available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Apply offers a 14-day free trial with full access to all features. No credit card is required to start your trial."
        }
      },
      {
        "@type": "Question",
        "name": "How does the AI-powered boolean search work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Apply's AI analyzes your job requirements and automatically generates complex boolean search strings that find the most relevant candidates across multiple platforms. It understands synonyms, related skills, and industry-specific terminology to maximize your search results."
        }
      },
      {
        "@type": "Question",
        "name": "Is Apply secure and compliant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Apply is SOC 2 compliant and follows industry best practices for data security. All data is encrypted in transit and at rest, and we maintain strict access controls and regular security audits."
        }
      }
    ]
  };

  const schemas = {
    Organization: organizationSchema,
    SoftwareApplication: softwareApplicationSchema,
    FAQPage: faqSchema
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemas[type])}
      </script>
    </Helmet>
  );
};