import {API} from "../api/API";
import {Cache} from "./Cache";
import {Group} from "@connect/api-client";

/**
 * Caches groups by their URL slug.
 */
export const GroupCache = new Cache<string, Group>(async slug => {
  const {group} = await API.group.getBySlug({slug});
  return group;
});
