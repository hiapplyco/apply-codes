// Apply Codes - Content Script for LinkedIn
// Extracts profile data and provides sidebar UI

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.applyCodesInjected) return;
  window.applyCodesInjected = true;

  // ============ PROFILE EXTRACTION ============

  function getCandidateProfile() {
    const nameElement = document.querySelector('h1');
    const name = nameElement ? nameElement.innerText.trim() : 'Unknown';

    let headline = '';
    if (nameElement) {
      const headlineElement = nameElement.parentElement?.nextElementSibling;
      if (headlineElement) {
        headline = headlineElement.innerText.trim();
      }
    }

    const experienceSection = document.getElementById('experience');
    const educationSection = document.getElementById('education');

    let experienceText = '';
    if (experienceSection) {
      experienceText = Array.from(experienceSection.querySelectorAll('ul > li'))
        .map(li => li.innerText).join('\n\n');
    }

    let educationText = '';
    if (educationSection) {
      educationText = Array.from(educationSection.querySelectorAll('ul > li'))
        .map(li => li.innerText).join('\n\n');
    }

    const profile = `
Name: ${name}
Headline: ${headline}

---
Experience:
${experienceText}

---
Education:
${educationText}
    `.trim();

    return {
      name: name,
      headline: headline,
      profile: profile,
      url: window.location.href
    };
  }

  // ============ SIDEBAR UI ============

  let sidebarVisible = false;
  let sidebar = null;
  let sidebarTab = null;

  function createSidebarTab() {
    // Don't create if already exists
    if (document.getElementById('applycodes-sidebar-tab')) return;

    // Create the tab (vertical button on right edge)
    sidebarTab = document.createElement('div');
    sidebarTab.id = 'applycodes-sidebar-tab';
    sidebarTab.innerHTML = `
      <span class="applycodes-tab-text">Apply Codes</span>
    `;
    document.body.appendChild(sidebarTab);

    // Create the sidebar panel
    sidebar = document.createElement('div');
    sidebar.id = 'applycodes-sidebar';
    sidebar.innerHTML = `
      <div class="applycodes-sidebar-header">
        <div class="applycodes-logo">
          <span class="applycodes-logo-icon">AC</span>
          <span class="applycodes-logo-text">Apply Codes</span>
        </div>
        <button class="applycodes-close-btn" title="Close">×</button>
      </div>
      <div class="applycodes-sidebar-content">
        <div class="applycodes-profile-info">
          <div class="applycodes-profile-name">Loading...</div>
          <div class="applycodes-profile-headline"></div>
        </div>

        <div class="applycodes-section">
          <div class="applycodes-section-title">AI Analysis</div>
          <div class="applycodes-actions">
            <button class="applycodes-btn applycodes-btn-primary" id="applycodes-evaluate">
              <span class="btn-icon">✨</span> Evaluate Candidate
            </button>
            <button class="applycodes-btn" id="applycodes-message">
              <span class="btn-icon">✉️</span> Generate Outreach
            </button>
          </div>
        </div>

        <div class="applycodes-section">
          <div class="applycodes-section-title">Contact Enrichment</div>
          <div class="applycodes-actions">
            <button class="applycodes-btn" id="applycodes-contact">
              <span class="btn-icon">📧</span> Nymeria (Contact Info)
            </button>
            <button class="applycodes-btn applycodes-btn-secondary" id="applycodes-pdl">
              <span class="btn-icon">🔍</span> PDL Enrich
            </button>
            <button class="applycodes-btn applycodes-btn-secondary" id="applycodes-hunter">
              <span class="btn-icon">📬</span> Hunter.io Email
            </button>
          </div>
        </div>

        <div class="applycodes-enrichment-results" id="applycodes-enrichment-results"></div>
        <div class="applycodes-results" id="applycodes-results"></div>

        <div class="applycodes-section applycodes-chat-section">
          <div class="applycodes-section-title">AI Assistant</div>
          <div class="applycodes-chat-container" id="applycodes-chat-container">
            <div class="applycodes-chat-messages" id="applycodes-chat-messages"></div>
            <div class="applycodes-chat-input-container">
              <input type="text" id="applycodes-chat-input" placeholder="Ask about this candidate..." />
              <button class="applycodes-chat-send" id="applycodes-chat-send">Send</button>
            </div>
          </div>
        </div>

        <div class="applycodes-footer">
          <a href="#" id="applycodes-open-popup">Open Full Extension</a>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    // Inject styles
    injectStyles();

    // Event listeners
    sidebarTab.addEventListener('click', toggleSidebar);
    sidebar.querySelector('.applycodes-close-btn').addEventListener('click', closeSidebar);
    sidebar.querySelector('#applycodes-evaluate').addEventListener('click', evaluateCandidate);
    sidebar.querySelector('#applycodes-contact').addEventListener('click', getContactInfo);
    sidebar.querySelector('#applycodes-message').addEventListener('click', generateOutreach);
    sidebar.querySelector('#applycodes-pdl').addEventListener('click', pdlEnrich);
    sidebar.querySelector('#applycodes-hunter').addEventListener('click', hunterSearch);
    sidebar.querySelector('#applycodes-chat-send').addEventListener('click', sendChatMessage);
    sidebar.querySelector('#applycodes-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
    sidebar.querySelector('#applycodes-open-popup').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });

    // Load profile info
    updateProfileInfo();
  }

  function injectStyles() {
    if (document.getElementById('applycodes-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'applycodes-styles';
    styles.textContent = `
      #applycodes-sidebar-tab {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        padding: 12px 8px;
        border-radius: 8px 0 0 8px;
        cursor: pointer;
        z-index: 999999;
        box-shadow: -2px 0 10px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      #applycodes-sidebar-tab:hover {
        padding-right: 12px;
        box-shadow: -4px 0 15px rgba(0,0,0,0.2);
      }

      #applycodes-sidebar-tab.hidden {
        display: none;
      }

      .applycodes-tab-text {
        display: block;
      }

      #applycodes-sidebar {
        position: fixed;
        right: -380px;
        top: 0;
        width: 360px;
        height: 100vh;
        background: white;
        box-shadow: -4px 0 20px rgba(0,0,0,0.15);
        z-index: 999998;
        transition: right 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
      }

      #applycodes-sidebar.visible {
        right: 0;
      }

      .applycodes-sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
      }

      .applycodes-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .applycodes-logo-icon {
        background: white;
        color: #6366f1;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 12px;
      }

      .applycodes-logo-text {
        font-weight: 600;
        font-size: 16px;
      }

      .applycodes-close-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .applycodes-close-btn:hover {
        background: rgba(255,255,255,0.3);
      }

      .applycodes-sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .applycodes-profile-info {
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .applycodes-profile-name {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 4px;
      }

      .applycodes-profile-headline {
        font-size: 13px;
        color: #6b7280;
        line-height: 1.4;
      }

      .applycodes-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 20px;
      }

      .applycodes-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        color: #374151;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
      }

      .applycodes-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
      }

      .applycodes-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .applycodes-btn-primary {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: none;
      }

      .applycodes-btn-primary:hover {
        opacity: 0.9;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      }

      .btn-icon {
        font-size: 16px;
      }

      .applycodes-results {
        background: #f9fafb;
        border-radius: 8px;
        padding: 12px;
        min-height: 100px;
        font-size: 13px;
        line-height: 1.5;
        color: #374151;
      }

      .applycodes-results:empty::before {
        content: 'Results will appear here...';
        color: #9ca3af;
        font-style: italic;
      }

      .applycodes-results .loading {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #6366f1;
      }

      .applycodes-results .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #e5e7eb;
        border-top-color: #6366f1;
        border-radius: 50%;
        animation: applycodes-spin 0.8s linear infinite;
      }

      @keyframes applycodes-spin {
        to { transform: rotate(360deg); }
      }

      .applycodes-results .error {
        color: #dc2626;
        background: #fef2f2;
        padding: 10px;
        border-radius: 6px;
      }

      .applycodes-results .success {
        color: #059669;
      }

      .applycodes-results h4 {
        margin: 0 0 8px 0;
        font-size: 14px;
        color: #1f2937;
      }

      .applycodes-results p {
        margin: 6px 0;
      }

      .applycodes-results ul {
        margin: 8px 0;
        padding-left: 20px;
      }

      .applycodes-results li {
        margin: 4px 0;
      }

      .applycodes-footer {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      }

      .applycodes-footer a {
        color: #6366f1;
        text-decoration: none;
        font-size: 13px;
      }

      .applycodes-footer a:hover {
        text-decoration: underline;
      }

      .applycodes-copy-btn {
        background: #6366f1;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        margin-top: 8px;
      }

      .applycodes-copy-btn:hover {
        background: #4f46e5;
      }

      .applycodes-copy-btn.copied {
        background: #059669;
      }

      /* Sections */
      .applycodes-section {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .applycodes-section-title {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }

      .applycodes-btn-secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
      }

      .applycodes-btn-secondary:hover {
        background: #e5e7eb;
      }

      /* Enrichment Results */
      .applycodes-enrichment-results {
        margin-bottom: 12px;
      }

      .applycodes-enrichment-results:empty {
        display: none;
      }

      .enrichment-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }

      .enrichment-card.error {
        background: #fef2f2;
        border-color: #fecaca;
      }

      .enrichment-source {
        font-size: 12px;
        font-weight: 600;
        color: #6366f1;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .enrichment-error {
        color: #dc2626;
        font-size: 13px;
      }

      .enrichment-field {
        margin-bottom: 8px;
      }

      .field-label {
        font-size: 11px;
        font-weight: 500;
        color: #6b7280;
        display: block;
        margin-bottom: 2px;
      }

      .enrichment-value {
        font-size: 13px;
        color: #1f2937;
      }

      .enrichment-value.copyable {
        cursor: pointer;
        padding: 4px 8px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }

      .enrichment-value.copyable:hover {
        border-color: #6366f1;
        background: #f5f3ff;
      }

      .copy-hint {
        font-size: 10px;
        color: #9ca3af;
      }

      .enrichment-value.verified {
        color: #059669;
        font-weight: 500;
      }

      .enrichment-value a {
        color: #6366f1;
        text-decoration: none;
        margin-right: 8px;
      }

      .enrichment-value a:hover {
        text-decoration: underline;
      }

      .enrichment-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }

      .enrichment-tags .tag {
        background: #e0e7ff;
        color: #4338ca;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
      }

      /* Chat Section */
      .applycodes-chat-section {
        border-bottom: none;
      }

      .applycodes-chat-container {
        background: #f9fafb;
        border-radius: 8px;
        overflow: hidden;
      }

      .applycodes-chat-messages {
        max-height: 200px;
        min-height: 80px;
        overflow-y: auto;
        padding: 10px;
      }

      .applycodes-chat-messages:empty::before {
        content: 'Ask anything about this candidate...';
        color: #9ca3af;
        font-size: 12px;
        font-style: italic;
      }

      .applycodes-chat-message {
        margin-bottom: 8px;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.4;
        max-width: 90%;
      }

      .applycodes-chat-message.user {
        background: #6366f1;
        color: white;
        margin-left: auto;
        text-align: right;
      }

      .applycodes-chat-message.assistant {
        background: white;
        border: 1px solid #e5e7eb;
        color: #374151;
      }

      .applycodes-chat-message.assistant.loading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #6b7280;
      }

      .applycodes-chat-message.assistant.error {
        background: #fef2f2;
        border-color: #fecaca;
        color: #dc2626;
      }

      .applycodes-chat-input-container {
        display: flex;
        gap: 8px;
        padding: 10px;
        border-top: 1px solid #e5e7eb;
        background: white;
      }

      #applycodes-chat-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 13px;
        outline: none;
      }

      #applycodes-chat-input:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
      }

      .applycodes-chat-send {
        padding: 8px 16px;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .applycodes-chat-send:hover {
        background: #4f46e5;
      }
    `;
    document.head.appendChild(styles);
  }

  function toggleSidebar() {
    if (sidebarVisible) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('visible');
    sidebarTab.classList.add('hidden');
    sidebarVisible = true;
    updateProfileInfo();
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('visible');
    sidebarTab.classList.remove('hidden');
    sidebarVisible = false;
  }

  function updateProfileInfo() {
    if (!sidebar) return;
    const profile = getCandidateProfile();
    sidebar.querySelector('.applycodes-profile-name').textContent = profile.name;
    sidebar.querySelector('.applycodes-profile-headline').textContent = profile.headline || 'LinkedIn Member';
  }

  function showLoading(message) {
    const results = sidebar.querySelector('#applycodes-results');
    results.innerHTML = `<div class="loading"><div class="spinner"></div><span>${message}...</span></div>`;
  }

  function showError(message) {
    const results = sidebar.querySelector('#applycodes-results');
    results.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
  }

  function showResults(html) {
    const results = sidebar.querySelector('#applycodes-results');
    results.innerHTML = html;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============ SIDEBAR ACTIONS ============

  async function evaluateCandidate() {
    showLoading('Evaluating candidate');
    try {
      const profile = getCandidateProfile();
      const response = await chrome.runtime.sendMessage({
        action: 'evaluateCandidate',
        data: { candidate: profile }
      });

      if (response?.success) {
        let html = `<h4>Analysis Complete</h4>`;
        html += `<p><strong>Score:</strong> ${escapeHtml(response.match_score || 'N/A')}%</p>`;
        html += `<p><strong>Recommendation:</strong> ${escapeHtml(response.recommendation || 'N/A')}</p>`;
        html += `<p>${escapeHtml(response.summary || '')}</p>`;

        if (response.strengths?.length) {
          html += `<h4>Strengths</h4><ul>`;
          response.strengths.forEach(s => { html += `<li>${escapeHtml(s)}</li>`; });
          html += `</ul>`;
        }
        showResults(html);
      } else {
        showError(response?.error || 'Evaluation failed');
      }
    } catch (error) {
      showError(error.message);
    }
  }

  async function getContactInfo() {
    showLoading('Finding contact info');
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getContactInfo',
        data: { profileUrl: window.location.href }
      });

      if (response?.error) {
        showError(response.error);
      } else if (response?.email || response?.phone) {
        let html = `<h4>Contact Info Found</h4>`;
        if (response.email) {
          html += `<p><strong>Email:</strong> ${escapeHtml(response.email)}</p>`;
        }
        if (response.phone) {
          html += `<p><strong>Phone:</strong> ${escapeHtml(response.phone)}</p>`;
        }
        if (response.work_email) {
          html += `<p><strong>Work:</strong> ${escapeHtml(response.work_email)}</p>`;
        }
        showResults(html);
      } else {
        showResults('<p>No contact information found.</p>');
      }
    } catch (error) {
      showError(error.message);
    }
  }

  async function generateOutreach() {
    showLoading('Generating outreach message');
    try {
      const profile = getCandidateProfile();
      const response = await chrome.runtime.sendMessage({
        action: 'generateOutreach',
        data: {
          candidateName: profile.name,
          candidateHeadline: profile.headline
        }
      });

      if (response?.success && response.content) {
        let html = `<h4>Outreach Message</h4>`;
        html += `<p style="white-space: pre-wrap;">${escapeHtml(response.content)}</p>`;
        html += `<button class="applycodes-copy-btn" onclick="navigator.clipboard.writeText(${JSON.stringify(response.content)}).then(() => { this.textContent = 'Copied!'; this.classList.add('copied'); setTimeout(() => { this.textContent = 'Copy'; this.classList.remove('copied'); }, 2000); })">Copy</button>`;
        showResults(html);
      } else {
        showError(response?.error || 'Generation failed');
      }
    } catch (error) {
      showError(error.message);
    }
  }

  async function pdlEnrich() {
    showEnrichmentLoading('Enriching via People Data Labs');
    try {
      const profile = getCandidateProfile();
      // Extract LinkedIn username from URL
      const urlMatch = window.location.href.match(/linkedin\.com\/in\/([^/]+)/);
      const linkedinUsername = urlMatch ? urlMatch[1] : null;

      const response = await chrome.runtime.sendMessage({
        action: 'pdlEnrich',
        data: {
          searchType: 'person_enrich',
          searchParams: {
            profile: linkedinUsername ? `linkedin.com/in/${linkedinUsername}` : undefined,
            first_name: profile.name.split(' ')[0],
            last_name: profile.name.split(' ').slice(1).join(' ')
          }
        }
      });

      if (response?.error) {
        showEnrichmentError('PDL', response.error);
      } else if (response?.data) {
        showEnrichmentResult('PDL', response.data);
      } else {
        showEnrichmentError('PDL', 'No data found');
      }
    } catch (error) {
      showEnrichmentError('PDL', error.message);
    }
  }

  async function hunterSearch() {
    showEnrichmentLoading('Finding email via Hunter.io');
    try {
      const profile = getCandidateProfile();
      // Try to extract company domain from headline or page
      const companyElement = document.querySelector('[data-field="experience"]') ||
                            document.querySelector('.pv-text-details__right-panel');
      let company = '';
      if (companyElement) {
        company = companyElement.textContent?.trim().split('\n')[0] || '';
      }

      // Get first name and last name
      const nameParts = profile.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const response = await chrome.runtime.sendMessage({
        action: 'hunterSearch',
        data: {
          searchType: 'email_finder',
          firstName: firstName,
          lastName: lastName,
          company: company
        }
      });

      if (response?.error) {
        showEnrichmentError('Hunter.io', response.error);
      } else if (response?.data?.email) {
        showHunterResult(response.data);
      } else {
        showEnrichmentError('Hunter.io', 'No email found. Try providing company domain.');
      }
    } catch (error) {
      showEnrichmentError('Hunter.io', error.message);
    }
  }

  // Chat history for context
  let chatHistory = [];

  async function sendChatMessage() {
    const input = sidebar.querySelector('#applycodes-chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    const messagesContainer = sidebar.querySelector('#applycodes-chat-messages');

    // Add user message
    messagesContainer.innerHTML += `
      <div class="applycodes-chat-message user">
        <span>${escapeHtml(message)}</span>
      </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add loading indicator
    messagesContainer.innerHTML += `
      <div class="applycodes-chat-message assistant loading" id="chat-loading">
        <div class="spinner"></div>
        <span>Thinking...</span>
      </div>
    `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      const profile = getCandidateProfile();
      chatHistory.push({ role: 'user', content: message });

      const response = await chrome.runtime.sendMessage({
        action: 'chatAssistant',
        data: {
          message: message,
          context: {
            candidateName: profile.name,
            candidateHeadline: profile.headline,
            candidateProfile: profile.profile,
            linkedinUrl: window.location.href
          },
          history: chatHistory.slice(-10) // Keep last 10 messages for context
        }
      });

      // Remove loading
      const loadingEl = messagesContainer.querySelector('#chat-loading');
      if (loadingEl) loadingEl.remove();

      if (response?.error) {
        messagesContainer.innerHTML += `
          <div class="applycodes-chat-message assistant error">
            <span>${escapeHtml(response.error)}</span>
          </div>
        `;
      } else {
        const assistantMessage = response?.response || response?.content || 'No response';
        chatHistory.push({ role: 'assistant', content: assistantMessage });
        messagesContainer.innerHTML += `
          <div class="applycodes-chat-message assistant">
            <span>${escapeHtml(assistantMessage)}</span>
          </div>
        `;
      }
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      const loadingEl = messagesContainer.querySelector('#chat-loading');
      if (loadingEl) loadingEl.remove();
      messagesContainer.innerHTML += `
        <div class="applycodes-chat-message assistant error">
          <span>${escapeHtml(error.message)}</span>
        </div>
      `;
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function showEnrichmentLoading(message) {
    const results = sidebar.querySelector('#applycodes-enrichment-results');
    results.innerHTML = `<div class="loading"><div class="spinner"></div><span>${message}...</span></div>`;
  }

  function showEnrichmentError(source, message) {
    const results = sidebar.querySelector('#applycodes-enrichment-results');
    results.innerHTML = `
      <div class="enrichment-card error">
        <div class="enrichment-source">${escapeHtml(source)}</div>
        <div class="enrichment-error">${escapeHtml(message)}</div>
      </div>
    `;
  }

  function showEnrichmentResult(source, data) {
    const results = sidebar.querySelector('#applycodes-enrichment-results');
    let html = `<div class="enrichment-card">`;
    html += `<div class="enrichment-source">${escapeHtml(source)} Enrichment</div>`;

    // Emails
    if (data.emails?.length) {
      html += `<div class="enrichment-field">
        <span class="field-label">Emails:</span>
        ${data.emails.map(e => `<div class="enrichment-value copyable" onclick="navigator.clipboard.writeText('${escapeHtml(e)}')">${escapeHtml(e)} <span class="copy-hint">click to copy</span></div>`).join('')}
      </div>`;
    }

    // Phone numbers
    if (data.phone_numbers?.length) {
      html += `<div class="enrichment-field">
        <span class="field-label">Phone:</span>
        ${data.phone_numbers.map(p => `<div class="enrichment-value copyable" onclick="navigator.clipboard.writeText('${escapeHtml(p)}')">${escapeHtml(p)} <span class="copy-hint">click to copy</span></div>`).join('')}
      </div>`;
    }

    // Current job
    if (data.job_title || data.job_company_name) {
      html += `<div class="enrichment-field">
        <span class="field-label">Current Role:</span>
        <div class="enrichment-value">${escapeHtml(data.job_title || '')} ${data.job_company_name ? 'at ' + escapeHtml(data.job_company_name) : ''}</div>
      </div>`;
    }

    // Location
    if (data.location_locality || data.location_region) {
      html += `<div class="enrichment-field">
        <span class="field-label">Location:</span>
        <div class="enrichment-value">${escapeHtml([data.location_locality, data.location_region, data.location_country].filter(Boolean).join(', '))}</div>
      </div>`;
    }

    // Social profiles
    if (data.github_url || data.twitter_url || data.facebook_url) {
      html += `<div class="enrichment-field">
        <span class="field-label">Social:</span>
        <div class="enrichment-value">
          ${data.github_url ? `<a href="${escapeHtml(data.github_url)}" target="_blank">GitHub</a>` : ''}
          ${data.twitter_url ? `<a href="${escapeHtml(data.twitter_url)}" target="_blank">Twitter</a>` : ''}
          ${data.facebook_url ? `<a href="${escapeHtml(data.facebook_url)}" target="_blank">Facebook</a>` : ''}
        </div>
      </div>`;
    }

    // Skills
    if (data.skills?.length) {
      html += `<div class="enrichment-field">
        <span class="field-label">Skills:</span>
        <div class="enrichment-tags">${data.skills.slice(0, 8).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>
      </div>`;
    }

    html += `</div>`;
    results.innerHTML = html;
  }

  function showHunterResult(data) {
    const results = sidebar.querySelector('#applycodes-enrichment-results');
    let html = `<div class="enrichment-card">`;
    html += `<div class="enrichment-source">Hunter.io Email Finder</div>`;

    if (data.email) {
      html += `<div class="enrichment-field">
        <span class="field-label">Email:</span>
        <div class="enrichment-value copyable" onclick="navigator.clipboard.writeText('${escapeHtml(data.email)}')">${escapeHtml(data.email)} <span class="copy-hint">click to copy</span></div>
      </div>`;
    }

    if (data.score) {
      html += `<div class="enrichment-field">
        <span class="field-label">Confidence:</span>
        <div class="enrichment-value">${data.score}%</div>
      </div>`;
    }

    if (data.position) {
      html += `<div class="enrichment-field">
        <span class="field-label">Position:</span>
        <div class="enrichment-value">${escapeHtml(data.position)}</div>
      </div>`;
    }

    if (data.verification?.status) {
      html += `<div class="enrichment-field">
        <span class="field-label">Verification:</span>
        <div class="enrichment-value ${data.verification.status === 'valid' ? 'verified' : ''}">${escapeHtml(data.verification.status)}</div>
      </div>`;
    }

    html += `</div>`;
    results.innerHTML = html;
  }

  // ============ MESSAGE LISTENER ============

  function messageListener(request, sender, sendResponse) {
    if (request.action === 'ping') {
      sendResponse({ status: 'ready' });
      return true;
    }
    if (request.action === 'get-candidate-profile') {
      sendResponse(getCandidateProfile());
      return true;
    }
    if (request.action === 'openSidebar') {
      openSidebar();
      sendResponse({ success: true });
      return true;
    }
    if (request.action === 'closeSidebar') {
      closeSidebar();
      sendResponse({ success: true });
      return true;
    }
    return true;
  }

  chrome.runtime.onMessage.addListener(messageListener);

  // ============ INITIALIZATION ============

  // Create sidebar tab on LinkedIn profile pages
  if (window.location.href.includes('linkedin.com/in/')) {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createSidebarTab);
    } else {
      createSidebarTab();
    }

    // Also observe for SPA navigation
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        if (url.includes('linkedin.com/in/')) {
          setTimeout(updateProfileInfo, 500);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Cleanup on page visibility change (replaces deprecated unload)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Cleanup if needed
    }
  });

})();
