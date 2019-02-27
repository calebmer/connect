import * as http from "http";
import * as APIClient from "@connect/api-client";
import { MutationSchema, MutationOperationData } from "@connect/api-client";

/**
 * Defines our API with functions that implement our API client’s schema.
 */
const apiDefinition: APIDefinition = {};

/**
 * The definition of our entire API. We re-construct the schema to produce the
 * definition based on all of the operations exposed by our API client.
 */
type APIDefinition = {
  [Key in keyof typeof APIClient]: MutationDefinition<
    (typeof APIClient)[Key]["schema"]
  >
};

/**
 * The definition of a mutation based on its schema.
 */
type MutationDefinition<Schema extends MutationSchema> = (
  input: MutationOperationData<Schema["input"]>,
) => Promise<MutationOperationData<Schema["output"]>>;

/**
 * A map of paths to the operation definition for that path. Used by our HTTP
 * server to quickly select the appropriate executor for each path.
 */
const paths = new Map<string, MutationDefinition<any>>();

// Populate the `paths` map by looking at our schemas in `APIClient` and
// matching them with definitions from `apiDefinition`.
for (const _key of Object.keys(APIClient)) {
  const key = _key as keyof typeof APIClient;
  const schema = APIClient[key].schema;
  if (paths.has(schema.path)) {
    throw new Error(`Found multiple schemas for path "${schema.path}".`);
  } else {
    paths.set(schema.path, apiDefinition[key]);
  }
}

export const Server = http.createServer((req, res) => {});
