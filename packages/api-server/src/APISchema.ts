/**
 * Reflects on `@connect/api-client` to produce the schema for our server.
 */

import * as APIClient from "@connect/api-client";
import {MutationOperationData} from "@connect/api-client";

/**
 * Convenient alias for `typeof APIClient`.
 */
export type APIClientType = typeof APIClient;

/**
 * A key in the API client schema which is all of the keys in `APIClientType`
 * which have a `schema` property. `APIClient` exports some other utility
 * functions but we don’t care about those.
 */
export type APISchemaKey = APISchemaKeyGet<keyof APIClientType>;

/**
 * Private helper for `APISchemaKey`. We need `keyof APIClientType` to
 * distribute as a string union which is why we use a type alias with a
 * type parameter.
 */
type APISchemaKeyGet<
  Key extends keyof APIClientType
> = Key extends (APIClientType[Key] extends {schema: unknown} ? unknown : never)
  ? Key
  : never;

/**
 * The input type for one of our API schema keys.
 */
export type APIInput<Key extends APISchemaKey> = MutationOperationData<
  APIClientType[Key]["schema"]["input"]
>;

/**
 * The output type for one of our API schema keys.
 */
export type APIOutput<Key extends APISchemaKey> = MutationOperationData<
  APIClientType[Key]["schema"]["output"]
>;

/**
 * All of the keys in our API schema.
 */
export const APISchemaKeys = Object.keys(APIClient).filter(
  key => (APIClient as any)[key].schema !== undefined,
) as ReadonlyArray<APISchemaKey>;
