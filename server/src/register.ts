import assignSortOrderValueMiddleware from './document-service-middlewares/assign-sort-order-value';

//
// Types
//

import type { Core } from '@strapi/strapi';

//
// Register Phase
//

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  assignSortOrderValueMiddleware({ strapi });
};

export default register;
