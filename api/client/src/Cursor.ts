import {JSONValue} from "./JSONValue";

declare function btoa(b: string): string;
declare function atob(a: string): string;

/**
 * A cursor represents some opaque base64 and JSON encoded structure for
 * representing a position in a list for pagination.
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
    return btoa(JSON.stringify(value)) as Cursor<Value>;
  },

  /**
   * Decodes a value from a `Cursor`.
   */
  decode<Value extends JSONValue>(cursor: Cursor<Value>): Value {
    return JSON.parse(atob(cursor));
  },
};
