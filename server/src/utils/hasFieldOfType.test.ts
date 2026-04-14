import { describe, it, expect } from 'vitest';
import { hasFieldOfType } from './hasFieldOfType';

//
// Types
//

import type { Schema } from '@strapi/strapi';

//
// Tests
//

describe(`test method "hasFieldOfType()"`, () => {
  it('should return `false` if field name does not exist.', async () => {
    // Given
    const contentType = createContentTypeModel({});
    const fieldName = 'fooBar';
    const expectedType = 'string';

    // When
    const result = hasFieldOfType(contentType, fieldName, expectedType);

    // Then
    expect(result).toBe(false);
  });

  it('should return `false` if field name does not have expected type.', async () => {
    // Given
    const contentType = createContentTypeModel({
      fooBar: { type: 'integer' },
    });

    const fieldName = 'fooBar';
    const expectedType = 'string';

    // When
    const result = hasFieldOfType(contentType, fieldName, expectedType);

    // Then
    expect(result).toBe(false);
  });

  it('should return `true` if field name has expected type.', async () => {
    // Given
    const contentType = createContentTypeModel({
      fooBar: { type: 'string' },
    });

    const fieldName = 'fooBar';
    const expectedType = 'string';

    // When
    const result = hasFieldOfType(contentType, fieldName, expectedType);

    // Then
    expect(result).toBe(true);
  });
});

//
// Helper
//

const createContentTypeModel = (attributes: Schema.Attributes): Schema.ContentType => ({
  modelType: 'contentType',
  modelName: 'test',
  globalId: 'Test',
  uid: 'api::test.test',
  kind: 'collectionType',
  info: { singularName: 'test', pluralName: 'tests', displayName: 'Test' },
  options: {},
  attributes,
  pluginOptions: {},
});
