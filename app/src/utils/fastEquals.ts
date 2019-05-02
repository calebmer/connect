/**
 * Utility for _quickly_ checking the equality of one value with another
 * arbitrary value.
 */
export interface FastEquals {
  /**
   * Quickly checks the equality of one value with another arbitrary value.
   */
  fastEquals(other: unknown): boolean;
}

/**
 * Check the equality of two values quickly. If either value implements
 * `FastEquals` then we will use that interface for checking equality.
 */
export function fastEquals(a: unknown, b: unknown): boolean {
  return (
    a === b ||
    (implementsFastEquals(a) && a.fastEquals(b)) ||
    (implementsFastEquals(b) && b.fastEquals(a))
  );
}

/**
 * Does this value implement the `FastEquals` interface?
 */
function implementsFastEquals(value: unknown): value is FastEquals {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as any).fastEquals === "function"
  );
}
