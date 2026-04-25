import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from './service';

//
// Types
//

import type { Core, Schema } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, Filters, Locale } from '../types';

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

// The result from a call to `strapi.documents("api::XYZ.XYZ").findMany()`.
let stubbedFindManyResult: AnyDocument[];
const mockFindMany = vi.fn(() => stubbedFindManyResult);

const mockDocuments = vi.fn(() => {
  return {
    findMany: mockFindMany,
  };
});

// The result from a call to `strapi.getModel("api::XYZ.XYZ")`.
let stubbedGetModelResult: Schema.ContentType | undefined;
const mockGetModel = vi.fn(() => stubbedGetModelResult);

// The result from a call to `strapi.plugin('content-manager').service('content-types').findConfiguration()`.
let stubbedFindConfigurationResult: { settings?: { mainField?: string } };
const mockFindConfiguration = vi.fn(() => stubbedFindConfigurationResult);

const mockPlugin = vi.fn(() => ({
  service: vi.fn(() => ({
    findConfiguration: mockFindConfiguration,
  })),
}));

const mockStrapi = {
  documents: mockDocuments,
  getModel: mockGetModel,
  plugin: mockPlugin,
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

describe(`test method "fetchEntries()"`, () => {
  beforeEach(() => {
    stubbedHasFieldOfTypeResult = true;
    stubbedGetModelResult = createModel();
    stubbedResolveEffectiveLocaleResult = 'en';
    stubbedFindConfigurationResult = {};
    stubbedFindManyResult = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke `strapi.getModel(uid)`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
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
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await expect(
      async () =>
        await service({ strapi: mockStrapi }).fetchEntries({
          uid,
          filters,
          locale,
        })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `hasFieldOfType()` with correct parameters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(mockHasFieldOfType).toHaveBeenCalledWith(stubbedGetModelResult, 'sortOrder', 'integer');
  });

  it('should throw an error when `hasFieldOfType()` returns false.', async () => {
    // Given
    stubbedHasFieldOfTypeResult = false;

    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await expect(
      async () =>
        await service({ strapi: mockStrapi }).fetchEntries({
          uid,
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
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(mockDocuments).toHaveBeenCalledWith(uid);
  });

  it('should invoke `resolveEffectiveLocale()` with correct parameters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(mockResolveEffectiveLocale).toHaveBeenCalledWith({
      strapi: mockStrapi,
      model: stubbedGetModelResult,
      locale,
    });
  });

  it('should invoke `strapi.documents(uid).findMany()` with correct parameters.', async () => {
    // Given
    const mainField = 'foo-bar';
    stubbedFindConfigurationResult = { settings: { mainField } };

    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(mockFindMany).toHaveBeenCalledWith({
      fields: [mainField],
      sort: 'sortOrder:asc',
      filters,
      locale: stubbedResolveEffectiveLocaleResult,
    });
  });

  it('should invoke `strapi.documents(uid).findMany()` with correct parameters when main field is not configured.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(mockFindMany).toHaveBeenCalledWith({
      fields: [],
      sort: 'sortOrder:asc',
      filters,
      locale: stubbedResolveEffectiveLocaleResult,
    });
  });

  it('should return mapped entries with `documentId` and `mainField`.', async () => {
    // Given
    const mainField = 'name';
    stubbedFindConfigurationResult = { settings: { mainField } };

    stubbedFindManyResult = [
      { id: 1, documentId: 'doc-1', name: 'Alpha', sortOrder: 0 },
      { id: 2, documentId: 'doc-2', name: 'Beta', sortOrder: 1 },
    ];

    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    const result = await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(result).toEqual([
      { documentId: 'doc-1', mainField: 'Alpha' },
      { documentId: 'doc-2', mainField: 'Beta' },
    ]);
  });

  it('should return `null` for `mainField` when no mainField is configured.', async () => {
    // Given
    stubbedFindManyResult = [
      { id: 1, documentId: 'doc-1', sortOrder: 0 },
      { id: 2, documentId: 'doc-2', sortOrder: 1 },
    ];

    const uid: ContentTypeUID = 'api::test.test';
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'de';

    // When
    const result = await service({ strapi: mockStrapi }).fetchEntries({
      uid,
      filters,
      locale,
    });

    // Then
    expect(result).toEqual([
      { documentId: 'doc-1', mainField: null },
      { documentId: 'doc-2', mainField: null },
    ]);
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
