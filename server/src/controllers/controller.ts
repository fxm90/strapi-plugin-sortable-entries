import { isValidContentTypeUID } from '../utils/isValidContentTypeUID';
import { isValidDocumentId } from '../utils/isValidDocumentId';
import { isValidFilters } from '../utils/isValidFilters';
import { isValidLocale } from '../utils/isValidLocale';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import type { ContentTypeUID } from '../types';

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
  filters?: unknown;
  locale?: unknown;
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
  sortedDocumentIds?: unknown;
  filters?: unknown;
  locale?: unknown;
}

//
// Controller
//

/**
 * The controller for the sortable entries plugin, containing the HTTP request handling logic for the plugin's routes.
 *
 *  - Note: Controllers validate HTTP input shape and format (presence, type, format of request parameters).
 */
const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * Controller method for the route that fetches the entries
   * of the collection type with the given `uid` path parameter (GET request).
   */
  async fetchEntries(ctx: Context) {
    const { uid } = ctx.params as FetchEntriesParams;
    const { filters, locale } = ctx.request.query as FetchEntriesQuery;

    // Validate the content type UID format before it reaches `strapi.getModel()` and `strapi.documents()`,
    // which use it to look up internal schema definitions and build database queries.
    if (!isValidContentTypeUID(uid)) {
      ctx.badRequest(`Invalid content type UID.`);
      return;
    }

    // Only a shallow shape check — deep validation of the filter structure is handled by Strapi's Document Service API,
    // which sanitizes input against the content type schema.
    if (!isValidFilters(filters)) {
      ctx.badRequest('Invalid `filters` query parameter.');
      return;
    }

    if (!isValidLocale(locale)) {
      ctx.badRequest(`Invalid locale query parameter.`);
      return;
    }

    const service = strapi.plugin('sortable-entries').service('service');
    const entries = await service.fetchEntries({
      uid,
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
    const { sortedDocumentIds, filters, locale } = ctx.request.body as UpdateSortOrderBody;

    // Validate the content type UID format before it reaches `strapi.getModel()` and `strapi.documents()`,
    // which use it to look up internal schema definitions and build database queries.
    if (!isValidContentTypeUID(uid)) {
      ctx.badRequest(`Invalid content type UID.`);
      return;
    }

    // Validate the presence and format of `sortedDocumentIds` before it reaches the service layer,
    // as the sorting algorithm relies on this input to be well-formed.
    if (!Array.isArray(sortedDocumentIds) || sortedDocumentIds.length === 0) {
      ctx.badRequest('Invalid `sortedDocumentIds` request body parameter.');
      return;
    }

    if (!sortedDocumentIds.every(isValidDocumentId)) {
      ctx.badRequest(
        'Invalid `sortedDocumentIds`: All document IDs must be valid Strapi document IDs.'
      );
      return;
    }

    // Only a shallow shape check — deep validation of the filter structure is handled by Strapi's Document Service API,
    // which sanitizes input against the content type schema.
    if (!isValidFilters(filters)) {
      ctx.badRequest('Invalid `filters` request body parameter.');
      return;
    }

    // Validate the locale body value before it reaches the raw Knex query in `updateSortOrder()`,
    // which bypasses Strapi's Document Service API and writes directly to the database.
    if (!isValidLocale(locale)) {
      ctx.badRequest(`Invalid locale request body parameter.`);
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
