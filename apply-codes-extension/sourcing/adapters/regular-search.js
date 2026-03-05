// Apply Codes - Regular LinkedIn Search Adapter
// Handles automation on linkedin.com/search/results/people/*

'use strict';

class RegularSearchAdapter extends (window.ApplyCodesBaseAdapter || Object) {
  constructor() {
    super();
    this._currentPage = 1;
  }

  static canHandle(url) {
    return /linkedin\.com\/search\/results\/people/.test(url) ||
           /linkedin\.com\/search\/results\/all/.test(url) ||
           /linkedin\.com\/mynetwork/.test(url);
  }

  getName() { return 'Regular LinkedIn Search'; }
  getSource() { return 'regularSearch'; }

  // ============ SELECTOR REGISTRY ============
  // Centralized selectors for easy updates when LinkedIn changes DOM

  static SELECTORS = {
    // Search input - multiple fallback selectors
    searchInput: [
      'input.search-global-typeahead__input',
      'input[aria-label="Search"]',
      'input[placeholder*="Search"]',
      'input[role="combobox"]',
    ],
    // Search button / submit
    searchButton: [
      'button.search-global-typeahead__collapsed-search-button',
      'button[aria-label="Search"]',
      'button[type="submit"]',
    ],
    // Result cards container
    resultCards: [
      'li.reusable-search__result-container',
      'div.entity-result__item',
      'li[class*="search-result"]',
      'div[data-chameleon-result-urn]',
    ],
    // Within a result card:
    cardName: [
      'span.entity-result__title-text a span[aria-hidden="true"]',
      'span.entity-result__title-text a span:not(.visually-hidden)',
      'a[data-test-link] span[aria-hidden="true"]',
      '.entity-result__title-text span[dir="ltr"]',
    ],
    cardHeadline: [
      'div.entity-result__primary-subtitle',
      '.entity-result__summary',
      'p.entity-result__summary--2-lines',
    ],
    cardLocation: [
      'div.entity-result__secondary-subtitle',
      'span.entity-result__simple-insight-text',
    ],
    cardProfileLink: [
      'a.app-aware-link[href*="/in/"]',
      'span.entity-result__title-text a[href*="/in/"]',
      'a[data-test-link][href*="/in/"]',
    ],
    // Pagination
    nextPageButton: [
      'button[aria-label="Next"]',
      'button.artdeco-pagination__button--next',
      'li.artdeco-pagination__indicator--number.active + li button',
    ],
    paginationContainer: [
      'div.artdeco-pagination',
      'ul.artdeco-pagination__pages',
    ],
    // Results count
    resultsCount: [
      'div.search-results-container h2',
      '.search-results__cluster-bottom-banner',
      'div[role="heading"]',
    ],
    // Filter buttons
    filterButtons: {
      allFilters: [
        'button[aria-label="All filters"]',
        'button:has(span:contains("All filters"))',
      ],
      location: [
        'button[aria-label*="Locations"]',
        'button[aria-label*="Location"]',
      ],
      currentCompany: [
        'button[aria-label*="Current company"]',
      ],
      industry: [
        'button[aria-label*="Industry"]',
      ],
    },
    // Filter modal elements
    filterModal: {
      container: [
        'div.search-reusables__secondary-filters-filter',
        'div[role="dialog"]',
        'div.artdeco-modal',
      ],
      searchInput: [
        'input[aria-label*="Add a location"]',
        'input[aria-label*="Add a company"]',
        'input[aria-label*="Add"]',
        'input[role="combobox"]',
      ],
      applyButton: [
        'button[data-test-reusables-filter-apply-button]',
        'button:has(span:contains("Show results"))',
        'button.search-reusables__secondary-filters-show-results-button',
      ],
      suggestion: [
        'div[role="option"]',
        'li[role="option"]',
        'div.basic-typeahead__selectable',
      ],
    },
  };

  // ============ SEARCH ============

  async fillSearchQuery(query) {
    const { humanType, humanSleep } = window.ApplyCodesTiming;
    const input = this.queryFirst(RegularSearchAdapter.SELECTORS.searchInput);

    if (!input) {
      console.warn('[Apply Codes] Could not find search input');
      return false;
    }

    // Clear existing value
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await humanSleep(200, 400);

    // Type the query
    await humanType(input, query);
    await humanSleep(300, 600);
    return true;
  }

  async submitSearch() {
    const { humanClick, humanSleep, TIMING } = window.ApplyCodesTiming;
    const input = this.queryFirst(RegularSearchAdapter.SELECTORS.searchInput);

    if (input) {
      // Press Enter
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    } else {
      // Try clicking the search button
      const btn = this.queryFirst(RegularSearchAdapter.SELECTORS.searchButton);
      if (btn) {
        await humanClick(btn);
      } else {
        return false;
      }
    }

    await humanSleep(...TIMING.AFTER_SEARCH_SUBMIT);
    this._currentPage = 1;
    return true;
  }

  async applyFilters(filters) {
    const { humanClick, humanSleep, humanType, TIMING } = window.ApplyCodesTiming;

    if (!filters || Object.keys(filters).length === 0) return true;

    // Try to apply location filter if provided
    if (filters.location) {
      const locationBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.filterButtons.location);
      if (locationBtn) {
        await humanClick(locationBtn);
        await humanSleep(500, 1000);

        const filterInput = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.searchInput);
        if (filterInput) {
          await humanType(filterInput, filters.location);
          await humanSleep(800, 1500);

          // Click first suggestion
          const suggestion = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.suggestion);
          if (suggestion) {
            await humanClick(suggestion);
            await humanSleep(300, 600);
          }
        }

        // Apply
        const applyBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.applyButton)
          || this.findByText('button', 'Show results');
        if (applyBtn) {
          await humanClick(applyBtn);
          await humanSleep(...TIMING.AFTER_FILTER_APPLY);
        }
      }
    }

    // Try to apply current company filter if provided
    if (filters.currentCompany) {
      const companyBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.filterButtons.currentCompany);
      if (companyBtn) {
        await humanClick(companyBtn);
        await humanSleep(500, 1000);

        const filterInput = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.searchInput);
        if (filterInput) {
          await humanType(filterInput, filters.currentCompany);
          await humanSleep(800, 1500);

          const suggestion = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.suggestion);
          if (suggestion) {
            await humanClick(suggestion);
            await humanSleep(300, 600);
          }
        }

        const applyBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.filterModal.applyButton)
          || this.findByText('button', 'Show results');
        if (applyBtn) {
          await humanClick(applyBtn);
          await humanSleep(...TIMING.AFTER_FILTER_APPLY);
        }
      }
    }

    return true;
  }

  // ============ RESULT EXTRACTION ============

  getResultCards() {
    return this.queryAllFirst(RegularSearchAdapter.SELECTORS.resultCards);
  }

  extractProfileData(card) {
    const name = this.getTextContent(RegularSearchAdapter.SELECTORS.cardName, card);
    const headline = this.getTextContent(RegularSearchAdapter.SELECTORS.cardHeadline, card);
    const location = this.getTextContent(RegularSearchAdapter.SELECTORS.cardLocation, card);

    // Extract profile URL
    const linkEl = this.queryFirst(RegularSearchAdapter.SELECTORS.cardProfileLink, card);
    let profileUrl = '';
    if (linkEl) {
      profileUrl = linkEl.href || linkEl.getAttribute('href') || '';
      // Clean tracking params
      try {
        const url = new URL(profileUrl, 'https://www.linkedin.com');
        profileUrl = url.origin + url.pathname;
      } catch { /* keep as-is */ }
    }

    // Try to extract company from headline (often "Title at Company")
    let company = '';
    if (headline.includes(' at ')) {
      company = headline.split(' at ').pop().trim();
    }

    // Try to extract skills if visible
    const skills = [];
    const skillElements = card.querySelectorAll('.entity-result__badge-text, .entity-result__insights span');
    skillElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length < 50) skills.push(text);
    });

    return {
      name: name || 'Unknown',
      headline,
      company,
      location,
      profileUrl,
      skills,
      experienceSummary: headline,
    };
  }

  // ============ PAGINATION ============

  async goToNextPage() {
    const { humanClick, humanSleep, humanScrollDown, TIMING } = window.ApplyCodesTiming;

    if (this.isLastPage()) return false;

    // Scroll to bottom to load pagination
    await humanScrollDown(800);
    await humanSleep(500, 1000);

    const nextBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.nextPageButton);
    if (!nextBtn || nextBtn.disabled) return false;

    await humanClick(nextBtn);
    this._currentPage++;
    await humanSleep(...TIMING.BEFORE_NEXT_PAGE);

    // Wait for new results to load
    await this.waitForResults(10000);
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await humanSleep(500, 1000);

    return true;
  }

  isLastPage() {
    const nextBtn = this.queryFirst(RegularSearchAdapter.SELECTORS.nextPageButton);
    return !nextBtn || nextBtn.disabled || nextBtn.getAttribute('aria-disabled') === 'true';
  }

  getTotalResultCount() {
    const el = this.queryFirst(RegularSearchAdapter.SELECTORS.resultsCount);
    if (!el) return null;
    const text = el.textContent || '';
    const match = text.match(/([\d,]+)\s*results?/i);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesRegularSearchAdapter = RegularSearchAdapter;
}
