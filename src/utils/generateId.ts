/**
 * Generates a unique identifier.
 * Uses crypto.randomUUID() when available, with a fallback for older browsers.
 *
 * @returns A unique string identifier
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
