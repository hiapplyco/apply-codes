// Apply Codes - Automation Engine
// Orchestrates the search, extraction, and pagination workflow

'use strict';

/**
 * AutomationEngine manages the sourcing workflow:
 * 1. Takes user criteria
 * 2. Optionally generates a boolean query via Cloud Function
 * 3. Fills search fields and applies filters
 * 4. Iterates through result pages, extracting candidates
 * 5. Reports progress and stores results
 */
class AutomationEngine {
  constructor() {
    this._running = false;
    this._adapter = null;
    this._onProgress = null;
    this._onComplete = null;
    this._onError = null;
    this._maxPages = 10;
    this._collectedCandidates = [];
    this._stats = { pagesProcessed: 0, candidatesFound: 0, duplicatesSkipped: 0 };
  }

  /**
   * Set event callbacks.
   * @param {{ onProgress?: Function, onComplete?: Function, onError?: Function }} callbacks
   */
  setCallbacks(callbacks) {
    this._onProgress = callbacks.onProgress || null;
    this._onComplete = callbacks.onComplete || null;
    this._onError = callbacks.onError || null;
  }

  /**
   * Start the sourcing workflow.
   * @param {Object} options
   * @param {string} options.query - Natural language or boolean query
   * @param {Object} [options.filters] - Structured filters { location, currentCompany, industry, experienceYears }
   * @param {boolean} [options.useAIBoolean=false] - Whether to generate boolean via Cloud Function
   * @param {number} [options.maxPages=10] - Max pages to process
   * @returns {Promise<void>}
   */
  async start(options) {
    if (this._running) {
      console.warn('[Apply Codes] Engine is already running');
      return;
    }

    this._running = true;
    this._collectedCandidates = [];
    this._stats = { pagesProcessed: 0, candidatesFound: 0, duplicatesSkipped: 0 };
    this._maxPages = options.maxPages || 10;

    const { humanSleep, coolingPause, TIMING } = window.ApplyCodesTiming;
    const CandidateStore = window.ApplyCodesCandidateStore;
    const DashboardDetector = window.ApplyCodesDashboardDetector;

    try {
      // Step 1: Detect dashboard and get adapter
      const { type, AdapterClass } = DashboardDetector.getAdapterForDashboard();
      if (!AdapterClass) {
        throw new Error(`No adapter available for dashboard type: ${DashboardDetector.getDashboardLabel(type)}`);
      }

      this._adapter = new AdapterClass();
      const dashboardLabel = DashboardDetector.getDashboardLabel(type);
      this._reportProgress('init', `Detected: ${dashboardLabel}`);

      // Step 2: Generate boolean query if requested
      let searchQuery = options.query;
      if (options.useAIBoolean && searchQuery) {
        this._reportProgress('generating', 'Generating AI boolean search...');
        try {
          const booleanResult = await this._callBackground('generateBooleanSearch', {
            description: searchQuery,
            jobTitle: options.filters?.jobTitle || '',
          });
          if (booleanResult?.booleanString || booleanResult?.result?.booleanString) {
            searchQuery = booleanResult.booleanString || booleanResult.result.booleanString;
            this._reportProgress('generated', `Boolean: ${searchQuery.substring(0, 80)}...`);
          }
        } catch (err) {
          console.warn('[Apply Codes] Boolean generation failed, using raw query:', err.message);
          this._reportProgress('warning', 'Boolean generation failed, using original query');
        }
      }

      // Step 3: Fill search and submit
      this._reportProgress('searching', 'Filling search query...');
      const filled = await this._adapter.fillSearchQuery(searchQuery);
      if (!filled) throw new Error('Could not fill search query');

      const submitted = await this._adapter.submitSearch();
      if (!submitted) throw new Error('Could not submit search');

      // Step 4: Wait for results
      this._reportProgress('waiting', 'Waiting for results to load...');
      const hasResults = await this._adapter.waitForResults(15000);
      if (!hasResults) throw new Error('No search results found');

      // Step 5: Apply filters if provided
      if (options.filters && Object.keys(options.filters).length > 0) {
        this._reportProgress('filtering', 'Applying filters...');
        await this._adapter.applyFilters(options.filters);
        await this._adapter.waitForResults(10000);
      }

      // Step 6: Iterate through pages
      let pageCount = 0;
      while (this._running && pageCount < this._maxPages) {
        pageCount++;
        this._reportProgress('extracting', `Processing page ${pageCount}...`);

        // Extract candidates from current page
        const cards = this._adapter.getResultCards();
        const pageCandidates = [];

        for (const card of cards) {
          if (!this._running) break;
          try {
            const rawData = this._adapter.extractProfileData(card);
            if (rawData.name && rawData.name !== 'Unknown' && rawData.profileUrl) {
              const record = CandidateStore.createCandidateRecord(
                rawData,
                this._adapter.getSource(),
                options.query
              );
              pageCandidates.push(record);
            }
          } catch (err) {
            console.warn('[Apply Codes] Error extracting card:', err.message);
          }
          await humanSleep(...TIMING.BETWEEN_CARD_READS);
        }

        // Store page results
        if (pageCandidates.length > 0) {
          const storeResult = await CandidateStore.addCandidates(pageCandidates);
          this._collectedCandidates.push(...pageCandidates.slice(0, storeResult.added));
          this._stats.candidatesFound += storeResult.added;
          this._stats.duplicatesSkipped += storeResult.duplicates;
        }

        this._stats.pagesProcessed = pageCount;
        this._reportProgress('progress', `Page ${pageCount}: Found ${pageCandidates.length} candidates (${this._stats.candidatesFound} total)`);

        // Check if more pages
        if (this._adapter.isLastPage() || pageCount >= this._maxPages) {
          break;
        }

        // Cooling pause every N pages
        if (pageCount % TIMING.COOLING_INTERVAL_PAGES === 0) {
          this._reportProgress('cooling', 'Taking a brief pause...');
          await coolingPause();
        }

        // Go to next page
        if (!this._running) break;
        this._reportProgress('paginating', `Moving to page ${pageCount + 1}...`);
        const hasNextPage = await this._adapter.goToNextPage();
        if (!hasNextPage) break;
      }

      // Complete
      if (this._running) {
        this._running = false;
        this._reportComplete();
      }

    } catch (error) {
      this._running = false;
      console.error('[Apply Codes] Automation error:', error);
      if (this._onError) this._onError(error);
    }
  }

  /**
   * Stop the automation.
   */
  stop() {
    if (!this._running) return;
    this._running = false;
    this._reportProgress('stopped', 'Sourcing stopped by user');
    this._reportComplete();
  }

  /**
   * Check if the engine is currently running.
   * @returns {boolean}
   */
  isRunning() {
    return this._running;
  }

  /**
   * Get current stats.
   * @returns {Object}
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * Analyze a single candidate via the analyzeCandidate Cloud Function.
   * @param {Object} candidate - CandidateRecord
   * @param {string} [requirements]
   * @returns {Promise<Object>}
   */
  async analyzeCandidate(candidate, requirements) {
    const result = await this._callBackground('analyzeCandidate', {
      candidate: {
        name: candidate.name,
        headline: candidate.headline,
        profile: `Name: ${candidate.name}\nHeadline: ${candidate.headline}\nCompany: ${candidate.company}\nLocation: ${candidate.location}`,
        url: candidate.profileUrl,
      },
      requirements: requirements || 'General candidate evaluation',
    });
    return result;
  }

  // ============ PRIVATE ============

  _reportProgress(status, message) {
    console.log(`[Apply Codes] [${status}] ${message}`);
    if (this._onProgress) {
      this._onProgress({
        status,
        message,
        stats: { ...this._stats },
        isRunning: this._running,
      });
    }
  }

  _reportComplete() {
    const summary = {
      pagesProcessed: this._stats.pagesProcessed,
      candidatesFound: this._stats.candidatesFound,
      duplicatesSkipped: this._stats.duplicatesSkipped,
      totalCollected: this._collectedCandidates.length,
    };
    console.log('[Apply Codes] Sourcing complete:', summary);
    if (this._onComplete) {
      this._onComplete(summary);
    }
  }

  /**
   * Send a message to the background service worker to call a Cloud Function.
   * @param {string} functionName
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  _callBackground(functionName, data) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: functionName === 'analyzeCandidate' ? 'evaluateCandidate' : 'generateBooleanSearch', data },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesAutomationEngine = AutomationEngine;
}
