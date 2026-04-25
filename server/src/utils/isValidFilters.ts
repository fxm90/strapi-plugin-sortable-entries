//
// Types
//

import type { Filters } from '../types';

//
// Implementation
//

/**
 * Returns `true` when the value is a plain object or `undefined`.
 *
 * Only performs a shallow shape check — deep validation of the filter structure
 * is handled by Strapi's Document Service API, which sanitizes filter input
 * against the content type schema internally.
 */
export const isValidFilters = (value: unknown): value is Filters | undefined =>
  value === undefined || (typeof value === 'object' && value !== null && !Array.isArray(value));
