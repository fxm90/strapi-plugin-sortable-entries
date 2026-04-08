import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from './service';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, Locale } from '../types';
import type { ModelI18nOptions } from './service';

//
// Mock "Strapi"
//

// The result from a call to `strapi.documents("api::XYZ.XYZ").findFirst()`.
let stubbedFindFirstResult: AnyDocument;
const mockFindFirst = vi.fn(() => stubbedFindFirstResult);

const mockDocuments = vi.fn(() => {
  return {
    findFirst: mockFindFirst,
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

describe(`test method "fetchLastEntry()"`, () => {
  beforeEach(() => {
    stubbedGetModelResult = createModelWithLocalization(false);
    stubbedFindFirstResult = { id: 1, documentId: 'doc-1', sortOrder: 0 };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke `strapi.getModel(uid)`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockGetModel).toHaveBeenCalledWith(uid);
  });

  it('should throw an error when `strapi.getModel(uid)` returns undefined.', async () => {
    // Given
    stubbedGetModelResult = undefined;

    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';

    // When
    await expect(() =>
      service({ strapi: mockStrapi }).fetchLastEntry({
        uid,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `strapi.documents(uid)` with correct uid.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockDocuments).toHaveBeenCalledWith(uid);
  });

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `strapi.documents(uid).findOne()` with correct parameters (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);

      // Given
      const uid: ContentTypeUID = 'api::test.test';
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).fetchLastEntry({
        uid,
        locale,
      });

      // Then
      expect(mockFindFirst).toHaveBeenCalledWith({
        fields: ['sortOrder'],
        sort: 'sortOrder:desc',
        locale: isLocalized ? locale : undefined,
      });
    }
  );

  it('should return result from `strapi.documents(uid).findFirst()`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';

    // When
    const result = await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(result).toBe(stubbedFindFirstResult);
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
