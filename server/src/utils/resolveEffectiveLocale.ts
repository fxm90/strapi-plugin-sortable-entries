//
// Types
//

import type { Core, Schema } from '@strapi/strapi';
import type { Locale } from '../types';

/**
 * Describes the configuration options for Strapi's i18n plugin.
 *
 * This represents the shape of the `i18n` object stored under `pluginOptions` for a content type.
 * It indicates whether localization is enabled.
 */
export interface I18nPluginOptions {
  localized?: boolean;
}

/**
 * Describes the subset of a Strapi content type model that includes plugin options,
 * specifically the i18n configuration injected at runtime.
 *
 * This mirrors the internal structure used by Strapi to attach plugin configuration to content type schemas.
 * It is not part of Strapi's public type surface.
 *
 * - Note: Exported for testing and type-guarding purposes only.
 */
export interface ModelI18nOptions {
  pluginOptions?: {
    i18n?: I18nPluginOptions;
  };
}

//
// Implementation
//

/**
 * Resolves the effective locale to use for queries, returning `undefined` for non-localized content types.
 *
 * Strapi adds `plugins[i18n][locale]=<LAST-SELECTED-LOCALE>` to the URL, even for content types where localization is disabled.
 * Passing that locale value to a non-localized type causes problems:
 *
 * - The raw Knex writer fails to match any rows, because the `locale` column is stored as `NULL` for non-localized types.
 * - The Document Service API silently ignores it, but we strip it anyway to keep both callers consistent.
 *
 * For localized content types, Strapi's Document Service falls back to the configured default locale when no locale is provided.
 * We mirror that behavior here so the raw database update path targets the same row as the read path.
 *
 * @param strapi - The Strapi instance, used to access services if needed.
 * @param model - The content type's model, potentially containing the i18n plugin options.
 * @param locale - The locale value injected by Strapi's i18n plugin / `undefined` if localization is turned off.
 *
 * @returns The locale for localized types, or `undefined` for non-localized types.
 */
export const resolveEffectiveLocale = async ({
  strapi,
  model,
  locale,
}: {
  strapi: Core.Strapi;
  model: Schema.ContentType & ModelI18nOptions;
  locale: Locale | undefined;
}): Promise<Locale | undefined> => {
  const isLocalized = model.pluginOptions?.i18n?.localized === true;
  if (!isLocalized) {
    return undefined;
  }

  if (locale) {
    return locale;
  }

  // Handle theoretical edge case where localization is enabled but no locale is provided by the frontend.
  const defaultLocale = await strapi.plugin('i18n').service('locales').getDefaultLocale();
  if (!defaultLocale) {
    throw new Error('Expected to resolve a default locale for a localized content type.');
  }

  return defaultLocale as Locale;
};
