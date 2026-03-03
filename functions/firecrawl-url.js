const { onCall, HttpsError } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.firecrawlUrl = onCall(
  {
    timeoutSeconds: 300,
    memory: '1GiB',
  },
  async (request) => {
    const { data, auth } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    try {
      const { url } = data;
      logger.info('Starting scrape for URL:', url);

      if (!url) {
        throw new HttpsError('invalid-argument', 'URL is required');
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      logger.info('API key present:', !!apiKey);

      if (!apiKey) {
        throw new HttpsError('unavailable', 'Firecrawl API key not configured');
      }

      // Use the direct Firecrawl API v1 endpoint
      logger.info('Making request to Firecrawl API...');
      const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url,
          formats: ['markdown'],
          onlyMainContent: true,
          blockAds: true,
          removeBase64Images: true,
          timeout: 30000,
          excludeTags: ['nav', 'header', 'footer', '.advertisement', '.ads', 'script', 'style']
          // Note: Removed includeTags to allow scraping any page content
        })
      });

      logger.info('Firecrawl response status:', firecrawlResponse.status);

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text();
        logger.error('Firecrawl API error:', errorText);
        throw new HttpsError('internal', `Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`);
      }

      const crawlResponse = await firecrawlResponse.json();
      logger.info('Crawl response received successfully');

      if (!crawlResponse.success || !crawlResponse.data) {
        throw new HttpsError('internal', 'Failed to scrape URL - no data returned');
      }

      const scrapedContent = crawlResponse.data.markdown;

      if (!scrapedContent) {
        throw new HttpsError('internal', 'No content found on webpage');
      }

      logger.info('Content successfully scraped, length:', scrapedContent.length);

      // Return the markdown content directly
      return {
        success: true,
        text: scrapedContent,
        rawContent: scrapedContent
      };

    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Error in firecrawl-url function:', error);
      throw new HttpsError('internal', error.message || 'Unknown error occurred');
    }
  }
);
