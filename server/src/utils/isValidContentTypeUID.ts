//
// Types
//
import type { ContentTypeUID } from '../types';

//
// Config
//

const config = {
  /**
   * A regex that matches a valid Strapi 5 content-type UID.
   *
   * Content-type UIDs follow the format `<source>::<name>.<name>`, where:
   * - `<source>` is one of `api`, `plugin`, or `admin`
   * - `<name>` is a kebab-case identifier (lowercase letters, digits, and hyphens)
   *
   * Examples: `api::article.article`, `plugin::users-permissions.user`, `admin::user`
   *
   * https://docs.strapi.io/cms/backend-customization/models
   */
  contentTypeUIDRegex: /^(api|plugin|admin)::[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)?$/,
};

//
// Implementation
//

export const isValidContentTypeUID = (value: unknown): value is ContentTypeUID =>
  typeof value === 'string' && config.contentTypeUIDRegex.test(value);
