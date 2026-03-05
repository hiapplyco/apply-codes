// Apply Codes - Sourcing Content Script Entry Point
// Injected on LinkedIn search/recruiter pages
// Loads all sourcing modules and initializes the sourcing panel

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.applyCodesSourcingInjected) return;
  window.applyCodesSourcingInjected = true;

  console.log('[Apply Codes] Sourcing content script loaded on:', window.location.href);

  // Wait for all modules to be available (they're loaded via manifest content_scripts)
  function waitForModules(callback, retries = 20) {
    const required = [
      'ApplyCodesTiming',
      'ApplyCodesCandidateStore',
      'ApplyCodesDashboardDetector',
      'ApplyCodesBaseAdapter',
      'ApplyCodesRegularSearchAdapter',
      'ApplyCodesAutomationEngine',
      'ApplyCodesExport',
      'ApplyCodesResultsTable',
      'ApplyCodesSourcingPanel',
    ];

    const missing = required.filter(m => !window[m]);
    if (missing.length === 0) {
      callback();
      return;
    }

    if (retries <= 0) {
      console.error('[Apply Codes] Missing modules after timeout:', missing);
      return;
    }

    setTimeout(() => waitForModules(callback, retries - 1), 100);
  }

  function initialize() {
    const DashboardDetector = window.ApplyCodesDashboardDetector;

    // Verify we're on a supported page
    if (!DashboardDetector.isSupportedDashboard()) {
      console.log('[Apply Codes] Not a supported dashboard page, skipping initialization');
      return;
    }

    const type = DashboardDetector.detectDashboard();
    const label = DashboardDetector.getDashboardLabel(type);
    console.log(`[Apply Codes] Dashboard detected: ${label} (${type})`);

    // Initialize the sourcing panel
    const panel = new window.ApplyCodesSourcingPanel();
    panel.init();

    // Store reference for debugging
    window.__applyCodesSourcingPanel = panel;

    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ping-sourcing') {
        sendResponse({ status: 'ready', dashboard: type });
        return true;
      }
      if (request.action === 'openSourcingPanel') {
        panel._open();
        sendResponse({ success: true });
        return true;
      }
      return true;
    });

    // SPA navigation detection via History API + periodic check
    let lastUrl = location.href;
    function checkUrlChange() {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        const newType = DashboardDetector.detectDashboard(url);
        if (newType !== DashboardDetector.DASHBOARD_TYPES.UNKNOWN) {
          console.log(`[Apply Codes] SPA navigation detected, dashboard: ${DashboardDetector.getDashboardLabel(newType)}`);
        }
      }
    }
    window.addEventListener('popstate', checkUrlChange);
    window.addEventListener('hashchange', checkUrlChange);
    // Periodic check for pushState navigations (LinkedIn SPA)
    setInterval(checkUrlChange, 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForModules(initialize));
  } else {
    waitForModules(initialize);
  }
})();
