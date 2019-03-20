import {Post, PostID} from "@connect/api-client";
import {API} from "../api/API";
import {Cache} from "./framework/Cache";

/**
 * Caches posts by their ID.
 */
export const PostCache = new Cache<PostID, Post>(async id => {
  const {post} = await API.post.get({id});
  if (post == null) throw new Error("Post not found.");
  return post;
});
