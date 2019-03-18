import * as base64 from "base-64";
import {JSONValue} from "./JSONValue";

/**
 * The direction in which our range will select items.
 */
export enum RangeDirection {
  /** Select the first items in our range. */
  First = "first",
  /** Select the last items in our range. */
  Last = "last",
}

/**
 * A range specifies which subset of items we want to select from a list. We use
 * cursor-based pagination so our range is the description of a page in a
 * cursor-based system.
 */
export type Range<ItemCursor extends Cursor<JSONValue>> = {
  /**
   * The direction describes how we will select items in our range. `after` and
   * `before` describe our bounds. `direction` tells us if we should select the
   * _first_ `count` number of items or the _last_ `count` number of items.
   */
  readonly direction: RangeDirection;

  /**
   * The number of items to select. A `count` is always required to make sure we
   * don’t select the entire list of items.
   */
  readonly count: number;

  /**
   * The non-inclusive upper bound of our range. We will select all the items
   * which come _after_ the position represented by this cursor.
   */
  readonly after: ItemCursor | null;

  /**
   * The non-inclusive lower bound of our range. We will select all the items
   * which come _before_ the position represented by this cursor.
   */
  readonly before: ItemCursor | null;
};

/**
 * A cursor represents some opaque base64 and JSON encoded structure for
 * representing a position in a list for pagination.
 *
 * We encode cursors to avoid revealing implementation details.
 */
export type Cursor<Value extends JSONValue> = string & {
  readonly _type: typeof CursorType;

  /**
   * **IMPORTANT:** This value does not actually exist at runtime! It is a only
   * serves as a tag in TypeScript to make sure two cursors with different
   * types don’t conflict.
   */
  readonly _value: Value;
};

declare const CursorType: unique symbol;

export const Cursor = {
  /**
   * Encodes a value as a `Cursor`.
   */
  encode<Value extends JSONValue>(value: Value): Cursor<Value> {
    return base64.encode(JSON.stringify(value)) as Cursor<Value>;
  },

  /**
   * Decodes a value from a `Cursor`.
   */
  decode<Value extends JSONValue>(cursor: Cursor<Value>): Value {
    return JSON.parse(base64.decode(cursor));
  },
};
