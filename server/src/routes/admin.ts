import type { PolicyConfig } from '../policies/hasPermission';

const hasPermission = (config: PolicyConfig) => ({
  name: 'plugin::sortable-entries.hasPermission',
  config,
});

export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/fetch-entries/:uid',
      handler: 'controller.fetchEntries',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          hasPermission({
            actions: ['plugin::content-manager.explorer.read'],
          }),
        ],
      },
    },
    {
      method: 'POST',
      path: '/update-sort-order/:uid',
      handler: 'controller.updateSortOrder',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          hasPermission({
            actions: ['plugin::content-manager.explorer.update'],
          }),
        ],
      },
    },
  ],
};
