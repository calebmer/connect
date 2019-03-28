import {API} from "../api/API";
import {Cache} from "./framework/Cache";
import {Group} from "@connect/api-client";

/**
 * Caches groups by their URL slug.
 */
export const GroupCache = new Cache<string, Group>(async slug => {
  const {group} = await API.group.getBySlug({slug});
  if (group == null) throw new Error("Group not found.");
  return group;
});
