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
): ReadonlyArray<PostID> {
  // Keep track of all the new posts we’ve seen while this component is mounted.
  const [state, setState] = useState(() => ({
    newPosts: new Set<PostID>(),
    newPostsBefore: new Map<PostID | null, ReadonlyArray<PostID>>(),
  }));

  useEffect(() => {
    // Listen to all new post publish events.
    return PostPublishEmitter.listen(newPost => {
      // If this post is not in our group then ignore it.
      if (newPost.groupID !== groupID) {
        return;
      }

      setState(prevState => {
        // Add this post to our `newPosts` set.
        const newPosts = new Set(prevState.newPosts);
        newPosts.add(newPost.id);

        // We want this post to appear above the post which is currently first
        // in the list.
        const newPostsBefore = new Map(prevState.newPostsBefore);
        const before = posts.length > 0 ? posts[0].id : null;
        const otherPosts = newPostsBefore.get(before);
        if (otherPosts) {
          newPostsBefore.set(before, [newPost.id, ...otherPosts]);
        } else {
          newPostsBefore.set(before, [newPost.id]);
        }

        return {newPosts, newPostsBefore};
      });
    });
  }, [groupID, posts]);

  // Whenever either the post array changes or our state changes, let’s
  // recompute the posts we want to render...
  return useMemo(() => {
    const postIDs = [];

    // Look at all of our posts. If there are some new posts we want to render
    // above the current one, then go ahead and do that.
    for (let i = 0; i < posts.length; i++) {
      const postID = posts[i].id;
      const newPostsBefore = state.newPostsBefore.get(postID);
      if (newPostsBefore) {
        for (let k = 0; k < newPostsBefore.length; k++) {
          postIDs.push(newPostsBefore[k]);
        }
      }
      postIDs.push(postID);
    }

    // If there are any posts we want to render at the end of the list then
    // go ahead and add them now.
    const newPostsBefore = state.newPostsBefore.get(null);
    if (newPostsBefore) {
      for (let k = 0; k < newPostsBefore.length; k++) {
        postIDs.push(newPostsBefore[k]);
      }
    }

    return postIDs;
  }, [posts, state]);
}
