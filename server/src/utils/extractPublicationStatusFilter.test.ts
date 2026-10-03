import { describe, expect, it } from 'vitest';
import { extractPublicationStatusFilter } from './extractPublicationStatusFilter';

//
// Types
//

import type { Filters } from '../types';

//
// Tests
//

describe(`test method "extractPublicationStatusFilter()"`, () => {
  it('should return `undefined` filters when no filters are given.', () => {
    // Given
    const filters: Filters | undefined = undefined;

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({ filters: undefined });
  });

  it('should return the filters unchanged when they do not contain `$and`.', () => {
    // Given
    const filters: Filters = { name: { $eq: 'foo' } };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({ filters });
  });

  it('should return the filters unchanged when `$and` does not contain a `__status` condition.', () => {
    // Given
    const filters: Filters = { $and: [{ name: { $eq: 'foo' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({ filters });
  });

  it('should map the `__status` value "draft" to publication status params.', () => {
    // Given
    const filters: Filters = { $and: [{ __status: { $eq: 'draft' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: undefined,
      status: 'draft',
      publicationFilter: 'never-published',
    });
  });

  it('should map the `__status` value "published" to publication status params.', () => {
    // Given
    const filters: Filters = { $and: [{ __status: { $eq: 'published' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: undefined,
      status: 'published',
    });
  });

  it('should map the `__status` value "published-modified" to publication status params.', () => {
    // Given
    const filters: Filters = { $and: [{ __status: { $eq: 'published-modified' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: undefined,
      status: 'published',
      publicationFilter: 'modified',
    });
  });

  it('should map the `__status` value "published-unmodified" to publication status params.', () => {
    // Given
    const filters: Filters = { $and: [{ __status: { $eq: 'published-unmodified' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: undefined,
      status: 'published',
      publicationFilter: 'unmodified',
    });
  });

  it('should drop the `__status` condition when its value is unknown.', () => {
    // Given
    const filters: Filters = { $and: [{ __status: { $eq: 'unknown' } }] };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({ filters: undefined });
  });

  it('should keep the remaining `$and` conditions when removing the `__status` condition.', () => {
    // Given
    const filters: Filters = {
      $and: [{ name: { $eq: 'foo' } }, { __status: { $eq: 'published' } }],
    };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: { $and: [{ name: { $eq: 'foo' } }] },
      status: 'published',
    });
  });

  it('should keep filters outside of `$and` when removing the `__status` condition.', () => {
    // Given
    const filters: Filters = {
      name: { $eq: 'foo' },
      $and: [{ __status: { $eq: 'published' } }],
    };

    // When
    const result = extractPublicationStatusFilter(filters);

    // Then
    expect(result).toStrictEqual({
      filters: { name: { $eq: 'foo' } },
      status: 'published',
    });
  });
});
