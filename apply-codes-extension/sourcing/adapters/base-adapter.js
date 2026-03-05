// Apply Codes - Base Dashboard Adapter
// Abstract interface that all LinkedIn dashboard adapters must implement

'use strict';

/**
 * Base adapter class. Each LinkedIn dashboard variant extends this.
 * Subclasses MUST implement all methods marked with "MUST OVERRIDE".
 */
class BaseDashboardAdapter {
  constructor() {
    if (new.target === BaseDashboardAdapter) {
      throw new Error('BaseDashboardAdapter is abstract and cannot be instantiated directly');
    }
    this._currentPage = 1;
  }

  /**
   * Return true if this adapter can handle the current page.
   * MUST OVERRIDE.
   * @param {string} url
   * @param {Document} doc
   * @returns {boolean}
   */
  static canHandle(url, doc) {
    throw new Error('canHandle() must be implemented by subclass');
  }

  /**
   * Get the name of this adapter for logging/display.
   * @returns {string}
   */
  getName() {
    return 'base';
  }

  /**
   * Get the source identifier for CandidateRecord.
   * @returns {'recruiter'|'recruiterLite'|'regularSearch'}
   */
  getSource() {
    throw new Error('getSource() must be implemented by subclass');
  }

  /**
   * Fill the main search input with the given query string.
   * MUST OVERRIDE.
   * @param {string} query
   * @returns {Promise<boolean>} True if successfully filled
   */
  async fillSearchQuery(query) {
    throw new Error('fillSearchQuery() must be implemented by subclass');
  }

  /**
   * Submit the search (press Enter or click Search button).
   * MUST OVERRIDE.
   * @returns {Promise<boolean>}
   */
  async submitSearch() {
    throw new Error('submitSearch() must be implemented by subclass');
  }

  /**
   * Apply structured filters (location, experience, etc.).
   * MUST OVERRIDE.
   * @param {Object} filters - { location, industry, experienceYears, currentCompany }
   * @returns {Promise<boolean>}
   */
  async applyFilters(filters) {
    throw new Error('applyFilters() must be implemented by subclass');
  }

  /**
   * Wait for search results to load on the page.
   * @param {number} [timeoutMs=10000]
   * @returns {Promise<boolean>} True if results appeared
   */
  async waitForResults(timeoutMs = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const cards = this.getResultCards();
      if (cards.length > 0) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    return false;
  }

  /**
   * Return an array of DOM elements representing result cards on the current page.
   * MUST OVERRIDE.
   * @returns {HTMLElement[]}
   */
  getResultCards() {
    throw new Error('getResultCards() must be implemented by subclass');
  }

  /**
   * Extract candidate data from a single result card element.
   * MUST OVERRIDE.
   * @param {HTMLElement} cardElement
   * @returns {Object} Raw candidate data (name, headline, company, location, profileUrl, skills)
   */
  extractProfileData(cardElement) {
    throw new Error('extractProfileData() must be implemented by subclass');
  }

  /**
   * Navigate to the next page of results.
   * MUST OVERRIDE.
   * @returns {Promise<boolean>} False if on last page
   */
  async goToNextPage() {
    throw new Error('goToNextPage() must be implemented by subclass');
  }

  /**
   * Return true if there are no more pages of results.
   * MUST OVERRIDE.
   * @returns {boolean}
   */
  isLastPage() {
    throw new Error('isLastPage() must be implemented by subclass');
  }

  /**
   * Return the current page number.
   * @returns {number}
   */
  getCurrentPage() {
    return this._currentPage;
  }

  /**
   * Get the total number of results shown (if available in the UI).
   * Default returns null (unknown).
   * @returns {number|null}
   */
  getTotalResultCount() {
    return null;
  }

  /**
   * Try multiple selectors and return the first match.
   * Useful for resilient DOM querying.
   * @param {string[]} selectors
   * @param {Element} [root=document]
   * @returns {Element|null}
   */
  queryFirst(selectors, root = document) {
    for (const selector of selectors) {
      try {
        const el = root.querySelector(selector);
        if (el) return el;
      } catch (e) {
        // Invalid selector, skip
      }
    }
    return null;
  }

  /**
   * Try multiple selectors and return all matches from the first selector that finds results.
   * @param {string[]} selectors
   * @param {Element} [root=document]
   * @returns {HTMLElement[]}
   */
  queryAllFirst(selectors, root = document) {
    for (const selector of selectors) {
      try {
        const els = root.querySelectorAll(selector);
        if (els.length > 0) return Array.from(els);
      } catch (e) {
        // Invalid selector, skip
      }
    }
    return [];
  }

  /**
   * Find an element by its visible text content.
   * @param {string} tag - Element tag to search (e.g., 'button', 'a')
   * @param {string|RegExp} text - Text to match
   * @param {Element} [root=document]
   * @returns {Element|null}
   */
  findByText(tag, text, root = document) {
    const elements = root.querySelectorAll(tag);
    for (const el of elements) {
      const content = el.textContent?.trim() || '';
      if (typeof text === 'string' ? content.includes(text) : text.test(content)) {
        return el;
      }
    }
    return null;
  }

  /**
   * Safely get text content from an element found by selector.
   * @param {string[]} selectors
   * @param {Element} [root=document]
   * @returns {string}
   */
  getTextContent(selectors, root = document) {
    const el = this.queryFirst(selectors, root);
    return el ? el.textContent.trim() : '';
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesBaseAdapter = BaseDashboardAdapter;
}
