import { reorderSubsetInPlace } from '../utils/reorderSubsetInPlace';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, DocumentIDList, Filters, Locale } from 'src/types';

//
// Service
//

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Retrieves all entries for a given content type, sorted by the given `sortOrderField`.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param sortOrderField - The database field used to define the order of entries.
   * @param mainField - The name of the field to display as the primary label in UI listings.
   * @param filters - The filtering criteria to apply / `undefined` if all entries should be returned.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise resolving to an array of entries,
   *          each containing the `documentId` and the specified `mainField`.
   */
  async fetchEntries({
    uid,
    sortOrderField,
    mainField,
    filters,
    locale,
  }: {
    uid: ContentTypeUID;
    sortOrderField: string;
    mainField: string;
    filters: Filters | undefined;
    locale: Locale | undefined;
  }) {
    return await strapi.documents(uid).findMany({
      fields: ['documentId', mainField],
      sort: sortOrderField,
      filters,
      locale,
    });
  },

  /**
   * Updates the sort order field of multiple entries for a given content type,
   * based on the provided list of document IDs.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param sortOrderField - The database field used to define the order of entries.
   * @param sortedDocumentIds - An ordered array of document IDs representing the new sequence of entries.
   * @param filters - The filtering criteria applied when fetching the entries / `undefined` if all entries were returned.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise that resolves when all entries have been updated with their new sort order.
   */
  async updateSortOrder({
    uid,
    sortOrderField,
    sortedDocumentIds,
    filters,
    locale,
  }: {
    uid: ContentTypeUID;
    sortOrderField: string;
    sortedDocumentIds: DocumentIDList;
    filters: Filters | undefined;
    locale: Locale | undefined;
  }) {
    // Fetch previous sort order of all entries to detect an actual change in position
    // when updating the entries below and to handle any active filters.
    const prevSortedEntries = await strapi.documents(uid).findMany({
      fields: ['documentId'],
      sort: sortOrderField,
      locale,
    });

    // The previous sorted list of document ID's.
    const prevSortedDocumentIds = prevSortedEntries.map((entry) => entry.documentId);

    // The new sorted list of document ID's, defined by the frontend.
    let nextSortedDocumentIds = [...sortedDocumentIds];

    if (!!filters) {
      // We have an applied filter, so the given `sortedDocumentIds` are only a subset of all entries.
      // As the values of `sortOrderField` needs to be unique, we still need to update all entries.
      nextSortedDocumentIds = reorderSubsetInPlace(prevSortedDocumentIds, sortedDocumentIds);
    }

    // Validate input before updating any entries.
    // - When having no applied filter, we need to ensure the length of the given `sortedDocumentIds` matches the
    //   length of `prevSortedDocumentIds`. Otherwise the data from the frontend is outdated.
    // - When having an applied filter, we need to ensure `reorderSubsetInPlace()` returned all passed document ID's.
    if (prevSortedDocumentIds.length !== nextSortedDocumentIds.length) {
      throw new Error(`Expected to have the same number of document ID's as previously fetched.`);
    }

    // Map the new sorted list of document ID's to promises that reflect updating the corresponding database entries.
    const updatePromises = nextSortedDocumentIds
      .map((documentId: DocumentID, index: number) => {
        // At this point `prevSortedDocumentIds` and `nextSortedDocumentIds` are guaranteed to have the same length.
        // Therefore we can safely access the value at the same index.
        const prevDocumentIdAtIndex = prevSortedDocumentIds[index];

        if (prevDocumentIdAtIndex === documentId) {
          // The position of this document is unchanged, no need to update the sort order field.
          return null;
        }

        return strapi.documents(uid).update({
          documentId,
          locale,
          data: {
            [sortOrderField]: index,
          },
        });
      })
      .filter((optionalPromise) => !!optionalPromise);

    return await Promise.all(updatePromises);
  },
});

export default service;
