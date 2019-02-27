import {MutationSchema, MutationOperationData} from "@connect/api-client";
import {APIClientType, APISchemaKey} from "./APISchema";
import * as Account from "./operations/Account";
import {Database} from "./Database";

/**
 * Defines our API with functions that implement our API client’s schema.
 */
export const APIDefinition: APIDefinition = {
  signUp: Account.signUp,
  signIn: Account.signIn,
  signOut: Account.signOut,
};

/**
 * The definition of our entire API. We re-construct the schema to produce the
 * definition based on all of the operations exposed by our API client.
 */
export type APIDefinition = {
  [Key in APISchemaKey]: MutationDefinition<APIClientType[Key]["schema"]>
};

/**
 * The definition of a mutation based on its schema.
 */
export type MutationDefinition<Schema extends MutationSchema> = (
  database: Database,
  input: MutationOperationData<Schema["input"]>,
) => Promise<MutationOperationData<Schema["output"]>>;
