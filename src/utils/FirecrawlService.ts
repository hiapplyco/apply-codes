
import { auth, db } from "@/lib/firebase";
import { functionBridge } from "@/lib/function-bridge";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "firebase/firestore";

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
  static async crawlWebsite(url: string, options?: CrawlOptions): Promise<{ success: boolean; error?: string; data?: { text: string; rawContent?: string } }> {
    try {
      if (!auth?.currentUser) {
        console.error('Authentication error: user not authenticated');
        return { success: false, error: 'Authentication required' };
      }

      console.log('Making request to Firebase firecrawlUrl function with URL:', url);
      const response = await functionBridge.firecrawlUrl({ url }) as CrawlResponse;

      console.log('Received response from firecrawl-url function:', response);

      if (!response) {
        return { success: false, error: 'No response received from server' };
      }

      // Type guard to handle the error case
      if ('error' in response && !response.success) {
        return { success: false, error: response.error };
      }

      // Store the crawl summary in kickoff_summaries (legacy)
      if (db) {
        try {
          await addDoc(collection(db, 'kickoffSummaries'), {
            content: response.text,
            source: `url:${url}`,
            userId: auth.currentUser.uid,
            createdAt: serverTimestamp()
          });
        } catch (summaryError) {
          console.error('Error storing summary in Firestore:', summaryError);
        }
      } else {
        console.warn('Firestore not initialized; skipping kickoff summary persistence');
      }

      // Store in project if options are provided
      if (options?.projectId && options?.saveToProject !== false) {
        if (!db) {
          console.warn('Firestore not initialized; skipping project scrape persistence');
        } else {
          try {
            await addDoc(collection(db, 'projects', options.projectId, 'scrapedData'), {
              userId: auth.currentUser.uid,
              url,
              summary: response.text,
              rawContent: response.rawContent,
              context: options.context || 'general',
              metadata: {
                scrapedAt: new Date().toISOString(),
                source: 'firecrawl'
              },
              createdAt: serverTimestamp()
            });
          } catch (projectError) {
            console.error('Error storing project scrape data in Firestore:', projectError);
          }
        }
      }

      return {
        success: true,
        data: {
          ...response,
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
      if (!db) {
        return { success: false, error: 'Firestore not initialized' };
      }

      const scrapedDataRef = collection(db, 'projects', projectId, 'scrapedData');
      const dataQuery = query(scrapedDataRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(dataQuery);

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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
