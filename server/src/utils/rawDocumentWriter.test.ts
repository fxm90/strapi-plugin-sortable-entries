import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rawDocumentWriter } from './rawDocumentWriter';

//
// Types
//

import type { Core } from '@strapi/strapi';
import type { ContentTypeUID, DocumentID, Locale } from '../types';

//
// Mock "Knex query builder"
//

const mockKnexQueryBuilder = {
  update: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  whereNull: vi.fn().mockReturnThis(),
};

//
// Mock "Knex transaction"
//

const mockTrx = vi
  .fn()
  .mockReturnValue(mockKnexQueryBuilder) as unknown as Core.Strapi['db']['connection'];

//
// Mock "Strapi"
//

const mockDB = {
  connection: vi.fn().mockReturnValue(mockKnexQueryBuilder),
};

// The result from a call to `strapi.getModel("api::XYZ.XYZ")`.
let stubbedGetModelResult: { collectionName?: string } | undefined;
const mockGetModel = vi.fn(() => stubbedGetModelResult);

const mockStrapi = {
  db: mockDB,
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

describe(`test method "updateAllDocumentVersions()"`, () => {
  beforeEach(() => {
    stubbedGetModelResult = { collectionName: 'test' };
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if the content type has no collection name.', async () => {
    // Given
    stubbedGetModelResult = undefined;

    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await expect(
      documentWriter.updateAllDocumentVersions({
        uid,
        documentId,
        data,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it('should throw an error if the content type has empty collection name.', async () => {
    // Given
    stubbedGetModelResult = { collectionName: '' };

    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await expect(
      documentWriter.updateAllDocumentVersions({
        uid,
        documentId,
        data,
        locale,
      })
    )
      // Then
      .rejects.toThrow();
  });

  it('should invoke `strapi.db.connection` with the collection name from the model.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await documentWriter.updateAllDocumentVersions({
      uid,
      documentId,
      data,
      locale,
    });

    // Then
    expect(mockDB.connection).toHaveBeenCalledWith(stubbedGetModelResult!.collectionName);
    expect(mockTrx).not.toHaveBeenCalled();
  });

  it('should use `trx` instead of `strapi.db.connection` when a transaction is provided.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi, trx: mockTrx });
    await documentWriter.updateAllDocumentVersions({ uid, documentId, data, locale });

    // Then
    expect(mockTrx).toHaveBeenCalledWith(stubbedGetModelResult!.collectionName);
    expect(mockDB.connection).not.toHaveBeenCalled();
  });

  it('should invoke `update()` with keys converted from camelCase to snake_case.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await documentWriter.updateAllDocumentVersions({
      uid,
      documentId,
      data,
      locale,
    });

    // Then
    expect(mockKnexQueryBuilder.update).toHaveBeenCalledWith({ sort_order: 1 });
  });

  it('should invoke `where()` with the correct document ID.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await documentWriter.updateAllDocumentVersions({
      uid,
      documentId,
      data,
      locale,
    });

    // Then
    expect(mockKnexQueryBuilder.where).toHaveBeenCalledWith({ document_id: documentId });
  });

  it('should invoke `queryBuilder.where()` with the correct locale when having a locale applied.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = 'en';

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await documentWriter.updateAllDocumentVersions({
      uid,
      documentId,
      data,
      locale,
    });

    // Then
    expect(mockKnexQueryBuilder.where).toHaveBeenCalledWith({ locale: 'en' });
    expect(mockKnexQueryBuilder.whereNull).not.toHaveBeenCalled();
  });

  it('should invoke `queryBuilder.whereNull()` with the correct column when having no locale applied.', async () => {
    // Given
    const uid: ContentTypeUID = 'api::test.test';
    const documentId: DocumentID = 'doc-1';
    const data = { sortOrder: 1 };
    const locale: Locale | undefined = undefined;

    // When
    const documentWriter = rawDocumentWriter({ strapi: mockStrapi });
    await documentWriter.updateAllDocumentVersions({
      uid,
      documentId,
      data,
      locale,
    });

    // Then
    expect(mockKnexQueryBuilder.whereNull).toHaveBeenCalledWith('locale');
    expect(mockKnexQueryBuilder.whereNull).toHaveBeenCalledTimes(1);
  });
});
