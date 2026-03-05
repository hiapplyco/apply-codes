// Apply Codes - Sortable, filterable results table for sourced candidates

'use strict';

class ResultsTable {
  constructor(containerEl) {
    this._container = containerEl;
    this._candidates = [];
    this._filteredCandidates = [];
    this._sortColumn = 'collectedAt';
    this._sortDirection = 'desc';
    this._filterText = '';
    this._selectedIds = new Set();
    this._page = 1;
    this._pageSize = 50;
    this._onAnalyze = null;
  }

  /**
   * Set the analyze callback (called when user clicks Analyze on a row).
   * @param {Function} callback - Receives candidateId
   */
  setAnalyzeCallback(callback) {
    this._onAnalyze = callback;
  }

  /**
   * Load candidates and render the table.
   * @param {Object[]} candidates
   */
  setCandidates(candidates) {
    this._candidates = candidates;
    this._applyFilterAndSort();
    this._render();
  }

  /**
   * Get currently selected candidates.
   * @returns {Object[]}
   */
  getSelected() {
    return this._candidates.filter(c => this._selectedIds.has(c.id));
  }

  /**
   * Get all candidates (respecting current filter).
   * @returns {Object[]}
   */
  getFiltered() {
    return [...this._filteredCandidates];
  }

  // ============ INTERNAL ============

  _applyFilterAndSort() {
    let data = [...this._candidates];

    // Filter
    if (this._filterText) {
      const lower = this._filterText.toLowerCase();
      data = data.filter(c =>
        (c.name || '').toLowerCase().includes(lower) ||
        (c.headline || '').toLowerCase().includes(lower) ||
        (c.company || '').toLowerCase().includes(lower) ||
        (c.location || '').toLowerCase().includes(lower) ||
        (c.skills || []).some(s => s.toLowerCase().includes(lower))
      );
    }

    // Sort
    data.sort((a, b) => {
      let va = a[this._sortColumn] || '';
      let vb = b[this._sortColumn] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return this._sortDirection === 'asc' ? cmp : -cmp;
    });

    this._filteredCandidates = data;
    this._page = 1;
  }

  _render() {
    const start = (this._page - 1) * this._pageSize;
    const pageData = this._filteredCandidates.slice(start, start + this._pageSize);
    const totalPages = Math.ceil(this._filteredCandidates.length / this._pageSize) || 1;
    const allSelected = pageData.length > 0 && pageData.every(c => this._selectedIds.has(c.id));

    let html = `
      <div class="ac-table-toolbar">
        <input type="text" class="ac-table-filter" placeholder="Filter results..." value="${this._escapeAttr(this._filterText)}" />
        <span class="ac-table-count">${this._filteredCandidates.length} candidate${this._filteredCandidates.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="ac-table-scroll">
        <table class="ac-table">
          <thead>
            <tr>
              <th class="ac-th-check"><input type="checkbox" class="ac-select-all" ${allSelected ? 'checked' : ''} /></th>
              ${this._renderSortHeader('name', 'Name')}
              ${this._renderSortHeader('headline', 'Title')}
              ${this._renderSortHeader('company', 'Company')}
              ${this._renderSortHeader('location', 'Location')}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (pageData.length === 0) {
      html += `<tr><td colspan="6" class="ac-table-empty">No candidates found</td></tr>`;
    }

    for (const c of pageData) {
      const checked = this._selectedIds.has(c.id) ? 'checked' : '';
      html += `
        <tr class="ac-table-row" data-id="${c.id}">
          <td><input type="checkbox" class="ac-row-check" data-id="${c.id}" ${checked} /></td>
          <td class="ac-td-name">
            <a href="${this._safeHref(c.profileUrl)}" target="_blank" rel="noopener">${this._escape(c.name)}</a>
          </td>
          <td class="ac-td-title">${this._escape(c.headline)}</td>
          <td>${this._escape(c.company)}</td>
          <td>${this._escape(c.location)}</td>
          <td class="ac-td-actions">
            <button class="ac-btn-sm ac-btn-analyze" data-id="${c.id}" ${c.analyzed ? 'disabled' : ''}>${c.analyzed ? 'Analyzed' : 'Analyze'}</button>
          </td>
        </tr>
      `;
    }

    html += `
          </tbody>
        </table>
      </div>
      <div class="ac-table-pagination">
        <button class="ac-btn-sm ac-page-prev" ${this._page <= 1 ? 'disabled' : ''}>Prev</button>
        <span class="ac-page-info">Page ${this._page} of ${totalPages}</span>
        <button class="ac-btn-sm ac-page-next" ${this._page >= totalPages ? 'disabled' : ''}>Next</button>
      </div>
    `;

    this._container.innerHTML = html;
    this._bindEvents();
  }

  _renderSortHeader(column, label) {
    const arrow = this._sortColumn === column
      ? (this._sortDirection === 'asc' ? ' ▲' : ' ▼')
      : '';
    return `<th class="ac-th-sortable" data-column="${column}">${label}${arrow}</th>`;
  }

  _bindEvents() {
    // Filter input
    const filterInput = this._container.querySelector('.ac-table-filter');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this._filterText = e.target.value;
        this._applyFilterAndSort();
        this._render();
      });
    }

    // Sort headers
    this._container.querySelectorAll('.ac-th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.column;
        if (this._sortColumn === col) {
          this._sortDirection = this._sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortColumn = col;
          this._sortDirection = 'asc';
        }
        this._applyFilterAndSort();
        this._render();
      });
    });

    // Select all
    const selectAll = this._container.querySelector('.ac-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const start = (this._page - 1) * this._pageSize;
        const pageData = this._filteredCandidates.slice(start, start + this._pageSize);
        pageData.forEach(c => {
          if (e.target.checked) this._selectedIds.add(c.id);
          else this._selectedIds.delete(c.id);
        });
        this._render();
      });
    }

    // Row checkboxes
    this._container.querySelectorAll('.ac-row-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) this._selectedIds.add(id);
        else this._selectedIds.delete(id);
      });
    });

    // Analyze buttons
    this._container.querySelectorAll('.ac-btn-analyze').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this._onAnalyze) this._onAnalyze(btn.dataset.id);
      });
    });

    // Pagination
    const prevBtn = this._container.querySelector('.ac-page-prev');
    const nextBtn = this._container.querySelector('.ac-page-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { this._page--; this._render(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { this._page++; this._render(); });
  }

  _escape(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  _escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _safeHref(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return this._escapeAttr(url);
    } catch {}
    return '';
  }
}

// Export
if (typeof window !== 'undefined') {
  window.ApplyCodesResultsTable = ResultsTable;
}
