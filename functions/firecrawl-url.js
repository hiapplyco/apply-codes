const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.firecrawlUrl = onRequest(
  {
    cors: true,
    invoker: 'public',
    timeoutSeconds: 300,
    memory: '1GiB'
  },
  async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    try {
      logger.info('Request method:', req.method);
      logger.info('Raw request body:', req.body);

      const { url } = req.body;
      logger.info('Starting scrape for URL:', url);

      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }

      const apiKey = process.env.FIRECRAWL_API_KEY;
      logger.info('API key present:', !!apiKey);

      if (!apiKey) {
        res.status(500).json({ error: 'Firecrawl API key not configured' });
        return;
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
          excludeTags: ['nav', 'header', 'footer', '.advertisement', '.ads'],
          includeTags: ['main', 'article', '.content', '#content', '.job-description', '.job-details']
        })
      });

      logger.info('Firecrawl response status:', firecrawlResponse.status);

      if (!firecrawlResponse.ok) {
        const errorText = await firecrawlResponse.text();
        logger.error('Firecrawl API error:', errorText);
        res.status(400).json({
          error: `Firecrawl API error: ${firecrawlResponse.status} - ${errorText}`
        });
        return;
      }

      const crawlResponse = await firecrawlResponse.json();
      logger.info('Crawl response received successfully');

      if (!crawlResponse.success || !crawlResponse.data) {
        res.status(400).json({ error: 'Failed to scrape URL - no data returned' });
        return;
      }

      const scrapedContent = crawlResponse.data.markdown;

      if (!scrapedContent) {
        res.status(400).json({ error: 'No content found on webpage' });
        return;
      }

      logger.info('Content successfully scraped, length:', scrapedContent.length);

      // Return the markdown content directly
      res.status(200).json({
        success: true,
        text: scrapedContent,
        rawContent: scrapedContent
      });

    } catch (error) {
      logger.error('Error in firecrawl-url function:', error);
      logger.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.stack || String(error)
      });
    }
  }
);