import { describe, expect, it } from 'vitest';
import { isValidLocale } from './isValidLocale';

//
// Tests
//

describe('test method "isValidLocale()"', () => {
  it('should return `true` when value is undefined.', () => {
    // When
    expect(isValidLocale(undefined))
      // Then
      .toBe(true);
  });

  it.each([{ value: 'en' }, { value: 'de-DE' }, { value: 'zh-Hans' }])(
    'should return `true` for valid locale formats.',
    ({ value }) => {
      // When
      expect(isValidLocale(value))
        // Then
        .toBe(true);
    }
  );

  it('should return `false` when value is an empty string.', () => {
    // When
    expect(isValidLocale(''))
      // Then
      .toBe(false);
  });

  it('should return `false` when value is an incorrectly formatted locale.', () => {
    // When
    expect(isValidLocale('en_US'))
      // Then
      .toBe(false);
  });

  it('should return `false` when value contains invalid characters.', () => {
    // When
    expect(isValidLocale('en-US!'))
      // Then
      .toBe(false);
  });

  it('should return `false` when value has too many subtags.', () => {
    // When
    expect(isValidLocale('en-a-b-c-d-e'))
      // Then
      .toBe(false);
  });

  it.each([
    { value: ['en', 'de'] },
    { value: 123 },
    { value: null },
    { value: { locale: 'en' } },
    { value: true },
  ])('should return `false` when value is not a string.', ({ value }) => {
    // When
    expect(isValidLocale(value))
      // Then
      .toBe(false);
  });
});
