/**
 * Asserts that a code path is unreachable at compile time.
 * If this function is called at runtime, it throws an error.
 */
const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${String(value)}`);
};

export { assertNever };
