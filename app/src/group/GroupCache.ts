import {API} from "../api/API";
import {AppError} from "../api/AppError";
import {Cache} from "../cache/Cache";
import {Group} from "@connect/api-client";
import {Image} from "react-native";
import {Repair} from "../cache/Repair";
import defaultBackgroundImage from "../assets/images/group-banner-background.png";

/**
 * Caches groups by their URL slug.
 */
export const GroupCache = new Cache<string, Group>({
  async load(slug) {
    const {group} = await API.group.getGroupBySlug({slug});
    if (group == null) {
      throw new AppError("Can not find this group.");
    }
    await preloadGroupBackground(group);
    return group;
  },
});

// Register the cache for repairing when requested by the user...
Repair.registerCache(GroupCache);

/**
 * Preloads the account’s avatar if one exists. Any errors while loading the
 * avatar are ignored.
 */
async function preloadGroupBackground(_group: Group): Promise<void> {
  // TODO: Actually prefetch the group background image. Currently we only fetch
  // the default background image.

  if (typeof defaultBackgroundImage === "string") {
    try {
      await Image.prefetch(defaultBackgroundImage);
    } catch (error) {
      // ignore error
    }
  }
}
