// Shared Firebase API client for Apply Codes Extension
// Provides callFirebaseFunction with 401 retry and token refresh
// Used by both background.js and popup.js via importScripts / script tag

/**
 * Refresh Firebase ID token using stored refresh token.
 * @returns {Promise<string|null>} New ID token or null
 */
async function refreshIdToken() {
  const config = globalThis.FIREBASE_CONFIG;
  const stored = await chrome.storage.local.get(['refreshToken']);

  if (!stored.refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${config.API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${stored.refreshToken}`
      }
    );
    const data = await response.json();
    if (data.id_token) {
      await chrome.storage.local.set({ idToken: data.id_token });
      return data.id_token;
    }
    console.error('Token refresh failed:', data.error);
  } catch (error) {
    console.error('Token refresh error:', error);
  }

  return null;
}

// Promise cache to prevent concurrent token refreshes
let _refreshPromise = null;

/**
 * Get a valid auth token, with promise dedup to prevent concurrent refreshes.
 * @returns {Promise<string|null>} Valid ID token or null
 */
async function getAuthToken() {
  const stored = await chrome.storage.local.get(['idToken', 'refreshToken']);

  if (!stored.refreshToken) {
    return stored.idToken || null;
  }

  // Deduplicate concurrent refresh calls
  if (_refreshPromise) {
    return _refreshPromise;
  }

  _refreshPromise = refreshIdToken().finally(() => {
    _refreshPromise = null;
  });

  const newToken = await _refreshPromise;
  return newToken || stored.idToken || null;
}

/**
 * Call a Firebase Cloud Function with automatic 401 retry.
 * @param {string} functionName - Function name
 * @param {object} data - Request payload
 * @param {object} [options] - Options
 * @param {number} [options.timeout=30000] - Timeout in ms
 * @param {string} [options.idToken] - Override token (used by popup which manages its own token)
 * @returns {Promise<object>} Response data
 */
async function callFirebaseFunction(functionName, data, options = {}) {
  const config = globalThis.FIREBASE_CONFIG;
  const { timeout = 30000 } = options;
  // Allow caller to pass an explicit token (popup manages its own `idToken` variable)
  let token = options.idToken !== undefined ? options.idToken : await getAuthToken();
  const isCallableFunction = config.CALLABLE_FUNCTIONS.includes(functionName);

  const doFetch = async (authToken) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${config.FUNCTIONS_URL}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(isCallableFunction ? { data } : data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  console.log(`Calling ${functionName}:`, { isCallableFunction, hasToken: !!token });

  let response = await doFetch(token);

  // 401 retry: refresh token and retry once
  if (response.status === 401 && token) {
    console.log(`${functionName}: 401 received, refreshing token and retrying...`);
    const newToken = await refreshIdToken();
    if (newToken) {
      token = newToken;
      response = await doFetch(newToken);
    }
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.error?.message || errorBody.error || JSON.stringify(errorBody);
    } catch (e) {
      errorDetail = await response.text();
    }
    throw new Error(`${response.status}: ${errorDetail || 'Request failed'}`);
  }

  const result = await response.json();
  return isCallableFunction ? (result.result || result) : result;
}

// Expose to global scope for importScripts usage
if (typeof globalThis !== 'undefined') {
  globalThis.getAuthToken = getAuthToken;
  globalThis.callFirebaseFunction = callFirebaseFunction;
  globalThis.refreshIdToken = refreshIdToken;
}
