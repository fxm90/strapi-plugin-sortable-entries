import { config } from '../config';
import { hasFieldOfType } from '../utils/hasFieldOfType';
import { isEqualSets } from '../utils/isEqualSets';
import { rawDocumentWriter } from '../utils/rawDocumentWriter';
import { reorderSubset } from '../utils/reorderSubset';
import { resolveEffectiveLocale } from '../utils/resolveEffectiveLocale';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, DocumentIDList, Filters, Locale } from '../types';

//
// Service
//

/*
 * The service for the sortable entries plugin, containing the core business logic for
 * fetching and updating the sort order of entries.
 *
 *  - Note: Services validate business and domain invariants (e.g. content type existence, required fields, data consistency).
 */
const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Retrieves all entries for a given content type, sorted by the given `sortOrderFieldName`.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param filters - The filtering criteria to apply / `undefined` if all entries should be returned.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise resolving to an array of entries,
   *          each containing the `documentId` and the specified `mainField`.
   */
  async fetchEntries({
    uid,
    filters,
    locale,
  }: {
    uid: ContentTypeUID;
    filters: Filters | undefined;
    locale: Locale | undefined;
  }) {
    const model = strapi.getModel(uid);
    if (!model) {
      throw new Error(`Content type "${uid}" not found.`);
    }

    const { sortOrderFieldName, sortOrderFieldType } = config;
    if (!hasFieldOfType(model, sortOrderFieldName, sortOrderFieldType)) {
      throw new Error(
        `Content type "${uid}" must define a "${sortOrderFieldName}" attribute of type "${sortOrderFieldType}".`
      );
    }

    // Resolve the `mainField` — the field configured as the "Entry title" in the Content Manager's edit view settings
    // (e.g. "title" for articles, "name" for categories).
    // Used as the human-readable label for each entry in the sort modal.
    //
    // @see https://docs.strapi.io/cms/features/content-manager (Entry title configuration)
    // @see https://github.com/strapi/strapi/blob/main/packages/core/content-manager/server/src/services/content-types.ts (findConfiguration)
    const contentTypeService = strapi.plugin('content-manager').service('content-types');
    const contentTypeConfig = await contentTypeService.findConfiguration(model);
    const mainField = contentTypeConfig.settings?.mainField;

    const effectiveLocale = await resolveEffectiveLocale({ strapi, model, locale });
    const result = await strapi.documents(uid).findMany({
      fields: mainField ? [mainField] : [],
      sort: `${sortOrderFieldName}:asc`,
      filters,
      locale: effectiveLocale,
    });

    return result.map((entry) => ({
      documentId: entry.documentId,
      mainField: mainField ? entry[mainField] : null,
    }));
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

    const { sortOrderFieldName, sortOrderFieldType } = config;
    if (!hasFieldOfType(model, sortOrderFieldName, sortOrderFieldType)) {
      throw new Error(
        `Content type "${uid}" must define a "${sortOrderFieldName}" attribute of type "${sortOrderFieldType}".`
      );
    }

    const effectiveLocale = await resolveEffectiveLocale({ strapi, model, locale });
    return strapi.documents(uid).findFirst({
      fields: [sortOrderFieldName],
      sort: `${sortOrderFieldName}:desc`,
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

    const { sortOrderFieldName, sortOrderFieldType } = config;
    if (!hasFieldOfType(model, sortOrderFieldName, sortOrderFieldType)) {
      throw new Error(
        `Content type "${uid}" must define a "${sortOrderFieldName}" attribute of type "${sortOrderFieldType}".`
      );
    }

    // Validate the submitted document IDs before using them in either the filtered or unfiltered path.
    const submittedDocumentIdSet = new Set(sortedDocumentIds);
    if (submittedDocumentIdSet.size !== sortedDocumentIds.length) {
      throw new Error('Expected submitted document IDs to be unique.');
    }

    // Fetch previous sort order of all entries to detect an actual change in position when updating the entries below and
    // to provide the full ordering baseline for filtered reorders.
    const effectiveLocale = await resolveEffectiveLocale({ strapi, model, locale });
    const prevSortedEntries = await strapi.documents(uid).findMany({
      fields: [sortOrderFieldName],
      sort: `${sortOrderFieldName}:asc`,
      locale: effectiveLocale,
    });

    // The previous sorted list of document IDs.
    const prevSortedDocumentIds = prevSortedEntries.map((entry) => entry.documentId);

    // The new sorted list of document IDs, defined by the frontend.
    let nextSortedDocumentIds = [...sortedDocumentIds];

    if (filters) {
      // Re-fetch the currently visible subset and reject stale modal submissions before merging them back into the full list.
      // Without this check, a stale filtered modal could silently reshuffle hidden entries.
      const filteredEntries = await strapi.documents(uid).findMany({
        fields: [sortOrderFieldName],
        sort: `${sortOrderFieldName}:asc`,
        filters,
        locale: effectiveLocale,
      });

      const filteredDocumentIds = filteredEntries.map((entry) => entry.documentId);
      const filteredDocumentIdSet = new Set(filteredDocumentIds);

      if (!isEqualSets(filteredDocumentIdSet, submittedDocumentIdSet)) {
        throw new Error('Expected submitted document IDs to match the current filtered entries.');
      }

      // We have an applied filter, so the given `sortedDocumentIds` are only a subset of all entries.
      // As the values of `sortOrderFieldName` needs to be unique, we still need to update all entries.
      nextSortedDocumentIds = reorderSubset(prevSortedDocumentIds, sortedDocumentIds);
    } else {
      // Without a filter, the frontend submits the full list — it must match all entries currently in the database.
      // A mismatch means entries were added or removed since the modal was opened.
      const prevDocumentIdSet = new Set(prevSortedDocumentIds);
      if (!isEqualSets(prevDocumentIdSet, submittedDocumentIdSet)) {
        throw new Error('Expected submitted document IDs to match the current entries.');
      }
    }

    // Determine which entries actually need a database update.
    //
    // To avoid unnecessary re-publishing of all entries when a new sort order is applied,
    // we only update entries when strictly necessary. An update occurs if one of these conditions is met:
    //
    // 1. The entry has moved to a new position in the list.
    //    - Example: If an entry with `documentId = "doc-5"` was at index 5 but now appears at index 3, its sort index must be updated.
    //
    // 2. The entry has never had a valid `sortOrderFieldName` value.
    //    - Example: A newly created entry where `sortOrderFieldName` is `null`, `undefined` or an empty string.
    //      → Needs an initial sort index assigned.
    //
    // 3. The entry’s stored `sortOrderFieldName` is outdated due to earlier changes.
    //    - Example: If an item was at index 4 with `sortOrderFieldName = 4`, but another entry above it was deleted, its correct index is now 3.
    //      → Its stored value is stale and must be fixed.
    //
    // At this point `prevSortedDocumentIds` and `nextSortedDocumentIds` are guaranteed to have the same length,
    // so we can safely access `prevSortedEntries` by the same index.
    const entriesToUpdate = nextSortedDocumentIds
      .map((documentId: DocumentID, index: number) => {
        const prevEntry = prevSortedEntries[index];
        const hasSameDocumentId = prevEntry.documentId === documentId;
        const hasSameSortIndex = prevEntry[sortOrderFieldName] === index;
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
    // 2. Modifying the document using the Document Service API would further update the `updatedAt` / `updatedBy` values and
    //    trigger lifecycle hooks, which is undesirable for an internal metadata update.
    //
    // 3. `sortOrder` is a plugin-managed metadata field, not user-authored content.
    //    It has no business being in a draft state — its purpose is to reflect the metadata of the live document,
    //    regardless of any unpublished changes in the draft.
    //
    // 4. We update all rows sharing the same `document_id` (both draft and published) in a single query,
    //    keeping both versions in sync without any state transition.
    //
    // - Note: All updates are wrapped in a single database transaction so that a partial failure cannot leave
    //         the sort order in an inconsistent state across entries.
    //
    // - Note: The individual `UPDATE` statements are executed sequentially to avoid potential deadlocks
    //         that can occur when concurrent writes within the same transaction lock rows in different orders.
    return await strapi.db.connection.transaction(async (trx) => {
      const documentWriter = rawDocumentWriter({ strapi, trx });
      for (const { documentId, sortOrder } of entriesToUpdate) {
        await documentWriter.updateAllDocumentVersions({
          uid,
          documentId,
          data: { [sortOrderFieldName]: sortOrder },
          locale: effectiveLocale,
        });
      }
    });
  },
});

export default service;
