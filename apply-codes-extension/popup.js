// Apply Codes Extension - Popup Script
// Full-featured extension with project context, Perplexity search, URL scraping, and backend persistence

const FIREBASE_PROJECT_ID = 'applycodes-2683f';
const FIREBASE_API_KEY = 'AIzaSyB2gdbYSgiRI5n0ckjEIu_rtS4RzM3ezho';
const FUNCTIONS_URL = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

// Callable functions (onCall) - wrap in { data: {...} }
// Most functions are HTTP (onRequest) and expect data directly
const CALLABLE_FUNCTIONS = ['analyzeCandidate', 'generateBooleanSearch'];

// State
let currentUser = null;
let idToken = null;
let projects = [];
let selectedProjectId = null;
let lastScrapedContent = null;

// ============ UTILITY FUNCTIONS ============

// XSS Prevention: Escape HTML entities
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Input validation
function validateInput(value, options = {}) {
  const { minLength = 0, maxLength = 10000, required = false, fieldName = 'Input' } = options;
  const trimmed = (value || '').trim();
  if (required && !trimmed) throw new Error(`${fieldName} is required`);
  if (trimmed.length < minLength) throw new Error(`${fieldName} must be at least ${minLength} characters`);
  if (trimmed.length > maxLength) throw new Error(`${fieldName} must be less than ${maxLength} characters`);
  return trimmed;
}

// User-friendly error messages
const ERROR_MESSAGES = {
  'Failed to fetch': { message: 'Unable to connect to server', suggestion: 'Check your internet connection and try again.' },
  'NetworkError': { message: 'Network connection lost', suggestion: 'Check your internet connection.' },
  'AbortError': { message: 'Request timed out', suggestion: 'Please try again.' },
  '401': { message: 'Session expired', suggestion: 'Please sign in again.' },
  '403': { message: 'Access denied', suggestion: 'Please sign in with an authorized account.' },
  '429': { message: 'Too many requests', suggestion: 'Please wait a moment and try again.' },
  '500': { message: 'Server error', suggestion: 'Please try again later.' },
};

function getUserFriendlyError(error) {
  const msg = error?.message || String(error);
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return value;
  }
  return { message: 'Something went wrong', suggestion: 'Please try again.' };
}

// Show loading with spinner
function showLoading(container, message) {
  container.innerHTML = `
    <div class="loading-container" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <span class="loading-text">${escapeHtml(message)}...</span>
    </div>
  `;
}

// Show error with friendly message
function showError(container, error) {
  const friendly = getUserFriendlyError(error);
  container.innerHTML = `
    <div class="error-container" role="alert">
      <div class="error-icon" aria-hidden="true">!</div>
      <div class="error-content">
        <p class="error-message">${escapeHtml(friendly.message)}</p>
        <p class="error-suggestion">${escapeHtml(friendly.suggestion)}</p>
      </div>
    </div>
  `;
}

// Show success message
function showSuccess(container, message) {
  container.innerHTML = `
    <div class="success-container" role="status">
      <div class="success-icon" aria-hidden="true">✓</div>
      <div class="error-content">
        <p class="error-message" style="color: #059669;">${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

// Safe render for lists
function renderSafeList(items, container) {
  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  container.appendChild(ul);
}

// Display boolean search explanation
function displayBooleanExplanation(explanation, searchString) {
  // Remove any existing explanation
  const existingExplanation = document.querySelector('.boolean-explanation-container');
  if (existingExplanation) existingExplanation.remove();

  const container = document.createElement('div');
  container.className = 'boolean-explanation-container';

  if (explanation?.error) {
    container.innerHTML = `
      <div class="explanation-header">
        <span class="explanation-title">Explanation</span>
        <button class="explanation-close" aria-label="Close">&times;</button>
      </div>
      <div class="explanation-error">${escapeHtml(explanation.error)}</div>
    `;
  } else {
    let html = `
      <div class="explanation-header">
        <span class="explanation-title">Search Explanation</span>
        <button class="explanation-close" aria-label="Close">&times;</button>
      </div>
    `;

    // Summary
    if (explanation?.summary) {
      html += `<div class="explanation-summary">${escapeHtml(explanation.summary)}</div>`;
    }

    // Primary target
    if (explanation?.structure?.primaryTarget) {
      html += `<div class="explanation-target">
        <span class="target-label">Target:</span> ${escapeHtml(explanation.structure.primaryTarget)}
      </div>`;
    }

    // Breakdown
    if (explanation?.structure?.breakdown?.length) {
      html += `<div class="explanation-breakdown"><span class="breakdown-label">Components:</span>`;
      explanation.structure.breakdown.forEach(comp => {
        const visualClass = comp.visual || 'secondary';
        html += `
          <div class="breakdown-item ${visualClass}">
            <span class="breakdown-operator">${escapeHtml(comp.operator || '')}</span>
            <span class="breakdown-meaning">${escapeHtml(comp.meaning || comp.component)}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    // Location logic
    if (explanation?.locationLogic?.areas?.length) {
      html += `<div class="explanation-locations">
        <span class="locations-label">Locations:</span>
        ${explanation.locationLogic.areas.map(a => `<span class="location-tag">${escapeHtml(a)}</span>`).join('')}
      </div>`;
    }

    // Exclusions
    if (explanation?.exclusions?.terms?.length) {
      html += `<div class="explanation-exclusions">
        <span class="exclusions-label">Excluded:</span>
        ${explanation.exclusions.terms.map(t => `<span class="exclusion-tag">${escapeHtml(t)}</span>`).join('')}
      </div>`;
    }

    // Tips
    if (explanation?.tips?.length) {
      html += `<div class="explanation-tips">`;
      explanation.tips.forEach(tip => {
        html += `<div class="tip-item">${escapeHtml(tip)}</div>`;
      });
      html += `</div>`;
    }

    container.innerHTML = html;
  }

  // Insert after the boolean results
  const booleanResults = document.getElementById('booleanResults');
  if (booleanResults) {
    booleanResults.insertAdjacentElement('afterend', container);
  }

  // Add close handler
  container.querySelector('.explanation-close')?.addEventListener('click', () => {
    container.remove();
  });
}

// Clear all results
function clearAllResults() {
  document.getElementById('results').innerHTML = '';
  document.getElementById('boolean-results').innerHTML = '';
  document.getElementById('content-results').innerHTML = '';
  document.getElementById('perplexity-results').innerHTML = '';
  document.getElementById('scrape-results').innerHTML = '';
}

// ============ MAIN APPLICATION ============

document.addEventListener('DOMContentLoaded', async function() {
  // Views
  const onboardingView = document.getElementById('onboarding-view');
  const loginView = document.getElementById('login-view');
  const mainView = document.getElementById('main-view');
  const generateBooleanView = document.getElementById('generate-boolean-view');
  const generateContentView = document.getElementById('generate-content-view');
  const perplexitySearchView = document.getElementById('perplexity-search-view');
  const urlScrapeView = document.getElementById('url-scrape-view');

  // Buttons
  const startOnboardingButton = document.getElementById('start-onboarding');
  const loginButton = document.getElementById('login-google');
  const logoutButton = document.getElementById('logout');
  const evaluateCandidateButton = document.getElementById('evaluate-candidate');
  const getContactInfoButton = document.getElementById('get-contact-info');
  const showGenerateBooleanButton = document.getElementById('show-generate-boolean');
  const backToMainFromBooleanButton = document.getElementById('back-to-main-from-boolean');
  const generateBooleanActionButton = document.getElementById('generate-boolean-action');
  const showGenerateContentButton = document.getElementById('show-generate-content');
  const backToMainFromContentButton = document.getElementById('back-to-main-from-content');
  const generateContentActionButton = document.getElementById('generate-content-action');
  const skipLoginButton = document.getElementById('skip-login');
  const showPerplexitySearchButton = document.getElementById('show-perplexity-search');
  const backToMainFromPerplexityButton = document.getElementById('back-to-main-from-perplexity');
  const perplexitySearchActionButton = document.getElementById('perplexity-search-action');
  const showUrlScrapeButton = document.getElementById('show-url-scrape');
  const backToMainFromScrapeButton = document.getElementById('back-to-main-from-scrape');
  const scrapeUrlActionButton = document.getElementById('scrape-url-action');
  const useScrapedContentButton = document.getElementById('use-scraped-content');

  // Inputs
  const jobRequirements = document.getElementById('job-requirements');
  const jobTitleInput = document.getElementById('job-title');
  const jobDescriptionInput = document.getElementById('job-description');
  const contentPromptInput = document.getElementById('content-prompt');
  const perplexityQueryInput = document.getElementById('perplexity-query');
  const scrapeUrlInput = document.getElementById('scrape-url');
  const projectSelect = document.getElementById('project-select');
  const projectHint = document.getElementById('project-hint');

  // Results
  const resultsDiv = document.getElementById('results');
  const booleanResultsDiv = document.getElementById('boolean-results');
  const contentResultsDiv = document.getElementById('content-results');
  const perplexityResultsDiv = document.getElementById('perplexity-results');
  const scrapeResultsDiv = document.getElementById('scrape-results');
  const userEmailSpan = document.getElementById('user-email');

  // ============ VIEW MANAGEMENT ============

  function hideAllViews() {
    onboardingView.style.display = 'none';
    loginView.style.display = 'none';
    mainView.style.display = 'none';
    generateBooleanView.style.display = 'none';
    generateContentView.style.display = 'none';
    perplexitySearchView.style.display = 'none';
    urlScrapeView.style.display = 'none';
  }

  function showOnboardingView() {
    hideAllViews();
    onboardingView.style.display = 'block';
  }

  function showLoginView() {
    hideAllViews();
    loginView.style.display = 'block';
  }

  function showMainView() {
    hideAllViews();
    mainView.style.display = 'block';
    if (currentUser) {
      userEmailSpan.textContent = currentUser.email || 'Guest User';
    }
    // Load projects if user is authenticated
    if (idToken) {
      loadProjects();
    }
  }

  // ============ PROJECT MANAGEMENT ============

  async function loadProjects() {
    try {
      const result = await callFirebaseFunction('getProjects', {});
      if (result.success && result.projects) {
        projects = result.projects;
        populateProjectSelect();

        // Restore previously selected project
        const stored = await chrome.storage.local.get(['selectedProjectId']);
        if (stored.selectedProjectId) {
          const exists = projects.find(p => p.id === stored.selectedProjectId);
          if (exists) {
            selectedProjectId = stored.selectedProjectId;
            projectSelect.value = selectedProjectId;
            updateProjectHint();
          }
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Non-critical, don't show error to user
    }
  }

  function populateProjectSelect() {
    // Clear existing options except the first one
    while (projectSelect.options.length > 1) {
      projectSelect.remove(1);
    }

    // Add project options
    projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name;
      projectSelect.appendChild(option);
    });
  }

  function updateProjectHint() {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      projectHint.textContent = `Saving to: ${project?.name || 'Selected Project'}`;
      projectHint.classList.add('active');
    } else {
      projectHint.textContent = 'Select a project to save candidates and use project context';
      projectHint.classList.remove('active');
    }
  }

  projectSelect.addEventListener('change', async () => {
    selectedProjectId = projectSelect.value || null;
    await chrome.storage.local.set({ selectedProjectId });
    updateProjectHint();
  });

  // ============ INITIALIZATION ============

  // Refresh Firebase ID token using refresh token
  async function refreshIdToken(refreshToken) {
    try {
      const response = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`
        }
      );
      const data = await response.json();
      if (data.id_token) {
        return data.id_token;
      }
      throw new Error(data.error?.message || 'Token refresh failed');
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Check for stored user session and onboarding status
  const stored = await chrome.storage.local.get(['user', 'idToken', 'refreshToken', 'hasSeenOnboarding', 'selectedProjectId', 'oauthPending']);

  console.log('Popup init - stored data:', {
    hasUser: !!stored.user,
    hasIdToken: !!stored.idToken,
    hasRefreshToken: !!stored.refreshToken,
    hasSeenOnboarding: stored.hasSeenOnboarding,
    oauthPending: stored.oauthPending,
    userEmail: stored.user?.email
  });

  if (stored.user && stored.refreshToken) {
    currentUser = stored.user;
    selectedProjectId = stored.selectedProjectId || null;

    // Always refresh the ID token to ensure it's valid
    console.log('Popup init - refreshing token...');
    const newIdToken = await refreshIdToken(stored.refreshToken);
    if (newIdToken) {
      idToken = newIdToken;
      await chrome.storage.local.set({ idToken: newIdToken });
      console.log('Popup init - token refreshed, showing main view');
      showMainView();
    } else if (stored.idToken) {
      // Refresh failed but we have an existing idToken - try using it
      // It may be expired but let API calls fail naturally
      console.log('Popup init - token refresh failed, using existing idToken');
      idToken = stored.idToken;
      showMainView();
    } else {
      // No valid tokens, require re-login
      console.log('Popup init - no valid tokens, clearing credentials');
      await chrome.storage.local.remove(['user', 'idToken', 'refreshToken']);
      showLoginView();
    }
  } else if (stored.user && stored.idToken) {
    // Have user and idToken but no refreshToken (shouldn't happen, but handle it)
    console.log('Popup init - have user and idToken but no refreshToken');
    currentUser = stored.user;
    idToken = stored.idToken;
    selectedProjectId = stored.selectedProjectId || null;
    showMainView();
  } else if (!stored.hasSeenOnboarding) {
    console.log('Popup init - showing onboarding');
    showOnboardingView();
  } else {
    console.log('Popup init - no credentials, showing login');
    showLoginView();
  }

  // ============ ONBOARDING ============

  if (startOnboardingButton) {
    startOnboardingButton.addEventListener('click', async () => {
      await chrome.storage.local.set({ hasSeenOnboarding: true });
      showLoginView();
    });
  }

  // ============ AUTHENTICATION ============

  loginButton.addEventListener('click', async () => {
    try {
      loginButton.textContent = 'Signing in...';
      loginButton.disabled = true;

      console.log('Popup: Requesting OAuth via background script...');

      // Mark that we're waiting for OAuth (for polling)
      await chrome.storage.local.set({ oauthPending: true });

      // Send OAuth request to background script (which persists when popup closes)
      // Don't await - start polling immediately since popup may close
      chrome.runtime.sendMessage({ action: 'startOAuth' });

      // Poll for auth completion (handles case where popup stays open)
      const pollForAuth = async () => {
        for (let i = 0; i < 120; i++) { // Poll for up to 2 minutes
          await new Promise(resolve => setTimeout(resolve, 500));

          const stored = await chrome.storage.local.get(['user', 'idToken', 'oauthPending']);

          // Check if OAuth completed (user stored and pending flag cleared)
          if (stored.user && stored.idToken && !stored.oauthPending) {
            currentUser = stored.user;
            idToken = stored.idToken;
            console.log('Popup: Auth detected via polling:', currentUser.email);
            showMainView();
            return true;
          }

          // Check if OAuth was cancelled/failed (pending cleared but no user)
          if (!stored.oauthPending && !stored.user) {
            console.log('Popup: OAuth cancelled or failed');
            return false;
          }
        }
        return false;
      };

      const success = await pollForAuth();
      if (!success) {
        await chrome.storage.local.remove(['oauthPending']);
      }

    } catch (error) {
      console.error('Sign-in error:', error);
      await chrome.storage.local.remove(['oauthPending']);
    } finally {
      loginButton.textContent = 'Sign in with Google';
      loginButton.disabled = false;
    }
  });

  // Skip login / Continue as guest
  if (skipLoginButton) {
    skipLoginButton.addEventListener('click', async () => {
      currentUser = { email: 'Guest', uid: null };
      idToken = null;
      await chrome.storage.local.set({ user: currentUser });
      showMainView();
    });
  }

  // Logout
  logoutButton.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to sign out?')) return;
    currentUser = null;
    idToken = null;
    selectedProjectId = null;
    projects = [];
    await chrome.storage.local.remove(['user', 'idToken', 'refreshToken', 'selectedProjectId']);
    clearAllResults();
    showLoginView();
  });

  // ============ CANDIDATE EVALUATION ============

  evaluateCandidateButton.addEventListener('click', async () => {
    showLoading(resultsDiv, 'Evaluating candidate');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url?.includes('linkedin.com/in/')) {
        showError(resultsDiv, { message: 'Wrong page', suggestion: 'Please navigate to a LinkedIn profile page.' });
        return;
      }

      // Check if content script is loaded
      let profileData;
      try {
        profileData = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      } catch (e) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get profile data with retry
      let response;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await chrome.tabs.sendMessage(tab.id, { action: 'get-candidate-profile' });
          if (response) break;
        } catch (e) {
          if (attempt === 2) throw new Error('Could not communicate with page. Please refresh and try again.');
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      if (!response) {
        showError(resultsDiv, { message: 'Extraction failed', suggestion: 'Could not extract profile data.' });
        return;
      }

      // Call analyze candidate with projectId
      const result = await callFirebaseFunction('analyzeCandidate', {
        candidate: response,
        requirements: jobRequirements.value,
        projectId: selectedProjectId
      });

      if (result.success) {
        // Safe DOM construction
        resultsDiv.innerHTML = '';
        const container = document.createDocumentFragment();

        const h3 = document.createElement('h3');
        h3.textContent = 'Analysis Complete';
        container.appendChild(h3);

        // Show save status
        if (result.analysisId && selectedProjectId) {
          const savedDiv = document.createElement('div');
          savedDiv.className = 'analysis-saved';
          savedDiv.textContent = '✓ Saved to project';
          container.appendChild(savedDiv);
        }

        const recP = document.createElement('p');
        recP.innerHTML = `<strong>Recommendation:</strong> ${escapeHtml(result.recommendation || 'N/A')}`;
        container.appendChild(recP);

        const scoreP = document.createElement('p');
        scoreP.innerHTML = `<strong>Match Score:</strong> ${escapeHtml(result.match_score || 'N/A')}%`;
        container.appendChild(scoreP);

        const summaryP = document.createElement('p');
        summaryP.innerHTML = `<strong>Summary:</strong> ${escapeHtml(result.summary || 'N/A')}`;
        container.appendChild(summaryP);

        if (result.strengths?.length) {
          const h4 = document.createElement('h4');
          h4.textContent = 'Strengths:';
          container.appendChild(h4);
          renderSafeList(result.strengths, container);
        }

        if (result.concerns?.length) {
          const h4 = document.createElement('h4');
          h4.textContent = 'Concerns:';
          container.appendChild(h4);
          renderSafeList(result.concerns, container);
        }

        resultsDiv.appendChild(container);
      } else {
        showError(resultsDiv, { message: 'Analysis failed', suggestion: result.error || 'Unknown error.' });
      }
    } catch (error) {
      console.error('Evaluate error:', error);
      showError(resultsDiv, error);
    }
  });

  // ============ CONTACT INFO ============

  getContactInfoButton.addEventListener('click', async () => {
    if (!idToken) {
      showError(resultsDiv, { message: 'Sign in required', suggestion: 'Please sign in to use this feature.' });
      return;
    }

    showLoading(resultsDiv, 'Getting contact info');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url?.includes('linkedin.com/in/')) {
        showError(resultsDiv, { message: 'Wrong page', suggestion: 'Navigate to a LinkedIn profile.' });
        return;
      }

      const result = await callFirebaseFunction('getContactInfo', { profileUrl: tab.url });

      if (result.error) {
        showError(resultsDiv, { message: 'Contact lookup failed', suggestion: result.error });
      } else if (result.message && !result.email && !result.phone) {
        resultsDiv.innerHTML = `<p>${escapeHtml(result.message)}</p>`;
      } else {
        resultsDiv.innerHTML = '';
        const container = document.createDocumentFragment();

        const h3 = document.createElement('h3');
        h3.textContent = 'Contact Info Found';
        container.appendChild(h3);

        if (result.email) {
          const p = document.createElement('p');
          p.innerHTML = `<strong>Email:</strong> ${escapeHtml(result.email)}`;
          container.appendChild(p);
        }

        if (result.phone) {
          const p = document.createElement('p');
          p.innerHTML = `<strong>Phone:</strong> ${escapeHtml(result.phone)}`;
          container.appendChild(p);
        }

        if (result.work_email) {
          const p = document.createElement('p');
          p.innerHTML = `<strong>Work Email:</strong> ${escapeHtml(result.work_email)}`;
          container.appendChild(p);
        }

        if (result.personal_emails?.length) {
          const h4 = document.createElement('h4');
          h4.textContent = 'Personal Emails:';
          container.appendChild(h4);
          renderSafeList(result.personal_emails, container);
        }

        resultsDiv.appendChild(container);
      }
    } catch (error) {
      console.error('Contact info error:', error);
      showError(resultsDiv, error);
    }
  });

  // ============ BOOLEAN SEARCH ============

  showGenerateBooleanButton.addEventListener('click', () => {
    clearAllResults();
    hideAllViews();
    generateBooleanView.style.display = 'block';
    jobTitleInput.focus();
  });

  backToMainFromBooleanButton.addEventListener('click', () => {
    clearAllResults();
    showMainView();
  });

  generateBooleanActionButton.addEventListener('click', async () => {
    try {
      const jobTitle = validateInput(jobTitleInput.value, { required: true, minLength: 2, fieldName: 'Job title' });
      const description = validateInput(jobDescriptionInput.value, { minLength: 10, fieldName: 'Job description' });

      showLoading(booleanResultsDiv, 'Generating boolean search');

      const result = await callFirebaseFunction('generateBooleanSearch', {
        jobTitle,
        description,
        userId: currentUser?.uid,
        projectId: selectedProjectId
      });

      if (result.success && result.searchString) {
        booleanResultsDiv.innerHTML = '';

        const textarea = document.createElement('textarea');
        textarea.readOnly = true;
        textarea.className = 'result-text';
        textarea.value = result.searchString;

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-row';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';

        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(result.searchString);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            copyBtn.textContent = 'Failed';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
          }
        });

        const explainBtn = document.createElement('button');
        explainBtn.className = 'explain-btn';
        explainBtn.textContent = 'Explain';

        explainBtn.addEventListener('click', async () => {
          try {
            explainBtn.textContent = 'Explaining...';
            explainBtn.disabled = true;

            const explanation = await chrome.runtime.sendMessage({
              action: 'explainBoolean',
              data: {
                booleanString: result.searchString,
                requirements: `${jobTitle}: ${description}`
              }
            });

            // Display explanation in a modal or expandable section
            displayBooleanExplanation(explanation, result.searchString);
            explainBtn.textContent = 'Explain';
            explainBtn.disabled = false;
          } catch (err) {
            console.error('Explain error:', err);
            explainBtn.textContent = 'Failed';
            setTimeout(() => {
              explainBtn.textContent = 'Explain';
              explainBtn.disabled = false;
            }, 2000);
          }
        });

        buttonContainer.appendChild(copyBtn);
        buttonContainer.appendChild(explainBtn);
        booleanResultsDiv.appendChild(textarea);
        booleanResultsDiv.appendChild(buttonContainer);
      } else {
        showError(booleanResultsDiv, { message: 'Generation failed', suggestion: result.error || 'Please try again.' });
      }
    } catch (error) {
      console.error('Boolean search error:', error);
      showError(booleanResultsDiv, error);
    }
  });

  // ============ PERPLEXITY SEARCH ============

  showPerplexitySearchButton.addEventListener('click', () => {
    if (!idToken) {
      alert('Please sign in to use web search.');
      return;
    }
    clearAllResults();
    hideAllViews();
    perplexitySearchView.style.display = 'block';
    perplexityQueryInput.focus();
  });

  backToMainFromPerplexityButton.addEventListener('click', () => {
    clearAllResults();
    showMainView();
  });

  perplexitySearchActionButton.addEventListener('click', async () => {
    try {
      const query = validateInput(perplexityQueryInput.value, { required: true, minLength: 5, fieldName: 'Search query' });

      showLoading(perplexityResultsDiv, 'Searching the internet');

      const result = await callFirebaseFunction('perplexitySearch', {
        query,
        projectId: selectedProjectId
      }, { timeout: 60000 }); // Longer timeout for search

      if (result.choices?.[0]?.message?.content) {
        const answer = result.choices[0].message.content;

        perplexityResultsDiv.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'result-content';
        container.textContent = answer;
        perplexityResultsDiv.appendChild(container);

        // Add copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy Result';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(answer);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy Result';
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            copyBtn.textContent = 'Failed';
          }
        });
        perplexityResultsDiv.appendChild(copyBtn);

        if (result.searchId) {
          const savedDiv = document.createElement('div');
          savedDiv.className = 'analysis-saved';
          savedDiv.textContent = '✓ Search saved';
          perplexityResultsDiv.appendChild(savedDiv);
        }
      } else {
        showError(perplexityResultsDiv, { message: 'Search failed', suggestion: 'No results returned.' });
      }
    } catch (error) {
      console.error('Perplexity search error:', error);
      showError(perplexityResultsDiv, error);
    }
  });

  // ============ URL SCRAPING ============

  showUrlScrapeButton.addEventListener('click', () => {
    if (!idToken) {
      alert('Please sign in to use URL scraping.');
      return;
    }
    clearAllResults();
    lastScrapedContent = null;
    useScrapedContentButton.style.display = 'none';
    hideAllViews();
    urlScrapeView.style.display = 'block';
    scrapeUrlInput.focus();
  });

  backToMainFromScrapeButton.addEventListener('click', () => {
    clearAllResults();
    lastScrapedContent = null;
    showMainView();
  });

  scrapeUrlActionButton.addEventListener('click', async () => {
    try {
      const url = validateInput(scrapeUrlInput.value, { required: true, fieldName: 'URL' });

      // Basic URL validation
      try {
        new URL(url);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      showLoading(scrapeResultsDiv, 'Scraping content');

      const result = await callFirebaseFunction('firecrawlUrl', { url }, { timeout: 60000 });

      if (result.success && result.text) {
        lastScrapedContent = result.text;

        scrapeResultsDiv.innerHTML = '';

        const successDiv = document.createElement('div');
        successDiv.className = 'success-container';
        successDiv.innerHTML = `
          <div class="success-icon" aria-hidden="true">✓</div>
          <div class="error-content">
            <p class="error-message" style="color: #059669;">Content scraped successfully!</p>
            <p class="error-suggestion" style="color: #065f46;">${result.text.length} characters extracted</p>
          </div>
        `;
        scrapeResultsDiv.appendChild(successDiv);

        // Preview
        const preview = document.createElement('div');
        preview.className = 'result-content';
        preview.style.marginTop = '12px';
        preview.style.maxHeight = '150px';
        preview.style.overflow = 'hidden';
        preview.textContent = result.text.substring(0, 500) + (result.text.length > 500 ? '...' : '');
        scrapeResultsDiv.appendChild(preview);

        // Show use button
        useScrapedContentButton.style.display = 'block';

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy Full Content';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(result.text);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy Full Content';
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            copyBtn.textContent = 'Failed';
          }
        });
        scrapeResultsDiv.appendChild(copyBtn);
      } else {
        showError(scrapeResultsDiv, { message: 'Scraping failed', suggestion: result.error || 'Could not extract content.' });
      }
    } catch (error) {
      console.error('URL scrape error:', error);
      showError(scrapeResultsDiv, error);
    }
  });

  useScrapedContentButton.addEventListener('click', () => {
    if (lastScrapedContent) {
      jobRequirements.value = lastScrapedContent;
      lastScrapedContent = null;
      showMainView();
    }
  });

  // ============ CONTENT GENERATION ============

  showGenerateContentButton.addEventListener('click', () => {
    clearAllResults();
    hideAllViews();
    generateContentView.style.display = 'block';
    contentPromptInput.focus();
  });

  backToMainFromContentButton.addEventListener('click', () => {
    clearAllResults();
    showMainView();
  });

  generateContentActionButton.addEventListener('click', async () => {
    try {
      const userInput = validateInput(contentPromptInput.value, { required: true, minLength: 10, fieldName: 'Prompt' });

      showLoading(contentResultsDiv, 'Generating content');

      const result = await callFirebaseFunction('generateContent', {
        userInput,
        contentType: 'recruiting_email',
        systemPrompt: 'You are an expert recruiter writing outreach content. Be professional, friendly, and engaging.'
      });

      if (result.success && result.content) {
        contentResultsDiv.innerHTML = '';
        const div = document.createElement('div');
        div.className = 'result-content';
        div.textContent = result.content;
        contentResultsDiv.appendChild(div);

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(result.content);
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.classList.remove('copied');
            }, 2000);
          } catch (err) {
            copyBtn.textContent = 'Failed';
          }
        });
        contentResultsDiv.appendChild(copyBtn);
      } else {
        showError(contentResultsDiv, { message: 'Generation failed', suggestion: result.error || 'Please try again.' });
      }
    } catch (error) {
      console.error('Generate content error:', error);
      showError(contentResultsDiv, error);
    }
  });

  // ============ FIREBASE API HELPER ============

  async function callFirebaseFunction(functionName, data, options = {}) {
    const { timeout = 30000 } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const isCallableFunction = CALLABLE_FUNCTIONS.includes(functionName);

    // Debug logging
    console.log(`Calling ${functionName}:`, {
      isCallableFunction,
      hasToken: !!idToken,
      tokenLength: idToken?.length,
      data: JSON.stringify(data).substring(0, 100)
    });

    try {
      const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        // Callable functions need { data: {...} }, HTTP functions get data directly
        body: JSON.stringify(isCallableFunction ? { data } : data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`${functionName} response status:`, response.status);

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetail = '';
        try {
          const errorBody = await response.json();
          errorDetail = errorBody.error?.message || errorBody.error || JSON.stringify(errorBody);
          console.error(`${functionName} error body:`, errorBody);
        } catch (e) {
          errorDetail = await response.text();
        }

        if (response.status === 401) {
          // Try to refresh the token before giving up
          console.log('Got 401 - attempting token refresh...');
          const stored = await chrome.storage.local.get(['refreshToken']);
          if (stored.refreshToken) {
            const newToken = await refreshIdToken(stored.refreshToken);
            if (newToken) {
              console.log('Token refreshed after 401, but not retrying automatically');
              idToken = newToken;
              await chrome.storage.local.set({ idToken: newToken });
              // Don't clear credentials - let user retry
              throw new Error(`Please try again: ${errorDetail}`);
            }
          }
          // Token refresh failed - clear credentials
          console.error('Auth failed - token refresh failed, clearing credentials');
          currentUser = null;
          idToken = null;
          await chrome.storage.local.remove(['user', 'idToken', 'refreshToken']);
          showLoginView();
          throw new Error(`Session expired: ${errorDetail}`);
        }
        throw new Error(`${response.status}: ${errorDetail || 'Request failed'}`);
      }

      const result = await response.json();
      console.log(`${functionName} success:`, result);

      // Callable functions return { result: {...} }, HTTP functions return data directly
      return isCallableFunction ? (result.result || result) : result;

    } catch (error) {
      clearTimeout(timeoutId);
      console.error(`${functionName} error:`, error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  }
});
