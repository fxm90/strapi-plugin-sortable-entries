//
// Types
//

import type { Core } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, Locale } from '../types';

/** A Knex connection or transaction capable of building queries for a table. */
type DatabaseConnection = Core.Strapi['db']['connection'];

//
// Implementation
//

/**
 * @param strapi - The Strapi instance.
 *
 * @param trx - An optional Knex transaction. When provided, all queries built by the returned writer participate in that transaction.
 *              `Knex.Transaction` extends `Knex`, so it is assignable to `DatabaseConnection`.
 */
export const rawDocumentWriter = ({
  strapi,
  trx,
}: {
  strapi: Core.Strapi;
  trx?: DatabaseConnection;
}) => ({
  /**
   * Updates all database rows belonging to a document (both draft and published) with the given data,
   * bypassing the Document Service API.
   *
   * This is intentionally done via Knex rather than the Document Service API because:
   *
   * - The Document Service has no way to update a single field across both versions.
   *
   * - Using `.update()` + `.publish()` would publish the entire draft, potentially
   *   surfacing content changes the editor has not yet intentionally published.
   *
   * - `strapi.db.query()` would trigger lifecycle hooks (e.g. `beforeUpdate`, `afterUpdate`),
   *   which is undesirable for internal metadata updates.
   *
   * Object keys in `data` are automatically converted from camelCase to snake_case
   * to match the database column naming convention.
   *
   * @throws If the content type has no collection name.
   */
  async updateAllDocumentVersions({
    uid,
    documentId,
    data,
    locale,
  }: {
    uid: ContentTypeUID;
    documentId: DocumentID;
    locale: Locale | undefined;
    data: Record<string, unknown>;
  }): Promise<number> {
    const tableName = strapi.getModel(uid)?.collectionName;
    if (!tableName) {
      throw new Error(
        `Expected to have a collection name for the content type "${uid}" at this point.`
      );
    }

    const connection = trx ?? strapi.db.connection;
    const query = connection(tableName)
      .update(mapKeysToSnakeCase(data))
      .where({ document_id: documentId });

    if (!locale) {
      // We explicitly need to provide `null` here, because in the database
      // the locale is stored as `NULL` when localization is turned off.
      return await query.whereNull('locale');
    }

    return await query.where({ locale });
  },
});

//
// Helper
//

/**
 * Converts a camelCase string to snake_case.
 *
 * @example
 * camelCaseToSnakeCase('myField')    // 'my_field'
 * camelCaseToSnakeCase('myURLField') // 'my_url_field'
 * camelCaseToSnakeCase('sortOrder')  // 'sort_order'
 */
const camelCaseToSnakeCase = (str: string): string =>
  str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // e.g. "URLField" → "URL_Field"
    .replace(/([a-z\d])([A-Z])/g, '$1_$2') // e.g. "myURL" → "my_URL"
    .toLowerCase();

/**
 * Returns a new object with all keys converted from camelCase to snake_case.
 * Values are left unchanged.
 *
 * @example
 * mapKeysToSnakeCase({ myField: 'foo', sortOrder: 1 }) // { my_field: 'foo', sort_order: 1 }
 */
const mapKeysToSnakeCase = (data: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [camelCaseToSnakeCase(key), value])
  );
