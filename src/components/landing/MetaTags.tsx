import { Helmet } from 'react-helmet-async';

const getAssetUrl = (path: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://app.apply.codes';
  return `${origin}${path}`;
};

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export const MetaTags = ({
  title = "Apply - AI-Powered Recruitment Platform | Find Better Candidates 40% Faster",
  description = "Transform your recruiting with Apply's AI-powered sourcing, automated screening, and 20+ integrations. Join 10,000+ recruiters finding better candidates faster. Start free trial.",
  keywords = "AI recruitment, recruitment platform, ATS integration, boolean search, candidate sourcing, talent acquisition, hiring software, HR tech, recruitment automation, Greenhouse integration, Lever integration",
  canonical = "https://www.apply.codes",
  ogImage = getAssetUrl('/assets/apply-logo.svg'),
  ogType = "website",
  twitterCard = "summary_large_image"
}: MetaTagsProps) => {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Apply" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Apply" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={canonical} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      <meta property="twitter:site" content="@applycodes" />
      <meta property="twitter:creator" content="@applycodes" />

      {/* Additional SEO Meta Tags */}
      <meta name="application-name" content="Apply" />
      <meta name="apple-mobile-web-app-title" content="Apply" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="theme-color" content="#8B5CF6" />

      {/* Verification Tags (add your actual verification codes) */}
      <meta name="google-site-verification" content="your-google-verification-code" />
      <meta name="msvalidate.01" content="your-bing-verification-code" />

      {/* Performance and Security */}
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="referrer" content="origin-when-cross-origin" />
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS Prefetch for performance */}
      <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    </Helmet>
  );
};
