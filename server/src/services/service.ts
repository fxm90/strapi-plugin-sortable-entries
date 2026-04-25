import { config } from '../config';
import { rawDocumentWriter } from '../utils/rawDocumentWriter';
import { reorderSubsetInPlace } from '../utils/reorderSubsetInPlace';

//
// Types
//

import type { Core, Schema } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, DocumentIDList, Filters, Locale } from '../types';

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
// Service
//

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Retrieves all entries for a given content type, sorted by the given `sortOrderField`.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param mainField - The name of the field to display as the primary label in UI listings.
   * @param filters - The filtering criteria to apply / `undefined` if all entries should be returned.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise resolving to an array of entries,
   *          each containing the `documentId` and the specified `mainField`.
   */
  async fetchEntries({
    uid,
    mainField,
    filters,
    locale,
  }: {
    uid: ContentTypeUID;
    mainField: string;
    filters: Filters | undefined;
    locale: Locale | undefined;
  }) {
    const model = strapi.getModel(uid);
    if (!model) {
      throw new Error(`Content type "${uid}" not found.`);
    }

    const effectiveLocale = resolveEffectiveLocale(model, locale);
    return strapi.documents(uid).findMany({
      fields: [mainField],
      sort: `${config.sortOrderField}:asc`,
      filters,
      locale: effectiveLocale,
    });
  },

  /**
   * Fetches the entry with the highest value in the configured sort order field for a given content type.
   * This is typically used to retrieve the "last" entry according to the custom ordering field.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise resolving to the last entry object or `null` if no entry exists.
   */
  async fetchLastEntry({ uid, locale }: { uid: ContentTypeUID; locale: Locale | undefined }) {
    const model = strapi.getModel(uid);
    if (!model) {
      throw new Error(`Content type "${uid}" not found.`);
    }

    const effectiveLocale = resolveEffectiveLocale(model, locale);
    return strapi.documents(uid).findFirst({
      fields: [config.sortOrderField],
      sort: `${config.sortOrderField}:desc`,
      locale: effectiveLocale,
    });
  },

  /**
   * Updates the sort order field of multiple entries for a given content type,
   * based on the provided list of document IDs.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param sortedDocumentIds - An ordered array of document IDs representing the new sequence of entries.
   * @param filters - The filtering criteria applied when fetching the entries / `undefined` if all entries were returned.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise that resolves when all entries have been updated with their new sort order.
   */
  async updateSortOrder({
    uid,
    sortedDocumentIds,
    filters,
    locale,
  }: {
    uid: ContentTypeUID;
    sortedDocumentIds: DocumentIDList;
    filters: Filters | undefined;
    locale: Locale | undefined;
  }) {
    const model = strapi.getModel(uid);
    if (!model) {
      throw new Error(`Content type "${uid}" not found.`);
    }

    const effectiveLocale = resolveEffectiveLocale(model, locale);

    // Fetch previous sort order of all entries to detect an actual change in position
    // when updating the entries below and to handle any active filters.
    const prevSortedEntries = await strapi.documents(uid).findMany({
      fields: [config.sortOrderField],
      sort: `${config.sortOrderField}:asc`,
      locale: effectiveLocale,
    });

    // The previous sorted list of document ID's.
    const prevSortedDocumentIds = prevSortedEntries.map((entry) => entry.documentId);

    // The new sorted list of document ID's, defined by the frontend.
    let nextSortedDocumentIds = [...sortedDocumentIds];

    if (filters) {
      // We have an applied filter, so the given `sortedDocumentIds` are only a subset of all entries.
      // As the values of `sortOrderField` needs to be unique, we still need to update all entries.
      nextSortedDocumentIds = reorderSubsetInPlace(prevSortedDocumentIds, sortedDocumentIds);
    }

    // Validate input before updating any entries.
    // - When having no applied filter, we need to ensure the length of the given `sortedDocumentIds` matches the
    //   length of `prevSortedDocumentIds`. Otherwise the data from the frontend is outdated.
    // - When having an applied filter, we need to ensure `reorderSubsetInPlace()` returned all passed document ID's.
    if (prevSortedDocumentIds.length !== nextSortedDocumentIds.length) {
      throw new Error(
        `Expected ${prevSortedDocumentIds.length} document ID(s) but received ${nextSortedDocumentIds.length}.`
      );
    }

    // Determine which entries actually need a database update.
    //
    // To avoid unnecessary re-publishing of all entries when a new sort order is applied,
    // we only update entries when strictly necessary. An update occurs if one of these conditions is met:
    //
    // 1. The entry has moved to a new position in the list.
    //    - Example: If an entry with `documentId = "doc-5"` was at index 5 but now appears at index 3, its sort index must be updated.
    //
    // 2. The entry has never had a valid `sortOrderField` value.
    //    - Example: A newly created entry where `sortOrderField` is `null`, `undefined` or an empty string.
    //      → Needs an initial sort index assigned.
    //
    // 3. The entry’s stored `sortOrderField` is outdated due to earlier changes.
    //    - Example: If an item was at index 4 with `sortOrderField = 4`, but another entry above it was deleted, its correct index is now 3.
    //      → Its stored value is stale and must be fixed.
    //
    // At this point `prevSortedDocumentIds` and `nextSortedDocumentIds` are guaranteed to have the same length,
    // so we can safely access `prevSortedEntries` by the same index.
    const entriesToUpdate = nextSortedDocumentIds
      .map((documentId: DocumentID, index: number) => {
        const prevEntry = prevSortedEntries[index];
        const hasSameDocumentId = prevEntry.documentId === documentId;
        const hasSameSortIndex = prevEntry[config.sortOrderField] === index;
        if (hasSameDocumentId && hasSameSortIndex) {
          return null;
        }

        return { documentId, sortOrder: index };
      })
      .filter((entry) => entry !== null);

    // We intentionally bypass the Document Service API here and write directly to the database via Knex.
    // Normally this is discouraged because it skips lifecycle hooks and couples the code to Strapi’s internal schema.
    //
    // In this case it is acceptable because:
    //
    // 1. Modifying the document using the Document Service API always sets a published document back to a draft state.
    //    Using `publish()` afterwards would publish the entire draft, potentially surfacing content changes the editor
    //    has not yet intentionally published.
    //
    // 2. `sortOrder` is a plugin-managed metadata field, not user-authored content.
    //    It has no business being in a draft state — its purpose is to reflect the current order of entries as configured by the editor.
    //
    // 3. We update all rows sharing the same `document_id` (both draft and published) in a single query,
    //    keeping both versions in sync without any state transition.
    //
    // - Note: All updates are wrapped in a single database transaction so that a partial failure cannot leave
    //         the sort order in an inconsistent state across entries.
    return await strapi.db.connection.transaction(async (trx) => {
      const documentWriter = rawDocumentWriter({ strapi, trx });
      const updatePromises = entriesToUpdate.map(({ documentId, sortOrder }) =>
        documentWriter.updateAllDocumentVersions({
          uid,
          documentId,
          data: { [config.sortOrderField]: sortOrder },
          locale: effectiveLocale,
        })
      );
      return await Promise.all(updatePromises);
    });
  },
});

export default service;

//
// Helper
//

/**
 * Resolves the effective locale to use for queries, returning `undefined` for non-localized content types.
 *
 * Strapi seems to add `plugins[i18n][locale]=<LAST-SELECTED-LOCALE>` to the URL, even for content types where localization is disabled.
 * Passing that locale value to a non-localized type causes problems:
 *
 * - The raw Knex writer fails to match any rows, because the `locale` column is stored as `NULL` for non-localized types.
 * - The Document Service API silently ignores it, but we strip it anyway to keep both callers consistent.
 *
 * @param model - The content type's model, potentially containing the i18n plugin options.
 * @param locale - The locale value injected by Strapi's i18n plugin / `undefined` if localization is turned off.
 *
 * @returns The locale for localized types, or `undefined` for non-localized types.
 */
const resolveEffectiveLocale = (
  model: Schema.ContentType & ModelI18nOptions,
  locale: Locale | undefined
): Locale | undefined => {
  const isLocalized = model.pluginOptions?.i18n?.localized === true;
  return isLocalized ? locale : undefined;
};
