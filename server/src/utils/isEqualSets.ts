/**
 * Returns `true` when both sets contain exactly the same values, regardless of insertion order.
 *
 * - Note: Set equality is based on membership, not reference identity.
 *         Two distinct `Set` instances are therefore considered equal when they contain the same values.
 *
 * @param lhs - The left-hand set to compare.
 * @param rhs - The right-hand set to compare.
 *
 * @returns `true` if both sets contain the same values, otherwise `false`.
 *
 * @example
 * isEqualSets(new Set(['a', 'b']), new Set(['b', 'a'])) // true
 * isEqualSets(new Set(['a', 'b']), new Set(['a', 'c'])) // false
 */
export const isEqualSets = <T>(lhs: Set<T>, rhs: Set<T>): boolean => {
  if (lhs === rhs) {
    return true;
  }

  if (lhs.size !== rhs.size) {
    return false;
  }

  for (const value of lhs) {
    if (!rhs.has(value)) {
      return false;
    }
  }

  return true;
};
