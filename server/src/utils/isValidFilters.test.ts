import { describe, expect, it } from 'vitest';
import { isValidFilters } from './isValidFilters';

//
// Tests
//

describe('test method "isValidFilters()"', () => {
  it('should return `true` when value is undefined.', () => {
    // When
    expect(isValidFilters(undefined))
      // Then
      .toBe(true);
  });

  it('should return `true` when value is a plain object.', () => {
    // When
    expect(isValidFilters({ name: { $eq: 'foo' } }))
      // Then
      .toBe(true);
  });

  it('should return `true` when value is an empty object.', () => {
    // When
    expect(isValidFilters({}))
      // Then
      .toBe(true);
  });

  it.each([{ value: null }, { value: [] }, { value: 'string' }, { value: 123 }, { value: true }])(
    'should return `false` when value is not an object.',
    ({ value }) => {
      // When
      expect(isValidFilters(value))
        // Then
        .toBe(false);
    }
  );
});
