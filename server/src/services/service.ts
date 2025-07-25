//
// Types
//

import type { Core } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, DocumentIDList, Locale } from 'src/types';

//
// Service
//

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Retrieves all entries for a given content type, sorted by the given `sortOrderField`.
   *
   * @param uid - The unique identifier of the content type (e.g. 'api::products.products').
   * @param sortOrderField - The database field by which to sort the entries in ascending order.
   * @param mainField - The main display field of each entry, used for UI listing.
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise resolving to an array of entries,
   *          each containing the `documentId` and the specified `mainField`.
   */
  async fetchEntries({
    uid,
    sortOrderField,
    mainField,
    locale,
  }: {
    uid: ContentTypeUID;
    sortOrderField: string;
    mainField: string;
    locale: Locale | undefined;
  }) {
    return await strapi.documents(uid).findMany({
      fields: ['documentId', mainField],
      sort: sortOrderField,
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
   * @param locale - The current locale of the content type / `undefined` if localization is turned off.
   *
   * @returns A promise that resolves when all entries have been updated with their new sort order.
   */
  async updateSortOrder({
    uid,
    sortOrderField,
    sortedDocumentIds,
    locale,
  }: {
    uid: ContentTypeUID;
    sortOrderField: string;
    sortedDocumentIds: DocumentIDList;
    locale: Locale | undefined;
  }) {
    // Map the list of document id's to promises,
    // that reflect updating the corresponding database entry.
    const updatePromises = sortedDocumentIds.map(async (documentId: DocumentID, index: number) =>
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
