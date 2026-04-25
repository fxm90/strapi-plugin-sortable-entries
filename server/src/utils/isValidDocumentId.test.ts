import { describe, it, expect } from 'vitest';
import { isValidDocumentId } from './isValidDocumentId';

//
// Tests
//

describe(`test method "isValidDocumentId()"`, () => {
  it.each([
    { value: 123 },
    { value: null },
    { value: undefined },
    { value: {} },
    { value: [] },
    { value: true },
  ])('should return `false` if value is not a string.', ({ value }) => {
    // When
    expect(isValidDocumentId(value))
      // Then
      .toBe(false);
  });

  it('should return `false` if value is an empty string.', () => {
    // When
    expect(isValidDocumentId(''))
      // Then
      .toBe(false);
  });

  it('should return `false` if value is too short.', () => {
    // When
    expect(isValidDocumentId('a'.repeat(23)))
      // Then
      .toBe(false);
  });

  it('should return `false` if value is too long.', () => {
    // When
    expect(isValidDocumentId('a'.repeat(25)))
      // Then
      .toBe(false);
  });

  it('should return `false` if value contains uppercase letters.', () => {
    // When
    expect(isValidDocumentId('Abcdefghijklmnopqrstuvwx'))
      // Then
      .toBe(false);
  });

  it('should return `false` if value contains special characters.', () => {
    // When
    expect(isValidDocumentId('abcdefghijklmnopqrstuv_!'))
      // Then
      .toBe(false);
  });

  it('should return `true` for a valid 24-character lowercase alphanumeric string.', () => {
    // When
    expect(isValidDocumentId('abcdefghij1234567890abcd'))
      // Then
      .toBe(true);
  });

  it('should return `true` for a valid cuid2 document ID.', () => {
    // When
    expect(isValidDocumentId('cm3x9kz7a0000q5f2g1h3j4k'))
      // Then
      .toBe(true);
  });
});
