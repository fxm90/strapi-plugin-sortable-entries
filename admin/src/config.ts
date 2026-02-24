export const config = {
  /**
   * The database field containing the order of the sorted entries.
   *
   * - Note: Unfortunately there is no easy way to share the configuration between the admin- and server-side code,
   *         so we need to duplicate the config here for now.
   */
  sortOrderField: 'sortOrder',
} as const;
