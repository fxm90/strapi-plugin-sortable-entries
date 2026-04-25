import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from './service';

//
// Types
//

import type { Core, Schema } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, Locale } from '../types';

//
// Mock "hasFieldOfType"
//

let stubbedHasFieldOfTypeResult: boolean;
const mockHasFieldOfType = vi.hoisted(() => vi.fn(() => stubbedHasFieldOfTypeResult));

vi.mock('../utils/hasFieldOfType', () => ({
  hasFieldOfType: mockHasFieldOfType,
}));

//
// Mock "resolveEffectiveLocale"
//

let stubbedResolveEffectiveLocaleResult: Locale | undefined;
const mockResolveEffectiveLocale = vi.hoisted(() =>
  vi.fn(() => stubbedResolveEffectiveLocaleResult)
);

vi.mock('../utils/resolveEffectiveLocale', () => ({
  resolveEffectiveLocale: mockResolveEffectiveLocale,
}));

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
let stubbedGetModelResult: Schema.ContentType | undefined;
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
// - Note: These tests assume a configuration where `sortOrderFieldName` is set to `sortOrder` and that the `sortOrderFieldType` is set to `integer`.
//         If you are using a different field name or type, you need to adjust the tests accordingly.
//

describe(`test method "fetchLastEntry()"`, () => {
  beforeEach(() => {
    stubbedHasFieldOfTypeResult = true;
    stubbedGetModelResult = createModel();
    stubbedResolveEffectiveLocaleResult = 'en';
    stubbedFindFirstResult = { id: 1, documentId: 'doc-1', sortOrder: 0 };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke `strapi.getModel(uid)`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

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
    const locale: Locale = 'de';

    // When
    await expect(
      async () =>
        await service({ strapi: mockStrapi }).fetchLastEntry({
          uid,
          locale,
        })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `hasFieldOfType()` with correct parameters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockHasFieldOfType).toHaveBeenCalledWith(stubbedGetModelResult, 'sortOrder', 'integer');
  });

  it('should throw an error when `hasFieldOfType()` returns false.', async () => {
    // Given
    stubbedHasFieldOfTypeResult = false;

    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

    // When
    await expect(
      async () =>
        await service({ strapi: mockStrapi }).fetchLastEntry({
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
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockDocuments).toHaveBeenCalledWith(uid);
  });

  it('should invoke `resolveEffectiveLocale()` with correct parameters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockResolveEffectiveLocale).toHaveBeenCalledWith({
      strapi: mockStrapi,
      model: stubbedGetModelResult,
      locale,
    });
  });

  it('should invoke `strapi.documents(uid).findFirst()` with correct parameters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchLastEntry({
      uid,
      locale,
    });

    // Then
    expect(mockFindFirst).toHaveBeenCalledWith({
      fields: ['sortOrder'],
      sort: 'sortOrder:desc',
      locale: stubbedResolveEffectiveLocaleResult,
    });
  });

  it('should return result from `strapi.documents(uid).findFirst()`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'de';

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

const createModel = (): Schema.ContentType => ({
  modelType: 'contentType',
  modelName: 'test',
  globalId: 'Test',
  uid: 'api::test.test',
  kind: 'collectionType',
  info: { singularName: 'test', pluralName: 'tests', displayName: 'Test' },
  options: {},
  attributes: {},
  pluginOptions: {},
});
