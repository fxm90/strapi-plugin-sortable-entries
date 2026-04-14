import type { Schema } from '@strapi/strapi';

/**
 * Checks if a content type model has a field of the specified type.
 *
 * @param contentType - The content type model to check.
 * @param fieldName - The name of the field to check.
 * @param expectedType - The expected type of the field.
 *
 * @returns `true` if the field exists and matches the expected type, `false` otherwise.
 */
export const hasFieldOfType = (
  contentType: Schema.ContentType,
  fieldName: string,
  expectedType: string
): boolean => {
  const attribute = contentType.attributes[fieldName];
  return attribute?.type === expectedType;
};
