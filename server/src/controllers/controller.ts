//
// Types
//

import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { ContentTypeUID, DocumentIDList, Filters, Locale } from 'src/types';

/** The URL path parameters for the fetch entries request. */
interface FetchEntriesParams {
  uid: ContentTypeUID;
}

/** The query parameters for the fetch entries request. */
interface FetchEntriesQuery {
  sortOrderField?: string;
  mainField?: string;
  filters?: Filters;
  locale?: Locale;
}

/** The URL path parameters for the update sort order request. */
interface UpdateSortOrderParams {
  uid: ContentTypeUID;
}

/** The request body for the update sort order request. */
interface UpdateSortOrderBody {
  data: {
    sortOrderField?: string;
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

    const query = ctx.request.query as FetchEntriesQuery;
    const { sortOrderField, mainField, filters, locale } = query;

    if (!sortOrderField) {
      ctx.badRequest('Missing required `sortOrderField` query parameter.');
      return;
    }

    if (!mainField) {
      ctx.badRequest('Missing required `mainField` query parameter.');
      return;
    }

    const service = strapi.plugin('sortable-entries').service('service');
    const entries = await service.fetchEntries({
      uid,
      sortOrderField,
      mainField,
      filters,
      locale,
    });

    // Minify response.
    ctx.response.body = JSON.stringify(entries);
  },

  /**
   * Controller method for the route that updates the sort order
   * of the collection type with the given `uid` path parameter (POST request).
   */
  async updateSortOrder(ctx: Context) {
    const { uid } = ctx.params as UpdateSortOrderParams;

    const { data } = ctx.request.body as UpdateSortOrderBody;
    const { sortOrderField, sortedDocumentIds, filters, locale } = data;

    if (!sortOrderField) {
      ctx.badRequest('Missing required `sortOrderField` in request body.');
      return;
    }

    if (!sortedDocumentIds) {
      ctx.badRequest('Missing required `sortedDocumentIds` in request body.');
      return;
    }

    const service = strapi.plugin('sortable-entries').service('service');
    await service.updateSortOrder({
      uid,
      sortOrderField,
      sortedDocumentIds,
      filters,
      locale,
    });

    // This will automatically set the `response.status` to 204 (HTTP No Content).
    ctx.response.body = null;
  },
});

export default controller;
