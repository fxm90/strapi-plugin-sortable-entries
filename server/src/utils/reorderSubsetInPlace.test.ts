import { expect, describe, it } from 'vitest';
import { reorderSubsetInPlace } from './reorderSubsetInPlace';

//
// Tests
//

describe(`test method "reorderSubsetInPlace()"`, () => {
  it('should handle an empty `array` parameter.', () => {
    // Given
    const array = [];
    const newSubsetOrder = [];

    // When
    const result = reorderSubsetInPlace(array, newSubsetOrder);

    // Then
    expect(result).toStrictEqual([]);
  });

  it('should handle an empty `newSubsetOrder` parameter.', () => {
    // Given
    const array = ['a', 'b', 'c', 'd', 'e', 'f'];
    const newSubsetOrder = [];

    // When
    const result = reorderSubsetInPlace(array, newSubsetOrder);

    // Then
    expect(result).toStrictEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('should throw an error due to the `newSubsetOrder` parameter containing an invalid element.', () => {
    // Given
    const array = ['a', 'b', 'c', 'd', 'e', 'f'];
    const newSubsetOrder = ['a', 'b', 'g'];

    // When
    expect(() => reorderSubsetInPlace(array, newSubsetOrder))
      // Then
      .toThrowError();
  });

  it('should not reorder elements due to a single item in the `newSubsetOrder` parameter.', () => {
    // Given
    const array = ['a', 'b', 'c', 'd', 'e', 'f'];
    const newSubsetOrder = ['c'];

    // When
    const result = reorderSubsetInPlace(array, newSubsetOrder);

    // Then
    expect(result).toStrictEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('should reorder elements according to the `newSubsetOrder` parameter.', () => {
    // Given
    const array = ['a', 'b', 'c', 'd', 'e', 'f'];
    const newSubsetOrder = ['e', 'a', 'c'];

    // When
    const result = reorderSubsetInPlace(array, newSubsetOrder);

    // Then
    expect(result).toStrictEqual(['e', 'b', 'a', 'd', 'c', 'f']);
  });
});
