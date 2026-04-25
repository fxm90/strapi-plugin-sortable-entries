import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from './service';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, Filters, Locale } from '../types';
import type { ModelI18nOptions } from './service';

//
// Mock "Strapi"
//

// The result from a call to `strapi.documents("api::XYZ.XYZ").findMany()`.
let stubbedFindManyResult: AnyDocument[];
const mockFindMany = vi.fn(() => stubbedFindManyResult);

const mockDocuments = vi.fn(() => {
  return {
    findMany: mockFindMany,
  };
});

// The result from a call to `strapi.getModel("api::XYZ.XYZ")`.
let stubbedGetModelResult: ModelI18nOptions | undefined;
const mockGetModel = vi.fn(() => stubbedGetModelResult);

const mockStrapi = {
  documents: mockDocuments,
  getModel: mockGetModel,
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
} as unknown as Core.Strapi;

//
// Tests
//
// - Note: These tests assume a configuration where `sortOrderField` is set to `sortOrder`.
//         If you are using a different field name, you need to adjust the tests accordingly.
//

describe(`test method "fetchEntries()"`, () => {
  beforeEach(() => {
    stubbedGetModelResult = createModelWithLocalization(false);
    stubbedFindManyResult = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke `strapi.getModel(uid)`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const mainField = 'name';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      mainField,
      filters,
      locale,
    });

    // Then
    expect(mockGetModel).toHaveBeenCalledWith(uid);
  });

  it('should throw an error when `strapi.getModel(uid)` returns undefined.', async () => {
    // Given
    stubbedGetModelResult = undefined;

    const uid: ContentTypeUID = 'api::test.test';
    const mainField = 'name';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    await expect(() =>
      service({ strapi: mockStrapi }).fetchEntries({
        uid,
        mainField,
        filters,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `strapi.documents(uid)` with correct uid.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const mainField = 'name';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      mainField,
      filters,
      locale,
    });

    // Then
    expect(mockDocuments).toHaveBeenCalledWith(uid);
  });

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `strapi.documents(uid).findMany()` with correct parameters (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);

      // Given
      const uid: ContentTypeUID = 'api::test.test';
      const mainField = 'name';
      const filters: Filters = { field: 'value' };
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).fetchEntries({
        uid,
        mainField,
        filters,
        locale,
      });

      // Then
      expect(mockFindMany).toHaveBeenCalledWith({
        fields: [mainField],
        sort: 'sortOrder:asc',
        filters,
        locale: isLocalized ? locale : undefined,
      });
    }
  );

  it('should return result from `strapi.documents(uid).findMany()`.', async () => {
    // Given
    stubbedFindManyResult = [
      { id: 1, documentId: 'doc-1', sortOrder: 0 },
      { id: 2, documentId: 'doc-2', sortOrder: 1 },
      { id: 3, documentId: 'doc-3', sortOrder: 2 },
    ];

    const uid: ContentTypeUID = 'api::test.test';
    const mainField = 'name';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    const result = await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      mainField,
      filters,
      locale,
    });

    // Then
    expect(result).toBe(stubbedFindManyResult);
  });
});

//
// Helper
//

/** Creates a model with localization enabled or disabled. */
const createModelWithLocalization = (localized: boolean): ModelI18nOptions => ({
  pluginOptions: {
    i18n: {
      localized,
    },
  },
});
