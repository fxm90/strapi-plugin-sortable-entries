//
// Types
//

import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { ContentTypeUID, DocumentIDList, Filters, Locale } from '../types';

/** The URL path parameters for the fetch entries request. */
interface FetchEntriesParams {
  uid: ContentTypeUID;
}

/**
 * The query parameters for the fetch entries request.
 *
 * `filters` is a complex object serialized into the query string using qs-style bracket notation,
 * e.g. `filters[name][$eq]=foo` or `filters[$and][0][name][$eq]=foo`.
 *
 * Koa parses these back into a nested object automatically.
 */
interface FetchEntriesQuery {
  mainField?: string;
  filters?: Filters;
  locale?: Locale;
}

/** The URL path parameters for the update sort order request. */
interface UpdateSortOrderParams {
  uid: ContentTypeUID;
}

/**
 * The request body for the update sort order request.
 *
 * `filters` is a complex object serialized into the query string using qs-style bracket notation,
 * e.g. `filters[name][$eq]=foo` or `filters[$and][0][name][$eq]=foo`.
 *
 * Koa parses these back into a nested object automatically.
 */
interface UpdateSortOrderBody {
  data: {
    sortedDocumentIds?: DocumentIDList;
    filters?: Filters;
    locale?: Locale;
  };
}

//
// Controller
//

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Controller method for the route that fetches the entries
   * of the collection type with the given `uid` path parameter (GET request).
   */
  async fetchEntries(ctx: Context) {
    const { uid } = ctx.params as FetchEntriesParams;
    const { mainField, filters, locale } = ctx.request.query as FetchEntriesQuery;

    if (!mainField) {
      ctx.badRequest('Missing required `mainField` query parameter.');
      return;
    }

    const service = strapi.plugin('sortable-entries').service('service');
    const entries = await service.fetchEntries({
      uid,
      mainField,
      filters,
      locale,
    });

    ctx.body = entries;
  },

  /**
   * Controller method for the route that updates the sort order
   * of the collection type with the given `uid` path parameter (POST request).
   */
  async updateSortOrder(ctx: Context) {
    const { uid } = ctx.params as UpdateSortOrderParams;

    const { data } = ctx.request.body as UpdateSortOrderBody;
    const { sortedDocumentIds, filters, locale } = data;

    if (!sortedDocumentIds) {
      ctx.badRequest('Missing required `sortedDocumentIds` in request body.');
      return;
    }

    if (!Array.isArray(sortedDocumentIds)) {
      ctx.badRequest('Expected `sortedDocumentIds` to be an array.');
      return;
    }

    const service = strapi.plugin('sortable-entries').service('service');
    await service.updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // This will automatically set the `response.status` to 204 (HTTP No Content).
    ctx.body = null;
  },
});

export default controller;
