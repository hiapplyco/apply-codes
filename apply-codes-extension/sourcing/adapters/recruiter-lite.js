// Apply Codes - LinkedIn Recruiter Lite Adapter
// Handles automation on linkedin.com/recruiter/* and linkedin.com/cap/*
// Phase 2 - Selectors need verification against live Recruiter Lite DOM

'use strict';

class RecruiterLiteAdapter extends (window.ApplyCodesBaseAdapter || Object) {
  constructor() {
    super();
    this._currentPage = 1;
  }

  static canHandle(url) {
    return /linkedin\.com\/recruiter\//.test(url) ||
           /linkedin\.com\/cap\//.test(url);
  }

  getName() { return 'Recruiter Lite'; }
  getSource() { return 'recruiterLite'; }

  // Selector registry - these need verification against live Recruiter Lite DOM
  static SELECTORS = {
    searchInput: [
      'input[placeholder*="Search"]',
      'input[aria-label*="Search"]',
      'input.search-s-keywords-typeahead__search-field',
      'input[role="combobox"]',
    ],
    resultCards: [
      'li.profile-list__border-bottom',
      'li[data-test-row]',
      'div.profile-list-item',
      'li.search-result',
    ],
    cardName: [
      'a.profile-list__profile-name',
      'span.profile-list__profile-name',
      'a[data-test-link-to-profile]',
    ],
    cardHeadline: [
      'span.profile-list__headline',
      'div.profile-list__headline',
    ],
    cardLocation: [
      'span.profile-list__location',
      'div.profile-list__location',
    ],
    cardProfileLink: [
      'a[data-test-link-to-profile]',
      'a.profile-list__profile-name',
      'a[href*="/in/"]',
      'a[href*="/profile/"]',
    ],
    nextPageButton: [
      'button[aria-label="Next"]',
      'button.pagination__next-btn',
      'button[data-test-pagination-next]',
    ],
  };

  async fillSearchQuery(query) {
    const { humanType, humanSleep } = window.ApplyCodesTiming;
    const input = this.queryFirst(RecruiterLiteAdapter.SELECTORS.searchInput);
    if (!input) {
      console.warn('[Apply Codes] Recruiter Lite: Could not find search input');
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
    const input = this.queryFirst(RecruiterLiteAdapter.SELECTORS.searchInput);
    if (!input) {
      console.warn('[Apply Codes] Recruiter Lite: Could not find search input for submit');
      return false;
    }
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    await humanSleep(...TIMING.AFTER_SEARCH_SUBMIT);
    this._currentPage = 1;
    return true;
  }

  async applyFilters(filters) {
    // Phase 2: Implement filter application for Recruiter Lite
    console.log('[Apply Codes] Recruiter Lite filters not yet implemented:', filters);
    return true;
  }

  getResultCards() {
    return this.queryAllFirst(RecruiterLiteAdapter.SELECTORS.resultCards);
  }

  extractProfileData(card) {
    const name = this.getTextContent(RecruiterLiteAdapter.SELECTORS.cardName, card);
    const headline = this.getTextContent(RecruiterLiteAdapter.SELECTORS.cardHeadline, card);
    const location = this.getTextContent(RecruiterLiteAdapter.SELECTORS.cardLocation, card);
    const linkEl = this.queryFirst(RecruiterLiteAdapter.SELECTORS.cardProfileLink, card);
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
    const nextBtn = this.queryFirst(RecruiterLiteAdapter.SELECTORS.nextPageButton);
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
    const nextBtn = this.queryFirst(RecruiterLiteAdapter.SELECTORS.nextPageButton);
    return !nextBtn || nextBtn.disabled;
  }
}

if (typeof window !== 'undefined') {
  window.ApplyCodesRecruiterLiteAdapter = RecruiterLiteAdapter;
}
