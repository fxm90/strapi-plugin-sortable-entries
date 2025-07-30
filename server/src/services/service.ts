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
    let mutableSortedDocumentIds = [...sortedDocumentIds];
    if (!!filters) {
      // We have an applied filter, so the `sortedDocumentIds` are only a subset of all entries.
      // As the values of `sortOrderField` should be unique, we still need to update all entries and therefore fetch them here.
      const allSortedEntries = await strapi.documents(uid).findMany({
        fields: ['documentId'],
        sort: sortOrderField,
        locale,
      });

      const allSortedDocumentsIds = allSortedEntries.map((entry) => entry.documentId);
      mutableSortedDocumentIds = reorderSubsetInPlace(allSortedDocumentsIds, sortedDocumentIds);
    }

    // Map the list of sorted document ID's to promises,
    // that reflect updating the corresponding database entry.
    const updatePromises = mutableSortedDocumentIds.map(
      async (documentId: DocumentID, index: number) =>
        strapi.documents(uid).update({
          documentId,
          locale,
          data: {
            [sortOrderField]: index,
          },
        })
    );

    return await Promise.all(updatePromises);
  },
});

export default service;
