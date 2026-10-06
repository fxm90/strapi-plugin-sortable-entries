//
// Types
//

import type { Filters, PublicationFilterMode, PublicationStatus } from '../types';

/** The Document Service API query params that replace the Content Manager's `__status` filter. */
export interface PublicationStatusParams {
  status?: PublicationStatus;
  publicationFilter?: PublicationFilterMode;
}

/** The result of extracting the publication status filter from the Content Manager's filters. */
export interface ExtractedPublicationStatusFilter extends PublicationStatusParams {
  filters: Filters | undefined;
}

/** The filter condition the Content Manager adds for its "Status" filter, e.g. `{ __status: { $eq: 'published' } }`. */
interface StatusCondition {
  __status: { $eq: string };
}

//
// Config
//

const config = {
  /**
   * Maps the values of the Content Manager's `__status` filter to Document Service API query params.
   *
   * - Note: We use a `Map` instead of a plain object, so that user input like `constructor` can't match inherited object properties.
   *
   * https://github.com/strapi/strapi/blob/main/packages/core/content-manager/server/src/controllers/collection-types.ts (STATUS_QUERY_FROM_FILTER)
   */
  statusParamsByStatusValue: new Map<string, PublicationStatusParams>([
    ['draft', { status: 'draft', publicationFilter: 'never-published' }],
    ['published', { status: 'published' }],
    ['published-modified', { status: 'published', publicationFilter: 'modified' }],
    ['published-unmodified', { status: 'published', publicationFilter: 'unmodified' }],
  ]),
};

//
// Implementation
//

/**
 * Extracts the Content Manager's `__status` filter from the given filters and converts it into Document Service API query params.
 *
 * For content types with "Draft & Publish" enabled, the Content Manager list view offers a "Status" filter which is serialized
 * as `filters[$and][0][__status][$eq]=published`. `__status` is not a real attribute, so passing it to the Document Service API
 * results in a validation error.
 *
 * We mirror the Content Manager's own handling by removing it from `filters.$and` and applying it as `status` / `publicationFilter` instead.
 * Unknown `__status` values are dropped, same as in the Content Manager.
 *
 * @param filters - The filtering criteria sent by the frontend / `undefined` if no filter is applied.
 *
 * @returns The remaining filters (`undefined` if none are left) together with the resolved publication status params.
 *
 * @example
 * extractPublicationStatusFilter({
 *   $and: [
 *     { name: { $eq: 'foo' } },
 *     { __status: { $eq: 'published' } },
 *   ]
 * })
 * // { filters: { $and: [{ name: { $eq: 'foo' } }] }, status: 'published' }
 *
 * extractPublicationStatusFilter({
 *   $and: [
 *     { __status: { $eq: 'draft' } },
 *   ]
 * })
 * // { filters: undefined, status: 'draft', publicationFilter: 'never-published' }
 */
export const extractPublicationStatusFilter = (
  filters: Filters | undefined
): ExtractedPublicationStatusFilter => {
  const filterObject: Record<string, unknown> = filters ?? {};

  // The Content Manager always adds the `__status` condition to `filters.$and`.
  const { $and: andConditions, ...otherFilters } = filterObject;
  if (!Array.isArray(andConditions) || !andConditions.some(isStatusCondition)) {
    return { filters };
  }

  // The resolved publication status parameters derived from the `__status` filter.
  let statusParams: PublicationStatusParams = {};

  // The array of `$and` conditions that are not related to the `__status` filter.
  const remainingAndConditions: unknown[] = [];

  for (const andCondition of andConditions) {
    if (isStatusCondition(andCondition)) {
      // Multiple status conditions are merged, same as in the Content Manager.
      const conditionStatusParams = config.statusParamsByStatusValue.get(andCondition.__status.$eq);
      statusParams = { ...statusParams, ...conditionStatusParams };
    } else {
      remainingAndConditions.push(andCondition);
    }
  }

  // Construct the remaining filters object, including any leftover `$and` conditions.
  const remainingFilters =
    remainingAndConditions.length > 0
      ? { ...otherFilters, $and: remainingAndConditions }
      : otherFilters;

  // Return `undefined` instead of an empty object, so that no filter is applied.
  const filtersWithoutStatus = isEmptyObject(remainingFilters)
    ? undefined
    : (remainingFilters as Filters);

  return {
    filters: filtersWithoutStatus,
    ...statusParams,
  };
};

//
// Helper
//

/**
 * Returns `true` when the given filter condition is the Content Manager's `__status` condition.
 *
 * @example
 * isStatusCondition({ __status: { $eq: 'published' } }) // true
 * isStatusCondition({ name: { $eq: 'foo' } })           // false
 */
const isStatusCondition = (condition: unknown): condition is StatusCondition =>
  typeof (condition as StatusCondition | undefined)?.__status?.$eq === 'string';

/**
 * Returns `true` when the given object has no own keys.
 *
 * @example
 * isEmptyObject({})             // true
 * isEmptyObject({ foo: 'bar' }) // false
 */
const isEmptyObject = (value: object): boolean => Object.keys(value).length === 0;
