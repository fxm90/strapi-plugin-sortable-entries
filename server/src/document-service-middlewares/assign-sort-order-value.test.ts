import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentAction } from '../constants';
import { assignSortOrderValueMiddlewareCallback } from './assign-sort-order-value';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { AnyDocument, ContentTypeUID, Locale } from '../types';

//
// Mock "Strapi"
//

// The result from a call to `strapi.service('plugin::sortable-entries.service').fetchLastEntry()`.
let stubbedFetchLastEntryResult: AnyDocument | undefined;
const mockFetchLastEntry = vi.fn(() => stubbedFetchLastEntryResult);

const mockService = vi.fn(() => {
  return {
    fetchLastEntry: mockFetchLastEntry,
  };
});

const mockStrapi = {
  service: mockService,
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
} as unknown as Core.Strapi;

vi.stubGlobal('strapi', mockStrapi);

//
// Tests
//
// - Note: These tests assume a configuration where `sortOrderField` is set to `sortOrder`.
//         If you are using a different field name, you need to adjust the tests accordingly.
//

describe('test `assignSortOrderValueMiddlewareCallback()` with "create" action.', () => {
  beforeEach(() => {
    stubbedFetchLastEntryResult = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke and return `next()` instead of `fetchLastEntry()` for a missing sort order field.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        // sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const result = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(next).toBeCalled();
    expect(result).toBe(stubbedNextResult);

    expect(mockFetchLastEntry).not.toBeCalled();
  });

  it('should invoke and return `next()` instead of `fetchLastEntry()` for a valid sort order field of first index.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: 0,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const result = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(next).toBeCalled();
    expect(result).toBe(stubbedNextResult);

    expect(mockFetchLastEntry).not.toBeCalled();
  });

  it('should invoke and return `next()` instead of `fetchLastEntry()` for a valid sort order field of second index.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: 1,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const result = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(next).toBeCalled();
    expect(result).toBe(stubbedNextResult);

    expect(mockFetchLastEntry).not.toBeCalled();
  });

  it('should invoke `fetchLastEntry()` for a sort order field of `null`.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const _ = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(mockFetchLastEntry).toBeCalled();
    expect(mockFetchLastEntry).toBeCalledWith({ uid: context.uid, locale });
  });

  it('should should set `context.params.data.sortOrder` to zero when `fetchLastEntry()` returns `undefined`.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const _ = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(context.params.data.sortOrder).toBe(0);
  });

  it('should should set `context.params.data.sortOrder` to zero when `fetchLastEntry()` returns an entry with `null` as the sort order value.', async () => {
    // Given
    stubbedFetchLastEntryResult = { id: 2, documentId: 'doc-2', sortOrder: null };

    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const _ = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(context.params.data.sortOrder).toBe(0);
  });

  it('should should set `context.params.data.sortOrder` to last entries sort order plus one when `fetchLastEntry()` returns an entry with a valid sort order value.', async () => {
    // Given
    stubbedFetchLastEntryResult = { id: 2, documentId: 'doc-2', sortOrder: 1 };

    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const _ = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    const expectedSortOrder = stubbedFetchLastEntryResult.sortOrder + 1;
    expect(context.params.data.sortOrder).toBe(expectedSortOrder);
  });

  it('should invoke and return `next()` for a sort order field of `null`.', async () => {
    // Given
    const action = DocumentAction.Create;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const result = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(next).toBeCalled();
    expect(result).toBe(stubbedNextResult);
  });
});

describe('test `assignSortOrderValueMiddlewareCallback()` with "delete" action.', () => {
  beforeEach(() => {
    stubbedFetchLastEntryResult = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should invoke and return `next()` instead of `fetchLastEntry()`.', async () => {
    // Given
    const action = DocumentAction.Delete;
    const uid: ContentTypeUID = 'api::test.test';
    const locale: Locale = 'en';
    const params = {
      data: {
        locale,
        sortOrder: null,
      },
    };

    const context = { uid, action, params };

    const stubbedNextResult = {};
    const next = vi.fn(() => stubbedNextResult);

    // When
    // @ts-expect-error: Our test setup provides only the minimal properties needed, not an entire context object.
    const result = await assignSortOrderValueMiddlewareCallback(context, next);

    // Then
    expect(next).toBeCalled();
    expect(result).toBe(stubbedNextResult);

    expect(mockFetchLastEntry).not.toBeCalled();
  });
});
