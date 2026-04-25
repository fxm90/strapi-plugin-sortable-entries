import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import service from './service';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, DocumentIDList, Filters, Locale } from '../types';
import type { ModelI18nOptions } from './service';

//
// Mock "rawDocumentWriter"
//

let stubbedUpdateAllDocumentVersionsResult: number;
const mockUpdateAllDocumentVersions = vi.hoisted(() =>
  vi.fn(() => stubbedUpdateAllDocumentVersionsResult)
);

const mockRawDocumentWriter = vi.hoisted(() =>
  vi.fn(() => ({
    updateAllDocumentVersions: mockUpdateAllDocumentVersions,
  }))
);

vi.mock('../utils/rawDocumentWriter', () => ({
  rawDocumentWriter: mockRawDocumentWriter,
}));

//
// Mock "reorderSubsetInPlace()"
//

let stubbedReorderSubsetInPlaceResult: DocumentIDList;
const mockReorderSubsetInPlace = vi.hoisted(() =>
  // prettier-ignore
  vi.fn(() => stubbedReorderSubsetInPlaceResult)
);

vi.mock('../utils/reorderSubsetInPlace', () => ({
  reorderSubsetInPlace: mockReorderSubsetInPlace,
}));

//
// Mock "Strapi"
//

// Mock the Knex transaction: immediately invoke the callback with a mock transaction object.
const mockTrx = vi.fn();
const mockTransaction = vi.fn((callback: (trx: unknown) => Promise<unknown>) => callback(mockTrx));

const mockDB = {
  connection: {
    transaction: mockTransaction,
  },
};

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
  db: mockDB,
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

describe(`test method "updateSortOrder()"`, () => {
  beforeEach(() => {
    stubbedGetModelResult = createModelWithLocalization(false);
    stubbedFindManyResult = [
      { id: 1, documentId: 'doc-1', sortOrder: 0 },
      { id: 2, documentId: 'doc-2', sortOrder: 1 },
      { id: 3, documentId: 'doc-3', sortOrder: 2 },
      { id: 4, documentId: 'doc-4', sortOrder: 3 },
      { id: 5, documentId: 'doc-5', sortOrder: 4 },
    ];

    stubbedReorderSubsetInPlaceResult = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke `strapi.getModel(uid)`.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockGetModel).toHaveBeenCalled();
    expect(mockGetModel).toHaveBeenCalledWith(uid);
  });

  it('should throw an error when `strapi.getModel(uid)` returns undefined.', async () => {
    // Given
    stubbedGetModelResult = undefined;

    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await expect(() =>
      service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
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
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockDocuments).toHaveBeenCalled();
    expect(mockDocuments).toHaveBeenCalledWith(uid);
  });

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `strapi.documents(uid).findMany()` with correct parameters (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
      const filters: Filters = undefined;
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockFindMany).toHaveBeenCalled();
      expect(mockFindMany).toHaveBeenCalledWith({
        fields: ['sortOrder'],
        sort: 'sortOrder:asc',
        locale: isLocalized ? locale : undefined,
      });
    }
  );

  it('should not invoke `reorderSubsetInPlace()` when filter is undefined.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockReorderSubsetInPlace).not.toHaveBeenCalled();
  });

  it('should throw an error when `sortedDocumentIds` has a different length than the previously fetched document IDs and filter is undefined.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = [
      'doc-⚡️',
      'doc-5',
      'doc-4',
      'doc-3',
      'doc-2',
      'doc-1',
    ];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await expect(() =>
      service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `strapi.db.connection.transaction()` regardless of filters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('should setup `rawDocumentWriter()` with strapi and transaction regardless of filters.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockRawDocumentWriter).toHaveBeenCalled();
    expect(mockRawDocumentWriter).toHaveBeenCalledWith({ strapi: mockStrapi, trx: mockTrx });
  });

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` when filter is undefined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
      const filters: Filters = undefined;
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(4);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-5` needs to be at sort order `0`.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-5',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-4',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-3` stays at the same sort order and shouldn't be updated.
      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-3',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(3, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(4, {
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` and where previously the sort order field was falsey when filter is undefined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);
      stubbedFindManyResult = [
        { id: 1, documentId: 'doc-1', sortOrder: 0 },
        { id: 2, documentId: 'doc-2', sortOrder: 1 },
        // Simulate new entries that don't have a sort order value starting from here.
        { id: 3, documentId: 'doc-3', sortOrder: null },
        { id: 4, documentId: 'doc-4', sortOrder: undefined },
        { id: 5, documentId: 'doc-5', sortOrder: '' },
      ];

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
      const filters: Filters = undefined;
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(5);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`,
      // where the property `sortOrder` starting from `doc-3` is falsey.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-5` needs to be at sort order `0`.
      // Even though the previous value was a valid number, the entry should be updated as the position changed.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-5',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-4',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`,
      // where the property `sortOrder` starting from `doc-3` is falsey.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-3` stays at the same sort order.
      // But as the previous value was `null`, the entry still needs to be updated.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(3, {
        uid,
        documentId: 'doc-3',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(4, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(5, {
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` and where previously the sort order field was outdated when filter is undefined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);
      stubbedFindManyResult = [
        { id: 1, documentId: 'doc-1', sortOrder: 0 },
        { id: 2, documentId: 'doc-2', sortOrder: 1 },
        // Simulate some deleted entries in between,
        // therefore the sort order value is outdated starting from here.
        { id: 11, documentId: 'doc-11', sortOrder: 10 },
        { id: 12, documentId: 'doc-12', sortOrder: 11 },
        { id: 13, documentId: 'doc-13', sortOrder: 12 },
      ];

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-13', 'doc-12', 'doc-11', 'doc-2', 'doc-1'];
      const filters: Filters = undefined;
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(5);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-13`,
      // where the property `sortOrder` starting from `doc-11` is outdated.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-13` needs to be at sort order `0`.
      // Even though the previous value was a valid number, the entry should be updated as the position changed.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-13',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-12',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-13`,
      // where the property `sortOrder` starting from `doc-11` is outdated.
      // For the given `sortedDocumentIds` we reversed the order, so `doc-11` stays at the same sort order.
      // But as the previous value was outdated, the entry still needs to be updated.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(3, {
        uid,
        documentId: 'doc-11',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(4, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(5, {
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it('should invoke `reorderSubsetInPlace()` when a filter is defined.', async () => {
    // Given
    stubbedReorderSubsetInPlaceResult = ['doc-1', 'doc-4', 'doc-3', 'doc-2', 'doc-5'];

    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-4', 'doc-3', 'doc-2'];
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    expect(mockReorderSubsetInPlace).toHaveBeenCalled();

    let prevSortedDocumentIds = stubbedFindManyResult.map((entry) => entry.documentId);
    expect(mockReorderSubsetInPlace).toHaveBeenCalledWith(prevSortedDocumentIds, sortedDocumentIds);
  });

  it('should throw an error when `reorderSubsetInPlace()` returns a different length than the previously fetched document IDs and a filter is defined.', async () => {
    // Given
    stubbedReorderSubsetInPlaceResult = ['doc-⚡️', 'doc-1', 'doc-4', 'doc-3', 'doc-2', 'doc-5'];

    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-4', 'doc-3', 'doc-2'];
    const filters: Filters = { field: 'value' };
    const locale: Locale = 'en';

    // When
    await expect(() =>
      service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` returned from `reorderSubsetInPlace()` when a filter is defined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);
      stubbedReorderSubsetInPlaceResult = ['doc-1', 'doc-4', 'doc-3', 'doc-2', 'doc-5'];

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-4', 'doc-3', 'doc-2'];
      const filters: Filters = { field: 'value' };
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(2);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-4`, so `doc-1` stays at the same sort order and shouldn't be updated.
      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-4`, so `doc-4` needs to be at sort order `1`.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-4',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-3',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-5',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` returned from `reorderSubsetInPlace()` and where previously the sort order field was falsey when a filter is defined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);
      stubbedFindManyResult = [
        { id: 1, documentId: 'doc-1', sortOrder: 0 },
        { id: 2, documentId: 'doc-2', sortOrder: 1 },
        // Simulate new entries that don't have a sort order value starting from here.
        { id: 3, documentId: 'doc-3', sortOrder: null },
        { id: 4, documentId: 'doc-4', sortOrder: undefined },
        { id: 5, documentId: 'doc-5', sortOrder: '' },
      ];

      stubbedReorderSubsetInPlaceResult = ['doc-1', 'doc-4', 'doc-3', 'doc-2', 'doc-5'];

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-4', 'doc-3', 'doc-2'];
      const filters: Filters = { field: 'value' };
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(4);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`,
      // where the property `sortOrder` starting from `doc-3` is falsey.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-4`, so `doc-1` stays at the same sort order.
      // And as the previous value was a valid number, the entry should not be updated.
      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-4',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-5`,
      // where the property `sortOrder` starting from `doc-3` is falsey.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-4`, so `doc-3` stays at the same sort order.
      // But as the previous value was `null`, the entry should be updated.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-3',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(3, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(4, {
        uid,
        documentId: 'doc-5',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it.each([{ isLocalized: true }, { isLocalized: false }])(
    'should invoke `rawDocumentWriter.updateAllDocumentVersions()` for all changed `sortedDocumentIds` returned from `reorderSubsetInPlace()` and where previously the sort order field was outdated when a filter is defined (isLocalized: $isLocalized).',
    async ({ isLocalized }) => {
      // Given
      stubbedGetModelResult = createModelWithLocalization(isLocalized);
      stubbedFindManyResult = [
        { id: 1, documentId: 'doc-1', sortOrder: 0 },
        { id: 2, documentId: 'doc-2', sortOrder: 1 },
        // Simulate some deleted entries in between,
        // therefore the sort order value is outdated starting from here.
        { id: 11, documentId: 'doc-11', sortOrder: 10 },
        { id: 12, documentId: 'doc-12', sortOrder: 11 },
        { id: 13, documentId: 'doc-13', sortOrder: 12 },
      ];

      stubbedReorderSubsetInPlaceResult = ['doc-1', 'doc-12', 'doc-11', 'doc-2', 'doc-13'];

      const uid: ContentTypeUID = 'api::test.test';
      const sortedDocumentIds: DocumentIDList = ['doc-12', 'doc-11', 'doc-2'];
      const filters: Filters = { field: 'value' };
      const locale: Locale = 'en';

      // When
      await service({ strapi: mockStrapi }).updateSortOrder({
        uid,
        sortedDocumentIds,
        filters,
        locale,
      });

      // Then
      expect(mockUpdateAllDocumentVersions).toHaveBeenCalledTimes(4);

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-13`,
      // where the property `sortOrder` starting from `doc-11` is outdated.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-12`, so `doc-1` stays at the same sort order.
      // And as the previous value was a valid number, the entry should not be updated.
      expect(mockUpdateAllDocumentVersions).not.toHaveBeenCalledWith({
        uid,
        documentId: 'doc-1',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 0 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(1, {
        uid,
        documentId: 'doc-12',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 1 },
      });

      // We set-up `stubbedFindManyResult` in a way, that the document ID's are increasing from `doc-1` to `doc-13`,
      // where the property `sortOrder` starting from `doc-11` is outdated.
      // For the given `stubbedReorderSubsetInPlaceResult` we switched the position of `doc-2` and `doc-12`, so `doc-11` stays at the same sort order.
      // But as the previous value was outdated, the entry should be updated.
      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(2, {
        uid,
        documentId: 'doc-11',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 2 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(3, {
        uid,
        documentId: 'doc-2',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 3 },
      });

      expect(mockUpdateAllDocumentVersions).toHaveBeenNthCalledWith(4, {
        uid,
        documentId: 'doc-13',
        locale: isLocalized ? locale : undefined,
        data: { sortOrder: 4 },
      });
    }
  );

  it('should return result from `rawDocumentWriter.updateAllDocumentVersions()`.', async () => {
    // Given
    // This value represents the number of rows affected by the update query.
    // We defined a static result for every call to `rawDocumentWriter.updateAllDocumentVersions()` above, so we can assert the returned values in the end.
    stubbedUpdateAllDocumentVersionsResult = 2;

    const uid: ContentTypeUID = 'api::test.test';
    const sortedDocumentIds: DocumentIDList = ['doc-5', 'doc-4', 'doc-3', 'doc-2', 'doc-1'];
    const filters: Filters = undefined;
    const locale: Locale = 'en';

    // When
    const result = await service({ strapi: mockStrapi }).updateSortOrder({
      uid,
      sortedDocumentIds,
      filters,
      locale,
    });

    // Then
    // We defined a static result for every call to `rawDocumentWriter.updateAllDocumentVersions()` above.
    // As we have four entries to update (position of `doc-3` stays the same), we expect the same value four times in the resulting array.
    expect(result).toStrictEqual([2, 2, 2, 2]);
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
