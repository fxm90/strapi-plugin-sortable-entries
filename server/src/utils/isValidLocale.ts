//
// Types
//

import type { Locale } from '../types';

//
// Config
//

const config = {
  /**
   * A permissive BCP 47-style locale pattern that matches common Strapi locale identifiers
   * such as `en`, `de-DE` or `zh-Hans`.
   *
   * The number of subtags is capped at 4 to match what Strapi actually uses.
   */
  localeRegex: /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,4}$/,
};

//
// Implementation
//

/**
 * Returns `true` when the value is a locale string with a supported format or `undefined`.
 *
 * Koa query parameters are not guaranteed to be strings; repeated query parameters
 * such as `?locale=en&locale=de` are parsed as arrays.
 */
export const isValidLocale = (value: unknown): value is Locale | undefined =>
  value === undefined || (typeof value === 'string' && config.localeRegex.test(value));
