/**
 * Enum representing an action that is running through Strapi's Document Service middlewares.
 * https://docs.strapi.io/cms/api/document-service/middlewares#context
 *
 * This enum helps avoid using magic strings (e.g. "create", "update", "delete")
 * and provides a type-safe way to switch or compare against actions.
 */
export const enum DocumentAction {
  Create = 'create',
  Delete = 'delete',
}
