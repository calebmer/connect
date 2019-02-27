export type JSONValue =
  | null
  | undefined
  | boolean
  | number
  | string
  | JSONArrayValue
  | JSONObjectValue;

export interface JSONArrayValue extends ReadonlyArray<JSONValue> {}

export type JSONObjectValue = {readonly [key: string]: JSONValue};
