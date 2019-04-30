import React, {useContext} from "react";
import {PostContent} from "./PostContent";
import {Trough} from "../molecules/Trough";
import {PostID} from "@connect/api-client";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {Route} from "../router/Route";
import {GroupCache} from "../group/GroupCache";
import {PostCache} from "./PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {useCache} from "../cache/Cache";
import {CommentShimmer} from "../comment/CommentShimmer";

export function PostVirtualized({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  // Preload all our post data so that they load in the background while we
  // render our component.
  GroupCache.preload(groupSlug);
  PostCache.preload(postID);
  PostCommentsCache.preload(postID);

  // Load the data we will need for this component.
  const {post} = useCache(PostCache, postID);
  const group = useCache(GroupCache, groupSlug);

  console.log(post);

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <NavbarScrollView route={route} title={group.name} hideNavbar={hideNavbar}>
      <PostContent postID={postID} />
      <Trough title="Comments" />
      {repeat(post.commentCount, index => (
        <CommentShimmer key={`shimmer:${index}`} index={index} />
      ))}
    </NavbarScrollView>
  );
}

function repeat<Value>(
  count: number,
  next: (index: number) => Value,
): Iterable<Value> {
  return {
    [Symbol.iterator]() {
      let currentCount = 0;
      return {
        next() {
          if (currentCount < count) {
            return {
              done: false,
              value: next(currentCount++),
            };
          } else {
            return {
              done: true,
              value: undefined as any,
            };
          }
        },
      };
    },
  };
}
