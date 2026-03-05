// Apply Codes - Sourcing Panel UI
// Main sidebar panel for entering search criteria and viewing results

'use strict';

class SourcingPanel {
  constructor() {
    this._panel = null;
    this._tab = null;
    this._visible = false;
    this._engine = null;
    this._resultsTable = null;
    this._tosAccepted = false;
    this._activeView = 'criteria'; // 'criteria' | 'results' | 'progress'
  }

  /**
   * Initialize the sourcing panel and inject into the page.
   */
  async init() {
    if (document.getElementById('ac-sourcing-tab')) return;

    // Check ToS acceptance
    const stored = await chrome.storage.local.get('linkedinAutomationTosAccepted');
    this._tosAccepted = !!stored.linkedinAutomationTosAccepted;

    // Create engine
    this._engine = new window.ApplyCodesAutomationEngine();
    this._engine.setCallbacks({
      onProgress: (data) => this._handleProgress(data),
      onComplete: (summary) => this._handleComplete(summary),
      onError: (error) => this._handleError(error),
    });

    this._createTab();
    this._createPanel();

    // Load existing candidates
    await this._loadExistingResults();
  }

  // ============ UI CREATION ============

  _createTab() {
    this._tab = document.createElement('button');
    this._tab.id = 'ac-sourcing-tab';
    this._tab.setAttribute('aria-label', 'Open candidate sourcing panel');
    this._tab.innerHTML = '<span class="ac-tab-text">Source</span>';
    this._tab.addEventListener('click', () => this._toggle());
    document.body.appendChild(this._tab);
  }

  _createPanel() {
    this._panel = document.createElement('div');
    this._panel.id = 'ac-sourcing-panel';
    this._panel.setAttribute('role', 'dialog');
    this._panel.setAttribute('aria-label', 'Candidate Sourcing');

    const DashboardDetector = window.ApplyCodesDashboardDetector;
    const dashboardType = DashboardDetector.detectDashboard();
    const dashboardLabel = DashboardDetector.getDashboardLabel(dashboardType);

    this._panel.innerHTML = `
      <div class="ac-panel-header">
        <div class="ac-panel-logo">
          <span class="ac-logo-icon">AC</span>
          <span class="ac-logo-text">Candidate Sourcing</span>
        </div>
        <button class="ac-close-btn" title="Close" aria-label="Close panel">&times;</button>
      </div>

      <div class="ac-panel-nav" role="tablist">
        <button class="ac-nav-btn active" data-view="criteria" role="tab" aria-selected="true" aria-controls="ac-view-criteria">Search</button>
        <button class="ac-nav-btn" data-view="results" role="tab" aria-selected="false" aria-controls="ac-view-results">Results</button>
      </div>

      <div class="ac-panel-body">
        <!-- CRITERIA VIEW -->
        <div class="ac-view ac-view-criteria active" data-view="criteria" id="ac-view-criteria" role="tabpanel">
          <div class="ac-dashboard-badge">${this._escape(dashboardLabel)}</div>

          <div class="ac-field-group">
            <label class="ac-label" for="ac-query">What are you looking for?</label>
            <textarea class="ac-textarea" id="ac-query" rows="3" placeholder="e.g., Senior React developer with AWS experience in Austin, TX, 5+ years"></textarea>
          </div>

          <details class="ac-advanced-toggle">
            <summary>Advanced Filters</summary>
            <div class="ac-advanced-fields">
              <div class="ac-field-group">
                <label class="ac-label" for="ac-filter-title">Job Title</label>
                <input type="text" class="ac-input" id="ac-filter-title" placeholder="e.g., Software Engineer" />
              </div>
              <div class="ac-field-group">
                <label class="ac-label" for="ac-filter-location">Location</label>
                <input type="text" class="ac-input" id="ac-filter-location" placeholder="e.g., San Francisco, CA" />
              </div>
              <div class="ac-field-group">
                <label class="ac-label" for="ac-filter-skills">Skills (comma-separated)</label>
                <input type="text" class="ac-input" id="ac-filter-skills" placeholder="e.g., Python, React, AWS" />
              </div>
              <div class="ac-field-group">
                <label class="ac-label" for="ac-filter-company">Current Company</label>
                <input type="text" class="ac-input" id="ac-filter-company" placeholder="e.g., Google" />
              </div>
              <div class="ac-field-row">
                <div class="ac-field-group ac-field-half">
                  <label class="ac-label" for="ac-max-pages">Max Pages</label>
                  <input type="number" class="ac-input" id="ac-max-pages" value="10" min="1" max="50" />
                </div>
                <div class="ac-field-group ac-field-half">
                  <label class="ac-label">&nbsp;</label>
                  <label class="ac-checkbox-label">
                    <input type="checkbox" id="ac-use-ai" checked />
                    <span title="Generate optimized Boolean search query using AI">Use AI Boolean</span>
                  </label>
                </div>
              </div>
            </div>
          </details>

          <div class="ac-actions">
            <button class="ac-btn ac-btn-primary" id="ac-start-btn">Start Sourcing</button>
            <button class="ac-btn ac-btn-danger" id="ac-stop-btn" style="display:none">Stop</button>
          </div>

          <div class="ac-progress" id="ac-progress" style="display:none">
            <div class="ac-progress-bar">
              <div class="ac-progress-fill" id="ac-progress-fill"></div>
            </div>
            <div class="ac-progress-text" id="ac-progress-text">Initializing...</div>
            <div class="ac-progress-stats" id="ac-progress-stats"></div>
          </div>
        </div>

        <!-- RESULTS VIEW -->
        <div class="ac-view ac-view-results" data-view="results" id="ac-view-results" role="tabpanel">
          <div class="ac-results-toolbar">
            <div class="ac-export-buttons">
              <button class="ac-btn-sm" id="ac-export-csv">CSV</button>
              <button class="ac-btn-sm" id="ac-export-copy">Copy</button>
              <button class="ac-btn-sm" id="ac-export-share">Share</button>
            </div>
            <button class="ac-btn-sm ac-btn-danger-sm" id="ac-clear-results">Clear All</button>
          </div>
          <div id="ac-results-table-container"></div>
          <div class="ac-export-status" id="ac-export-status"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this._panel);
    this._bindPanelEvents();
  }

  // ============ EVENT BINDING ============

  _bindPanelEvents() {
    // Close button
    this._panel.querySelector('.ac-close-btn').addEventListener('click', () => this._close());

    // Nav buttons
    this._panel.querySelectorAll('.ac-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this._switchView(btn.dataset.view));
    });

    // Start button
    this._panel.querySelector('#ac-start-btn').addEventListener('click', () => this._startSourcing());

    // Stop button
    this._panel.querySelector('#ac-stop-btn').addEventListener('click', () => this._stopSourcing());

    // Export buttons
    this._panel.querySelector('#ac-export-csv').addEventListener('click', () => this._exportCSV());
    this._panel.querySelector('#ac-export-copy').addEventListener('click', () => this._exportCopy());
    this._panel.querySelector('#ac-export-share').addEventListener('click', () => this._exportShare());

    // Clear results
    this._panel.querySelector('#ac-clear-results').addEventListener('click', () => this._clearResults());

    // Initialize results table
    const tableContainer = this._panel.querySelector('#ac-results-table-container');
    this._resultsTable = new window.ApplyCodesResultsTable(tableContainer);
    this._resultsTable.setAnalyzeCallback((id) => this._analyzeCandidate(id));
  }

  // ============ VIEWS ============

  _switchView(view) {
    this._activeView = view;
    this._panel.querySelectorAll('.ac-nav-btn').forEach(btn => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    this._panel.querySelectorAll('.ac-view').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    if (view === 'results') {
      this._loadExistingResults();
    }
  }

  _toggle() {
    this._visible ? this._close() : this._open();
  }

  _open() {
    this._panel.classList.add('visible');
    this._tab.classList.add('hidden');
    this._visible = true;
  }

  _close() {
    this._panel.classList.remove('visible');
    this._tab.classList.remove('hidden');
    this._visible = false;
  }

  // ============ SOURCING ============

  async _startSourcing() {
    // Check ToS
    if (!this._tosAccepted) {
      const accepted = await this._showTosWarning();
      if (!accepted) return;
    }

    const query = this._panel.querySelector('#ac-query').value.trim();
    if (!query) {
      this._showInlineError('#ac-query', 'Please enter search criteria');
      return;
    }

    const filters = {};
    const title = this._panel.querySelector('#ac-filter-title')?.value?.trim();
    const location = this._panel.querySelector('#ac-filter-location')?.value?.trim();
    const company = this._panel.querySelector('#ac-filter-company')?.value?.trim();
    if (title) filters.jobTitle = title;
    if (location) filters.location = location;
    if (company) filters.currentCompany = company;

    const maxPages = parseInt(this._panel.querySelector('#ac-max-pages')?.value) || 10;
    const useAI = this._panel.querySelector('#ac-use-ai')?.checked ?? true;

    // Reset progress state and toggle UI
    this._panel.querySelector('#ac-start-btn').style.display = 'none';
    this._panel.querySelector('#ac-stop-btn').style.display = '';
    const progress = this._panel.querySelector('#ac-progress');
    progress.style.display = '';
    const progressFill = this._panel.querySelector('#ac-progress-fill');
    const progressText = this._panel.querySelector('#ac-progress-text');
    if (progressFill) progressFill.style.width = '0%';
    if (progressText) {
      progressText.textContent = 'Initializing...';
      progressText.style.color = '';
    }

    await this._engine.start({
      query,
      filters,
      useAIBoolean: useAI,
      maxPages,
    });
  }

  _stopSourcing() {
    this._engine.stop();
    this._panel.querySelector('#ac-start-btn').style.display = '';
    this._panel.querySelector('#ac-stop-btn').style.display = 'none';
  }

  // ============ PROGRESS & CALLBACKS ============

  _handleProgress(data) {
    const progressText = this._panel.querySelector('#ac-progress-text');
    const progressStats = this._panel.querySelector('#ac-progress-stats');
    const progressFill = this._panel.querySelector('#ac-progress-fill');

    if (progressText) progressText.textContent = data.message;
    if (progressStats) {
      progressStats.textContent = `Pages: ${data.stats.pagesProcessed} | Found: ${data.stats.candidatesFound} | Duplicates: ${data.stats.duplicatesSkipped}`;
    }
    if (progressFill && data.stats.pagesProcessed > 0) {
      const maxPages = parseInt(this._panel.querySelector('#ac-max-pages')?.value) || 10;
      const pct = Math.min(100, (data.stats.pagesProcessed / maxPages) * 100);
      progressFill.style.width = `${pct}%`;
    }
  }

  _handleComplete(summary) {
    this._panel.querySelector('#ac-start-btn').style.display = '';
    this._panel.querySelector('#ac-stop-btn').style.display = 'none';

    const progressText = this._panel.querySelector('#ac-progress-text');
    if (progressText) {
      progressText.textContent = `Done! Found ${summary.candidatesFound} candidates across ${summary.pagesProcessed} pages.`;
    }

    // Auto-switch to results view
    this._switchView('results');
  }

  _handleError(error) {
    this._panel.querySelector('#ac-start-btn').style.display = '';
    this._panel.querySelector('#ac-stop-btn').style.display = 'none';

    const progressText = this._panel.querySelector('#ac-progress-text');
    if (progressText) {
      progressText.textContent = `Error: ${this._friendlyError(error.message)}`;
      progressText.style.color = '#dc2626';
    }
  }

  _friendlyError(msg) {
    if (!msg) return 'Something went wrong. Please try again.';
    const lower = msg.toLowerCase();
    if (lower.includes('net::err_') || lower.includes('failed to fetch') || lower.includes('networkerror')) {
      return 'Network error — check your internet connection and try again.';
    }
    if (lower.includes('timeout') || lower.includes('aborted')) {
      return 'Request timed out. LinkedIn may be slow — try again in a moment.';
    }
    if (lower.includes('401') || lower.includes('unauthenticated') || lower.includes('sign in')) {
      return 'Please sign in via the extension popup first.';
    }
    if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many')) {
      return 'Rate limited — wait a few minutes before trying again.';
    }
    if (lower.includes('no results') || lower.includes('no candidates')) {
      return 'No results found. Try broadening your search criteria.';
    }
    return msg;
  }

  // ============ RESULTS ============

  async _loadExistingResults() {
    const candidates = await window.ApplyCodesCandidateStore.getAllCandidates();
    this._resultsTable.setCandidates(candidates);

    // Update results tab badge
    const resultsBtn = this._panel.querySelector('.ac-nav-btn[data-view="results"]');
    if (resultsBtn) {
      resultsBtn.textContent = candidates.length > 0 ? `Results (${candidates.length})` : 'Results';
    }
  }

  async _analyzeCandidate(candidateId) {
    const candidates = await window.ApplyCodesCandidateStore.getAllCandidates();
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    this._showExportStatus('Analyzing candidate...');

    try {
      const result = await this._engine.analyzeCandidate(candidate);
      await window.ApplyCodesCandidateStore.updateCandidateAnalysis(candidateId, result);
      await this._loadExistingResults();
      this._showExportStatus('Analysis complete!');
    } catch (err) {
      this._showExportStatus(`Analysis failed: ${err.message}`, true);
    }
  }

  // ============ EXPORT ============

  async _exportCSV() {
    const selected = this._resultsTable.getSelected();
    const candidates = selected.length > 0 ? selected : this._resultsTable.getFiltered();
    if (candidates.length === 0) {
      this._showExportStatus('No candidates to export', true);
      return;
    }
    window.ApplyCodesExport.downloadCSV(candidates);
    this._showExportStatus(`Exported ${candidates.length} candidates as CSV`);
  }

  async _exportCopy() {
    const selected = this._resultsTable.getSelected();
    const candidates = selected.length > 0 ? selected : this._resultsTable.getFiltered();
    if (candidates.length === 0) {
      this._showExportStatus('No candidates to copy', true);
      return;
    }
    const ok = await window.ApplyCodesExport.copyToClipboard(candidates);
    this._showExportStatus(ok ? `Copied ${candidates.length} candidates to clipboard` : 'Copy failed', !ok);
  }

  async _exportShare() {
    const selected = this._resultsTable.getSelected();
    const candidates = selected.length > 0 ? selected : this._resultsTable.getFiltered();
    if (candidates.length === 0) {
      this._showExportStatus('No candidates to share', true);
      return;
    }
    const query = this._panel.querySelector('#ac-query')?.value || '';
    const ok = await window.ApplyCodesExport.shareToClipboard(candidates, query);
    this._showExportStatus(ok ? 'Shareable summary copied to clipboard' : 'Share failed', !ok);
  }

  async _clearResults() {
    if (!confirm('Clear all sourced candidates? This cannot be undone.')) return;
    await window.ApplyCodesCandidateStore.clearAllCandidates();
    await this._loadExistingResults();
    this._showExportStatus('All candidates cleared');
  }

  _showExportStatus(message, isError = false) {
    const el = this._panel.querySelector('#ac-export-status');
    if (!el) return;
    el.textContent = message;
    el.className = 'ac-export-status' + (isError ? ' ac-error' : ' ac-success');
    setTimeout(() => { el.textContent = ''; el.className = 'ac-export-status'; }, 3000);
  }

  // ============ TOS WARNING ============

  async _showTosWarning() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'ac-tos-overlay';
      overlay.innerHTML = `
        <div class="ac-tos-modal">
          <h3>Important Notice</h3>
          <p>This tool automates interactions with LinkedIn on your behalf. Use of automation tools may violate LinkedIn's User Agreement.</p>
          <p>By proceeding, you acknowledge that you understand the risks and accept full responsibility for compliance with LinkedIn's terms of service.</p>
          <p><strong>Apply Codes is not liable for any account restrictions or penalties.</strong></p>
          <div class="ac-tos-actions">
            <button class="ac-btn" id="ac-tos-cancel">Cancel</button>
            <button class="ac-btn ac-btn-primary" id="ac-tos-accept">I Understand, Proceed</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      overlay.querySelector('#ac-tos-cancel').addEventListener('click', () => {
        overlay.remove();
        resolve(false);
      });
      overlay.querySelector('#ac-tos-accept').addEventListener('click', async () => {
        this._tosAccepted = true;
        await chrome.storage.local.set({ linkedinAutomationTosAccepted: true });
        overlay.remove();
        resolve(true);
      });
    });
  }

  _showInlineError(selector, message) {
    const el = this._panel.querySelector(selector);
    if (!el) return;
    el.classList.add('ac-input-error');
    let errEl = el.parentElement.querySelector('.ac-inline-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'ac-inline-error';
      el.parentElement.appendChild(errEl);
    }
    errEl.textContent = message;
    el.addEventListener('input', () => {
      el.classList.remove('ac-input-error');
      errEl.remove();
    }, { once: true });
  }

  _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesSourcingPanel = SourcingPanel;
}
