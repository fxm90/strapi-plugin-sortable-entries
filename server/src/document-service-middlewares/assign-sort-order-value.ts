import { config } from '../config';
import { DocumentAction } from '../constants';

//
// Types
//

import type { Core, Modules } from '@strapi/strapi';
import type { AnyDocument } from 'src/types';

/** Represents the input when creating a sortable document. */
interface SortableDocumentInput {
  [config.sortOrderField]: number | null;
  [key: string]: any;
}

/** Represents a sortable document from the database. */
interface SortableDocument extends AnyDocument {
  [config.sortOrderField]: number | null;
}

//
// Helper
//

const hasSortOrderField = (input: any): input is SortableDocumentInput =>
  input.hasOwnProperty(config.sortOrderField);

//
// Middleware
//

/**
 * A middleware that automatically assigns a value to the configured sort order field when creating a new entry.
 *
 * - Note: Exporting the middleware callback directly simplifies testing. However, this export is intended solely for use in tests.
 *         For registering the middleware in the actual application, please use the default export below.
 */
export const assignSortOrderValueMiddlewareCallback: Modules.Documents.Middleware.Middleware =
  async (context, next) => {
    switch (context.action) {
      case DocumentAction.Create:
        const data = context.params.data;
        if (!hasSortOrderField(data)) {
          // The current content type does not have a sort order field, no need to auto-assign a new value.
          break;
        }

        const sortOrder = data[config.sortOrderField];
        if (sortOrder || sortOrder === 0) {
          // The user has already provided a valid value for the sort order field, no need to auto-assign a new value.
          break;
        }

        // prettier-ignore
        const lastEntry = (await strapi
          .service('plugin::sortable-entries.service')
          .fetchLastEntry({uid: context.uid, locale: data.locale})) as SortableDocument | undefined;

        const lastSortOrder = lastEntry?.[config.sortOrderField];
        const nextSortOrder = lastSortOrder || lastSortOrder === 0 ? lastSortOrder + 1 : 0;

        data[config.sortOrderField] = nextSortOrder;
        break;

      case DocumentAction.Delete:
        // We explicitly skip updating any sort order field(s) upon deleting an entry,
        // as the user would need to re-publish all above entries after deleting one.
        break;

      default:
        break;
    }

    return await next();
  };

/**
 * Adds the above middleware to the document service.
 */
const assignSortOrderValueMiddleware = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.documents.use(assignSortOrderValueMiddlewareCallback);
};

export default assignSortOrderValueMiddleware;
