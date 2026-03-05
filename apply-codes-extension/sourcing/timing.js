// Apply Codes - Human-like timing utilities for LinkedIn automation
// Uses Gaussian-distributed delays to mimic natural human interaction

'use strict';

/**
 * Gaussian-distributed random delay using Box-Muller transform.
 * @param {number} minMs - Minimum delay in milliseconds
 * @param {number} maxMs - Maximum delay in milliseconds
 * @returns {number} Delay value in milliseconds
 */
function humanDelay(minMs, maxMs) {
  const mean = (minMs + maxMs) / 2;
  const stdDev = (maxMs - minMs) / 6;
  const u1 = Math.random() || Number.MIN_VALUE; // Guard against 0 → Math.log(0) = -Infinity
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const delay = Math.round(mean + z * stdDev);
  return Math.max(minMs, Math.min(maxMs, delay));
}

/**
 * Sleep for a specified number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sleep for a human-like random duration.
 * @param {number} minMs
 * @param {number} maxMs
 * @returns {Promise<void>}
 */
async function humanSleep(minMs, maxMs) {
  await sleep(humanDelay(minMs, maxMs));
}

/**
 * Type text into an input element character by character with random inter-key delays.
 * Dispatches input and change events to trigger React/LinkedIn event handlers.
 * @param {HTMLInputElement} element
 * @param {string} text
 * @returns {Promise<void>}
 */
async function humanType(element, text) {
  element.focus();
  element.value = '';
  element.dispatchEvent(new Event('focus', { bubbles: true }));

  for (const char of text) {
    element.value += char;
    element.dispatchEvent(new InputEvent('input', { bubbles: true, data: char, inputType: 'insertText' }));
    await sleep(humanDelay(40, 130));
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulate a human-like click with slight random offset positioning.
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function humanClick(element) {
  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width * (0.3 + Math.random() * 0.4);
  const y = rect.top + rect.height * (0.3 + Math.random() * 0.4);

  element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }));
  await sleep(humanDelay(50, 150));
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
  await sleep(humanDelay(30, 80));
  element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: x, clientY: y }));
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: y }));
}

/**
 * Smooth scroll to bring an element into view with human-like behavior.
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function humanScrollTo(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await humanSleep(400, 800);
}

/**
 * Scroll down the page incrementally to simulate reading behavior.
 * @param {number} pixels - Approximate pixels to scroll
 * @returns {Promise<void>}
 */
async function humanScrollDown(pixels = 600) {
  const steps = Math.floor(pixels / 100) + Math.floor(Math.random() * 3);
  for (let i = 0; i < steps; i++) {
    const scrollAmount = 80 + Math.floor(Math.random() * 60);
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    await humanSleep(150, 400);
  }
}

/**
 * Cooling pause - longer break to reduce detection risk.
 * @returns {Promise<void>}
 */
async function coolingPause() {
  const pauseMs = humanDelay(5000, 15000);
  console.log(`[Apply Codes] Cooling pause: ${(pauseMs / 1000).toFixed(1)}s`);
  await sleep(pauseMs);
}

// Timing presets for different operations
const TIMING = {
  BETWEEN_KEYSTROKES: [40, 130],
  AFTER_SEARCH_SUBMIT: [2000, 4000],
  BETWEEN_PAGE_ACTIONS: [1500, 3500],
  AFTER_FILTER_APPLY: [1500, 3000],
  BEFORE_NEXT_PAGE: [2000, 4500],
  BETWEEN_CARD_READS: [200, 500],
  COOLING_INTERVAL_PAGES: 3,
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ApplyCodesTiming = {
    humanDelay,
    sleep,
    humanSleep,
    humanType,
    humanClick,
    humanScrollTo,
    humanScrollDown,
    coolingPause,
    TIMING,
  };
}
