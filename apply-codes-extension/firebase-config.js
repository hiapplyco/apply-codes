// Shared Firebase configuration for Apply Codes Extension
// Used by both background.js and popup.js via different import mechanisms

const FIREBASE_CONFIG = {
  PROJECT_ID: 'applycodes-2683f',
  API_KEY: 'AIzaSyB2gdbYSgiRI5n0ckjEIu_rtS4RzM3ezho',
  FUNCTIONS_URL: 'https://us-central1-applycodes-2683f.cloudfunctions.net',
  // Callable functions (onCall) - wrap in { data: {...} }
  // Most functions are HTTP (onRequest) and expect data directly
  CALLABLE_FUNCTIONS: ['analyzeCandidate', 'generateBooleanSearch', 'enrichProfile'],
  GOOGLE_CLIENT_ID: '697220767333-ere2cnqdmrctjl879983qls9a2kva03t.apps.googleusercontent.com'
};

// Support both importScripts (service worker) and script tag (popup) contexts
if (typeof globalThis !== 'undefined') {
  globalThis.FIREBASE_CONFIG = FIREBASE_CONFIG;
}
