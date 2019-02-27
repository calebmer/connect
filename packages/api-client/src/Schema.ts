import {JSONValue, JSONObjectValue} from "./JSONValue";
import {SchemaInput, SchemaInputValue} from "./SchemaInput";

export const Schema = {
  namespace<Schemas extends SchemaNamespaceObject>(
    schemas: Schemas,
  ): SchemaNamespace<Schemas> {
    return {kind: "NAMESPACE", schemas};
  },

  method<Inputs extends {readonly [key: string]: SchemaInput<JSONValue>}>(
    inputs: Inputs,
  ): SchemaMethod<{[Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>}> {
    const input = SchemaInput.object(inputs);
    return {kind: "METHOD", input};
  },
};

export type Schema =
  | SchemaNamespace<SchemaNamespaceObject>
  | SchemaMethod<JSONObjectValue>;

export type SchemaNamespace<Schemas extends SchemaNamespaceObject> = {
  readonly kind: "NAMESPACE";
  readonly schemas: Schemas;
};

export type SchemaNamespaceObject = {readonly [key: string]: Schema};

export type SchemaMethod<MethodInputValue extends JSONObjectValue> = {
  readonly kind: "METHOD";
  readonly input: SchemaInput<MethodInputValue>;
};
