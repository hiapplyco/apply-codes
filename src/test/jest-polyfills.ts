/**
 * Polyfills for jest-environment-jsdom.
 * This file runs via `setupFiles` (before the test framework),
 * ensuring globals like `fetch` are available when modules load.
 */

// jest-environment-jsdom does not expose Node.js built-in fetch.
// Firebase Auth requires fetch at import time, so we must polyfill it
// before any test modules are evaluated.
if (typeof globalThis.fetch === 'undefined') {
  // Use a no-op stub; real network calls should be mocked in tests.
  globalThis.fetch = (() => Promise.resolve(new Response())) as any;
}
if (typeof globalThis.Request === 'undefined') {
  (globalThis as any).Request = class Request {
    constructor(public url: string, public init?: any) {}
  };
}
if (typeof globalThis.Response === 'undefined') {
  (globalThis as any).Response = class Response {
    constructor(public body?: any, public init?: any) {}
    async json() { return {}; }
    async text() { return ''; }
  };
}
if (typeof globalThis.Headers === 'undefined') {
  (globalThis as any).Headers = class Headers {
    private map = new Map<string, string>();
    append(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    get(name: string) { return this.map.get(name.toLowerCase()) ?? null; }
    set(name: string, value: string) { this.map.set(name.toLowerCase(), value); }
    has(name: string) { return this.map.has(name.toLowerCase()); }
  };
}

// TextEncoder/TextDecoder needed by various libs
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
