// Apply Codes - LinkedIn Recruiter (Full) Adapter
// Handles automation on linkedin.com/talent/*
// Phase 3 - Selectors need verification against live Recruiter DOM

'use strict';

class RecruiterAdapter extends (window.ApplyCodesBaseAdapter || Object) {
  constructor() {
    super();
    this._currentPage = 1;
  }

  static canHandle(url) {
    return /linkedin\.com\/talent\//.test(url);
  }

  getName() { return 'LinkedIn Recruiter'; }
  getSource() { return 'recruiter'; }

  // Selector registry - these need verification against live Recruiter DOM
  // LinkedIn Recruiter has a significantly different UI from regular LinkedIn
  static SELECTORS = {
    searchInput: [
      'input[data-test-search-keywords]',
      'input[placeholder*="Search"]',
      'input[aria-label*="keywords"]',
      'input.search-s-keywords-typeahead__search-field',
    ],
    resultCards: [
      'li.profile-list__border-bottom',
      'div[data-test-profile-card]',
      'li[data-test-search-result]',
      'div.search-results__result-item',
    ],
    cardName: [
      'a[data-test-link-to-profile-name]',
      'a.profile-list__profile-name',
      'span.name-and-headline__name',
    ],
    cardHeadline: [
      'span.profile-list__headline',
      'span.name-and-headline__headline',
      'div.name-and-headline__headline',
    ],
    cardLocation: [
      'span.profile-list__location',
      'span.result-lockup__misc-item',
    ],
    cardProfileLink: [
      'a[data-test-link-to-profile-name]',
      'a.profile-list__profile-name',
      'a[href*="/in/"]',
      'a[href*="/talent/profile/"]',
    ],
    nextPageButton: [
      'button[aria-label="Next"]',
      'button.pagination__next-btn',
      'button[data-test-pagination-next]',
    ],
    // Recruiter-specific filter selectors
    filterPanel: [
      'div.facet-container',
      'div[data-test-search-filters]',
      'div.search-filters',
    ],
  };

  async fillSearchQuery(query) {
    const { humanType, humanSleep } = window.ApplyCodesTiming;
    const input = this.queryFirst(RecruiterAdapter.SELECTORS.searchInput);
    if (!input) {
      console.warn('[Apply Codes] Recruiter: Could not find search input');
      return false;
    }
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await humanSleep(200, 400);
    await humanType(input, query);
    await humanSleep(300, 600);
    return true;
  }

  async submitSearch() {
    const { humanSleep, TIMING } = window.ApplyCodesTiming;
    const input = this.queryFirst(RecruiterAdapter.SELECTORS.searchInput);
    if (input) {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    }
    await humanSleep(...TIMING.AFTER_SEARCH_SUBMIT);
    this._currentPage = 1;
    return true;
  }

  async applyFilters(filters) {
    // Phase 3: Implement filter application for full Recruiter
    console.log('[Apply Codes] Recruiter filters not yet implemented:', filters);
    return true;
  }

  getResultCards() {
    return this.queryAllFirst(RecruiterAdapter.SELECTORS.resultCards);
  }

  extractProfileData(card) {
    const name = this.getTextContent(RecruiterAdapter.SELECTORS.cardName, card);
    const headline = this.getTextContent(RecruiterAdapter.SELECTORS.cardHeadline, card);
    const location = this.getTextContent(RecruiterAdapter.SELECTORS.cardLocation, card);
    const linkEl = this.queryFirst(RecruiterAdapter.SELECTORS.cardProfileLink, card);
    let profileUrl = '';
    if (linkEl) {
      profileUrl = linkEl.href || linkEl.getAttribute('href') || '';
      try {
        const url = new URL(profileUrl, 'https://www.linkedin.com');
        profileUrl = url.origin + url.pathname;
      } catch { /* keep as-is */ }
    }
    let company = '';
    if (headline.includes(' at ')) {
      company = headline.split(' at ').pop().trim();
    }
    return { name: name || 'Unknown', headline, company, location, profileUrl, skills: [], experienceSummary: headline };
  }

  async goToNextPage() {
    const { humanClick, humanSleep, humanScrollDown, TIMING } = window.ApplyCodesTiming;
    if (this.isLastPage()) return false;
    await humanScrollDown(600);
    const nextBtn = this.queryFirst(RecruiterAdapter.SELECTORS.nextPageButton);
    if (!nextBtn || nextBtn.disabled) return false;
    await humanClick(nextBtn);
    this._currentPage++;
    await humanSleep(...TIMING.BEFORE_NEXT_PAGE);
    await this.waitForResults(10000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await humanSleep(500, 1000);
    return true;
  }

  isLastPage() {
    const nextBtn = this.queryFirst(RecruiterAdapter.SELECTORS.nextPageButton);
    return !nextBtn || nextBtn.disabled;
  }
}

if (typeof window !== 'undefined') {
  window.ApplyCodesRecruiterAdapter = RecruiterAdapter;
}
