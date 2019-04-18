import {GroupID, PostID} from "@connect/api-client";
import {PostCacheListEntry, PostPublishEmitter} from "./cache/PostCache";
import {useEffect, useMemo, useState} from "react";

/**
 * Takes a list of posts from our `PostCacheList` and adds to it all the new
 * posts being published using `PostPublishEmitter`.
 *
 * NOTE: This may not be the best approach...but it works for now!
 */
export function useNewPosts(
  groupID: GroupID,
  posts: ReadonlyArray<PostCacheListEntry>,
): ReadonlyArray<PostCacheListEntry> {
  // Keep track of all the new posts we’ve seen while this component is mounted.
  const [state, setState] = useState(() => ({
    newPostIDs: new Set<PostID>(),
    newPosts: [] as ReadonlyArray<PostCacheListEntry>,
  }));

  useEffect(() => {
    // Listen to all post publish events.
    return PostPublishEmitter.listen(newPost => {
      // If this post is not in our group then ignore it.
      if (newPost.groupID === groupID) {
        setState(prevState => ({
          newPostIDs: new Set(prevState.newPostIDs).add(newPost.id),
          newPosts: [
            {id: newPost.id, publishedAt: newPost.publishedAt},
            ...prevState.newPosts,
          ],
        }));
      }
    });
  }, [groupID]);

  // Whenever either the post array changes or our state changes, let’s
  // recompute the posts we want to render...
  return useMemo(() => {
    const {newPostIDs, newPosts} = state;

    // The final array of posts after we mix in all our new posts.
    const finalPosts: Array<PostCacheListEntry> = [];

    let i = 0; // Index for `posts`.
    let k = 0; // Index for `newPosts`.

    // For every post...
    for (; i < posts.length; i++) {
      const post = posts[i];

      // If there is a new post with the same ID then skip this post. We’ll add
      // the new post later. That way we don’t end up moving the new post which
      // could be jarring for the user.
      if (newPostIDs.has(post.id)) {
        continue;
      }

      // Add all the new posts which were published _after_ the current post.
      for (; k < newPosts.length; k++) {
        const newPost = newPosts[k];
        if (newPost.publishedAt >= post.publishedAt) {
          finalPosts.push(newPost);
        } else {
          break;
        }
      }

      // Push this post.
      finalPosts.push(post);
    }

    // Push all of our remaining new posts...
    for (; k < newPosts.length; k++) {
      finalPosts.push(newPosts[k]);
    }

    return finalPosts;
  }, [posts, state]);
}
