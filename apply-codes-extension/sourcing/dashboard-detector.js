// Apply Codes - LinkedIn Dashboard Detector
// Identifies which LinkedIn dashboard the user is on

'use strict';

const DASHBOARD_TYPES = {
  RECRUITER: 'recruiter',
  RECRUITER_LITE: 'recruiterLite',
  REGULAR_SEARCH: 'regularSearch',
  UNKNOWN: 'unknown',
};

const URL_PATTERNS = {
  [DASHBOARD_TYPES.RECRUITER]: [
    /linkedin\.com\/talent\//,
  ],
  [DASHBOARD_TYPES.RECRUITER_LITE]: [
    /linkedin\.com\/recruiter\//,
    /linkedin\.com\/cap\//,
  ],
  [DASHBOARD_TYPES.REGULAR_SEARCH]: [
    /linkedin\.com\/search\/results\//,
    /linkedin\.com\/mynetwork\//,
  ],
};

/**
 * Detect the dashboard type from the current URL.
 * @param {string} [url] - URL to check (defaults to current page)
 * @returns {string} One of DASHBOARD_TYPES values
 */
function detectDashboard(url) {
  const currentUrl = url || window.location.href;

  for (const [type, patterns] of Object.entries(URL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(currentUrl)) {
        return type;
      }
    }
  }

  return DASHBOARD_TYPES.UNKNOWN;
}

/**
 * Get the appropriate adapter class for the detected dashboard.
 * Returns null if dashboard is unknown or adapter is not available.
 * @param {string} [url]
 * @returns {{ type: string, AdapterClass: Function|null }}
 */
function getAdapterForDashboard(url) {
  const type = detectDashboard(url);

  const adapters = {
    [DASHBOARD_TYPES.REGULAR_SEARCH]: window.ApplyCodesRegularSearchAdapter || null,
    [DASHBOARD_TYPES.RECRUITER_LITE]: window.ApplyCodesRecruiterLiteAdapter || null,
    [DASHBOARD_TYPES.RECRUITER]: window.ApplyCodesRecruiterAdapter || null,
  };

  return {
    type,
    AdapterClass: adapters[type] || null,
  };
}

/**
 * Check if the current page is a supported LinkedIn dashboard.
 * @param {string} [url]
 * @returns {boolean}
 */
function isSupportedDashboard(url) {
  return detectDashboard(url) !== DASHBOARD_TYPES.UNKNOWN;
}

/**
 * Get a human-readable label for the dashboard type.
 * @param {string} type
 * @returns {string}
 */
function getDashboardLabel(type) {
  const labels = {
    [DASHBOARD_TYPES.RECRUITER]: 'LinkedIn Recruiter',
    [DASHBOARD_TYPES.RECRUITER_LITE]: 'Recruiter Lite',
    [DASHBOARD_TYPES.REGULAR_SEARCH]: 'LinkedIn Search',
    [DASHBOARD_TYPES.UNKNOWN]: 'Unknown',
  };
  return labels[type] || 'Unknown';
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesDashboardDetector = {
    DASHBOARD_TYPES,
    detectDashboard,
    getAdapterForDashboard,
    isSupportedDashboard,
    getDashboardLabel,
  };
}
