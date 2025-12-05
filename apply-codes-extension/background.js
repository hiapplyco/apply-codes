// Apply Codes Extension - Background Service Worker
// Handles messaging between sidebar/content script and Firebase functions

const FIREBASE_PROJECT_ID = 'applycodes-2683f';
const FIREBASE_API_KEY = 'AIzaSyB2gdbYSgiRI5n0ckjEIu_rtS4RzM3ezho';
const FUNCTIONS_URL = `https://us-central1-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

// Callable functions (onCall) - wrap in { data: {...} }
// Most functions are HTTP (onRequest) and expect data directly
const CALLABLE_FUNCTIONS = ['analyzeCandidate', 'generateBooleanSearch'];

console.log('Apply Codes Extension background service worker loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Apply Codes Extension installed');
});

// Helper to get fresh auth token
async function getAuthToken() {
  const stored = await chrome.storage.local.get(['idToken', 'refreshToken']);

  if (!stored.refreshToken) {
    console.log('No refresh token stored');
    return stored.idToken || null;
  }

  // Always refresh to ensure token is valid
  try {
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${stored.refreshToken}`
      }
    );
    const data = await response.json();
    if (data.id_token) {
      await chrome.storage.local.set({ idToken: data.id_token });
      console.log('Token refreshed successfully');
      return data.id_token;
    }
    console.error('Token refresh failed:', data.error);
  } catch (error) {
    console.error('Token refresh error:', error);
  }

  return stored.idToken || null;
}

// Call Firebase function with proper format
async function callFirebaseFunction(functionName, data, timeout = 30000) {
  const idToken = await getAuthToken();
  const isCallableFunction = CALLABLE_FUNCTIONS.includes(functionName);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  console.log(`Background calling ${functionName}:`, {
    isCallableFunction,
    hasToken: !!idToken
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
      let errorDetail = '';
      try {
        const errorBody = await response.json();
        errorDetail = errorBody.error?.message || errorBody.error || '';
      } catch (e) {
        errorDetail = await response.text();
      }
      throw new Error(`${response.status}: ${errorDetail}`);
    }

    const result = await response.json();
    // Callable functions return { result: {...} }, HTTP functions return data directly
    return isCallableFunction ? (result.result || result) : result;

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`${functionName} error:`, error);
    throw error;
  }
}

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '697220767333-ere2cnqdmrctjl879983qls9a2kva03t.apps.googleusercontent.com';

// Handle OAuth flow in background script (persists when popup closes)
async function handleOAuthFlow() {
  const redirectUrl = chrome.identity.getRedirectURL();
  console.log('Background OAuth - Redirect URL:', redirectUrl);

  // Generate state for CSRF protection
  const state = crypto.randomUUID();

  // Build OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUrl);
  authUrl.searchParams.set('response_type', 'token');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);

  console.log('Background OAuth - Starting flow...');

  try {
    const responseUrl = await new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        { url: authUrl.toString(), interactive: true },
        (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            console.error('Background OAuth error:', errorMsg);
            if (errorMsg.includes('Invalid') || errorMsg.includes('redirect_uri_mismatch')) {
              reject(new Error(`OAuth not configured. Add this redirect URI to Google Cloud Console:\n\n${redirectUrl}`));
            } else if (errorMsg.includes('canceled') || errorMsg.includes('closed')) {
              reject(new Error('Sign-in was cancelled'));
            } else {
              reject(new Error(errorMsg));
            }
          } else if (response) {
            console.log('Background OAuth flow completed successfully');
            resolve(response);
          } else {
            reject(new Error('No response from auth flow'));
          }
        }
      );
    });

    // Parse response
    const hashParams = new URLSearchParams(responseUrl.split('#')[1]);
    const accessToken = hashParams.get('access_token');
    const returnedState = hashParams.get('state');

    // Validate state
    if (returnedState !== state) {
      throw new Error('OAuth state mismatch');
    }

    if (!accessToken) {
      throw new Error('No access token received from Google');
    }

    console.log('Background OAuth - Got access token, exchanging for Firebase token...');

    // Exchange for Firebase ID token
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestUri: redirectUrl,
          postBody: `access_token=${accessToken}&providerId=google.com`,
          returnSecureToken: true,
          returnIdpCredential: true
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Background OAuth - Firebase auth error:', data.error);
      throw new Error(data.error.message || 'Firebase authentication failed');
    }

    if (!data.idToken || !data.refreshToken) {
      console.error('Background OAuth - Missing tokens in response');
      throw new Error('Invalid response from authentication server');
    }

    const user = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName,
      photoUrl: data.photoUrl
    };

    // Store everything in chrome.storage.local and clear pending flag
    await chrome.storage.local.set({
      user: user,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      hasSeenOnboarding: true  // Mark onboarding as seen after successful login
    });
    await chrome.storage.local.remove(['oauthPending']);

    console.log('Background OAuth - Auth stored successfully:', user.email);
    console.log('Background OAuth - Stored tokens:', {
      hasIdToken: !!data.idToken,
      idTokenLength: data.idToken?.length,
      hasRefreshToken: !!data.refreshToken,
      refreshTokenLength: data.refreshToken?.length
    });

    // Verify storage
    const verification = await chrome.storage.local.get(['user', 'idToken', 'refreshToken']);
    console.log('Background OAuth - Storage verification:', {
      hasUser: !!verification.user,
      hasIdToken: !!verification.idToken,
      hasRefreshToken: !!verification.refreshToken
    });

    return { success: true, user: user };

  } catch (error) {
    console.error('Background OAuth - Error:', error);
    // Clear pending flag on error too
    await chrome.storage.local.remove(['oauthPending']);
    return { success: false, error: error.message };
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.action);

  // Ping check
  if (request.action === 'ping') {
    sendResponse({ status: 'ok' });
    return true;
  }

  // Handle OAuth flow in background (popup can close during this)
  if (request.action === 'startOAuth') {
    handleOAuthFlow().then(sendResponse);
    return true; // Will respond asynchronously
  }

  // Open popup hint
  if (request.action === 'openPopup') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    sendResponse({ message: 'Click extension icon to open' });
    return true;
  }

  // Evaluate candidate from sidebar
  if (request.action === 'evaluateCandidate') {
    (async () => {
      try {
        const result = await callFirebaseFunction('analyzeCandidate', {
          candidate: request.data.candidate,
          requirements: request.data.requirements || 'General candidate evaluation - assess overall qualifications and experience'
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Get contact info from sidebar
  if (request.action === 'getContactInfo') {
    (async () => {
      try {
        const idToken = await getAuthToken();
        if (!idToken) {
          sendResponse({ error: 'Please sign in via the extension popup first' });
          return;
        }
        const result = await callFirebaseFunction('getContactInfo', {
          profileUrl: request.data.profileUrl
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  // Generate outreach message from sidebar
  if (request.action === 'generateOutreach') {
    (async () => {
      try {
        const result = await callFirebaseFunction('generateContent', {
          userInput: `Write a friendly recruiting outreach message for ${request.data.candidateName}, who is a ${request.data.candidateHeadline}. Keep it brief, personalized, and professional.`,
          contentType: 'recruiting_email',
          systemPrompt: 'You are an expert recruiter writing personalized outreach. Be friendly, concise, and engaging. No more than 3 paragraphs.'
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // PDL (People Data Labs) enrichment
  if (request.action === 'pdlEnrich') {
    (async () => {
      try {
        const idToken = await getAuthToken();
        if (!idToken) {
          sendResponse({ error: 'Please sign in via the extension popup first' });
          return;
        }
        const result = await callFirebaseFunction('pdlSearch', {
          searchType: request.data.searchType || 'person_enrich',
          searchParams: request.data.searchParams,
          pagination: request.data.pagination
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  // Hunter.io email search
  if (request.action === 'hunterSearch') {
    (async () => {
      try {
        const idToken = await getAuthToken();
        if (!idToken) {
          sendResponse({ error: 'Please sign in via the extension popup first' });
          return;
        }
        const result = await callFirebaseFunction('hunterIoSearch', {
          searchType: request.data.searchType || 'email_finder',
          domain: request.data.domain,
          company: request.data.company,
          fullName: request.data.fullName,
          firstName: request.data.firstName,
          lastName: request.data.lastName,
          email: request.data.email,
          limit: request.data.limit,
          offset: request.data.offset
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  // Explain boolean search string
  if (request.action === 'explainBoolean') {
    (async () => {
      try {
        const result = await callFirebaseFunction('explainBoolean', {
          booleanString: request.data.booleanString,
          requirements: request.data.requirements
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  // Chat assistant
  if (request.action === 'chatAssistant') {
    (async () => {
      try {
        const idToken = await getAuthToken();
        if (!idToken) {
          sendResponse({ error: 'Please sign in via the extension popup first' });
          return;
        }
        const result = await callFirebaseFunction('chatAssistant', {
          message: request.data.message,
          context: request.data.context,
          history: request.data.history
        });
        sendResponse(result);
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }

  return true;
});
