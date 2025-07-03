
import { supabase } from "@/integrations/supabase/client";

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  text: string;
  rawContent?: string;
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

interface CrawlOptions {
  projectId?: string;
  context?: 'sourcing' | 'job-posting' | 'search' | 'kickoff' | 'general';
  saveToProject?: boolean;
}

export class FirecrawlService {
  static async crawlWebsite(url: string, options?: CrawlOptions): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        return { success: false, error: 'Authentication required' };
      }

      console.log('Making request to firecrawl-url function with URL:', url);
      console.log('Using session token:', session.access_token ? 'Token present' : 'No token');
      
      const { data: response, error: functionError } = await supabase.functions.invoke<CrawlResponse>('firecrawl-url', {
        body: { url }
      });

      console.log('Function response:', response);
      console.log('Function error:', functionError);

      if (functionError) {
        console.error('Error calling Firecrawl:', functionError);
        return { success: false, error: `Function error: ${functionError.message}` };
      }

      console.log('Received response from firecrawl-url function:', response);

      if (!response) {
        return { success: false, error: 'No response received from server' };
      }

      // Type guard to handle the error case
      if ('error' in response && !response.success) {
        return { success: false, error: response.error };
      }

      // Store the crawl summary in kickoff_summaries (legacy)
      const { error: summaryError } = await supabase
        .from('kickoff_summaries')
        .insert({
          content: response.text,
          source: `url:${url}`,
          user_id: session.user.id
        });

      if (summaryError) {
        console.error('Error storing summary:', summaryError);
      }

      // Store in project if options are provided
      if (options?.projectId && options?.saveToProject !== false) {
        const { error: projectError } = await supabase
          .from('project_scraped_data')
          .insert({
            project_id: options.projectId,
            user_id: session.user.id,
            url,
            summary: response.text,
            raw_content: response.rawContent,
            context: options.context || 'general',
            metadata: {
              scraped_at: new Date().toISOString(),
              source: 'firecrawl'
            }
          });

        if (projectError) {
          console.error('Error storing in project:', projectError);
        }
      }

      return { 
        success: true, 
        data: { 
          text: response.text,
          rawContent: response.rawContent 
        } 
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  // Helper method to get scraped data for a project
  static async getProjectScrapedData(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('project_scraped_data')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project scraped data:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getProjectScrapedData:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch scraped data' 
      };
    }
  }
}
