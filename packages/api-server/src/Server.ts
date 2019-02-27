import * as http from "http";
import * as APIClient from "@connect/api-client";

// http.createServer

// /**
//  * The schema of our entire API. We re-construct the schema based on all of the
//  * operations exposed by our API client.
//  */
// type APISchema = {
//   [Key in keyof typeof APIClient]: (typeof APIClient)[Key]["schema"]
// };

let paths = new Map();

Object.keys(APIClient).forEach(_key => {
  let key = _key as keyof typeof APIClient;
  APIClient[key].schema.path;
});

console.log(typeof APIClient);
