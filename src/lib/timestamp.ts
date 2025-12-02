/**
 * Shared timestamp utilities for Firestore data normalization
 */

/**
 * Normalizes various timestamp formats to ISO string format.
 * Handles Firestore Timestamps, Date objects, ISO strings, and null/undefined values.
 *
 * @param value - The timestamp value to normalize (Firestore Timestamp, Date, string, or null/undefined)
 * @returns ISO string representation of the timestamp, or current time if invalid
 */
export function normalizeTimestamp(value: any): string {
  if (!value) {
    return new Date().toISOString();
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle Firestore Timestamp (has toDate method)
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  // Handle ISO string or other string formats
  if (typeof value === "string") {
    return value;
  }

  // Handle numeric timestamps (milliseconds)
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  // Fallback to current time
  return new Date().toISOString();
}

/**
 * Converts an ISO string or Firestore Timestamp to a Date object.
 *
 * @param value - The timestamp value to convert
 * @returns Date object
 */
export function toDate(value: any): Date {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value.toDate === "function") {
    return value.toDate();
  }

  if (typeof value === "string") {
    return new Date(value);
  }

  if (typeof value === "number") {
    return new Date(value);
  }

  return new Date();
}

/**
 * Checks if a timestamp is valid
 *
 * @param value - The timestamp value to check
 * @returns true if the value can be converted to a valid date
 */
export function isValidTimestamp(value: any): boolean {
  if (!value) return false;

  try {
    const date = toDate(value);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
