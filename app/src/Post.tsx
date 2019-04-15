import {GroupCache} from "./cache/GroupCache";
import {NavbarMobileScrollView} from "./NavbarMobileScrollView";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import React from "react";
import {Route} from "./router/Route";
import {Trough} from "./Trough";
import {useCacheData} from "./cache/framework/Cache";

function Post({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  function useTitle() {
    const group = useCacheData(GroupCache, groupSlug);
    return group.name;
  }

  return (
    <NavbarMobileScrollView route={route} useTitle={useTitle}>
      <PostContent postID={postID} />
      <Trough title="Comments" />
      <PostComments postID={postID} />
    </NavbarMobileScrollView>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

/**
 * Component we use for a post’s route. It takes `postID` as a string instead of
 * an integer. We convert it to a `PostID` in this component and pass
 * it to `<Post>`.
 */
export function PostRoute({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: string;
}) {
  return (
    <Post
      route={route}
      groupSlug={groupSlug}
      postID={parseInt(postID, 10) as PostID}
    />
  );
}
