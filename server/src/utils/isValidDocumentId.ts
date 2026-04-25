//
// Types
//

import type { DocumentID } from '../types';

//
// Config
//

const config = {
  /**
   * A regex that matches a valid Strapi 5 document ID.
   *
   * Strapi generates document IDs using `@paralleldrive/cuid2`, which produces 24-character Base36 strings.
   * Base36 uses only lowercase letters and digits, so the character set is strictly `[a-z0-9]` — never uppercase.
   *
   * https://docs.strapi.io/cms/api/document-service
   * https://github.com/paralleldrive/cuid2
   */
  documentIdRegex: /^[a-z0-9]{24}$/,
};

//
// Implementation
//

export const isValidDocumentId = (value: unknown): value is DocumentID =>
  typeof value === 'string' && config.documentIdRegex.test(value);
