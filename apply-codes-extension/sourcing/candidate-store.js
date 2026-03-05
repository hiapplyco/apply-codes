// Apply Codes - Candidate storage using chrome.storage.local
// Handles CRUD operations, deduplication, and persistence

'use strict';

const STORAGE_KEY = 'applycodes_sourcing_candidates';
const MAX_CANDIDATES = 5000;

// Simple mutex to serialize storage read-modify-write operations
let _storageLock = Promise.resolve();
function withStorageLock(fn) {
  const next = _storageLock.then(fn, fn);
  _storageLock = next.catch(() => {});
  return next;
}

/**
 * Generate a simple UUID v4.
 * @returns {string}
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Create a normalized CandidateRecord.
 * @param {Object} rawData
 * @param {string} source - 'recruiter' | 'recruiterLite' | 'regularSearch'
 * @param {string} searchCriteria
 * @returns {Object}
 */
function createCandidateRecord(rawData, source, searchCriteria) {
  return {
    id: generateId(),
    name: (rawData.name || '').trim(),
    headline: (rawData.headline || '').trim(),
    company: (rawData.company || '').trim(),
    location: (rawData.location || '').trim(),
    profileUrl: normalizeProfileUrl(rawData.profileUrl || ''),
    skills: Array.isArray(rawData.skills) ? rawData.skills : [],
    experienceSummary: (rawData.experienceSummary || '').trim(),
    source: source,
    collectedAt: new Date().toISOString(),
    searchCriteria: searchCriteria || '',
    analyzed: false,
    analysisResult: null,
  };
}

/**
 * Normalize LinkedIn profile URL to a consistent format.
 * @param {string} url
 * @returns {string}
 */
function normalizeProfileUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url, 'https://www.linkedin.com');
    // Strip query params and trailing slashes for dedup
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return url.replace(/\/+$/, '');
  }
}

/**
 * Get all stored candidates.
 * @returns {Promise<Object[]>}
 */
async function getAllCandidates() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] || [];
}

/**
 * Add candidates in batch, deduplicating by profileUrl.
 * @param {Object[]} newCandidates - Array of CandidateRecord objects
 * @returns {Promise<{added: number, duplicates: number, total: number}>}
 */
async function addCandidates(newCandidates) {
  return withStorageLock(async () => {
    const existing = await getAllCandidates();
    const existingUrls = new Set(existing.map(c => c.profileUrl));

    let added = 0;
    let duplicates = 0;

    for (const candidate of newCandidates) {
      if (existingUrls.has(candidate.profileUrl)) {
        duplicates++;
        continue;
      }
      if (existing.length + added >= MAX_CANDIDATES) break;
      existing.push(candidate);
      existingUrls.add(candidate.profileUrl);
      added++;
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: existing });
    return { added, duplicates, total: existing.length };
  });
}

/**
 * Update a candidate's analysis result.
 * @param {string} candidateId
 * @param {Object} analysisResult
 * @returns {Promise<boolean>}
 */
async function updateCandidateAnalysis(candidateId, analysisResult) {
  return withStorageLock(async () => {
    const candidates = await getAllCandidates();
    const idx = candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return false;

    candidates[idx].analyzed = true;
    candidates[idx].analysisResult = analysisResult;
    await chrome.storage.local.set({ [STORAGE_KEY]: candidates });
    return true;
  });
}

/**
 * Delete specific candidates by ID.
 * @param {string[]} ids
 * @returns {Promise<number>} Number of candidates removed
 */
async function deleteCandidates(ids) {
  return withStorageLock(async () => {
    const candidates = await getAllCandidates();
    const idSet = new Set(ids);
    const filtered = candidates.filter(c => !idSet.has(c.id));
    const removed = candidates.length - filtered.length;
    await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
    return removed;
  });
}

/**
 * Clear all stored candidates.
 * @returns {Promise<void>}
 */
async function clearAllCandidates() {
  await chrome.storage.local.set({ [STORAGE_KEY]: [] });
}

/**
 * Get candidates from a specific sourcing run (by searchCriteria match).
 * @param {string} criteria
 * @returns {Promise<Object[]>}
 */
async function getCandidatesByCriteria(criteria) {
  const all = await getAllCandidates();
  return all.filter(c => c.searchCriteria === criteria);
}

/**
 * Get storage stats.
 * @returns {Promise<{total: number, bySource: Object, oldest: string|null, newest: string|null}>}
 */
async function getStats() {
  const candidates = await getAllCandidates();
  const bySource = {};
  let oldest = null;
  let newest = null;

  for (const c of candidates) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
    if (!oldest || c.collectedAt < oldest) oldest = c.collectedAt;
    if (!newest || c.collectedAt > newest) newest = c.collectedAt;
  }

  return { total: candidates.length, bySource, oldest, newest };
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ApplyCodesCandidateStore = {
    createCandidateRecord,
    getAllCandidates,
    addCandidates,
    updateCandidateAnalysis,
    deleteCandidates,
    clearAllCandidates,
    getCandidatesByCriteria,
    getStats,
    MAX_CANDIDATES,
  };
}
