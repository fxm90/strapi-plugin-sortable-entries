import { describe, it, expect } from 'vitest';
import { isEqualSets } from './isEqualSets';

//
// Tests
//

describe(`test method "isEqualSets()"`, () => {
  it('should return `false` for sets with different sizes.', () => {
    // Given
    const lhs = new Set(['a', 'b', 'c']);
    const rhs = new Set(['a', 'b']);

    // When
    const result = isEqualSets(lhs, rhs);

    // Then
    expect(result).toBe(false);
  });

  it('should return `false` for sets with the same size but different values.', () => {
    // Given
    const lhs = new Set(['a', 'b', 'c']);
    const rhs = new Set(['a', 'b', '⚡️']);

    // When
    const result = isEqualSets(lhs, rhs);

    // Then
    expect(result).toBe(false);
  });

  it('should return `true` for two empty sets.', () => {
    // Given
    const lhs = new Set();
    const rhs = new Set();

    // When
    const result = isEqualSets(lhs, rhs);

    // Then
    expect(result).toBe(true);
  });

  it('should return `true` for sets with the same values in different insertion order.', () => {
    // Given
    const lhs = new Set(['a', 'b', 'c']);
    const rhs = new Set(['c', 'a', 'b']);

    // When
    const result = isEqualSets(lhs, rhs);

    // Then
    expect(result).toBe(true);
  });

  it('should return `true` for the same set reference.', () => {
    // Given
    const lhs = new Set(['a', 'b', 'c']);

    // When
    const result = isEqualSets(lhs, lhs);

    // Then
    expect(result).toBe(true);
  });
});
