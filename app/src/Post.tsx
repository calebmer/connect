import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import React, {useContext} from "react";
import {GroupCache} from "./cache/GroupCache";
import {NavbarScrollView} from "./NavbarScrollView";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
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
  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Laptop;

  function useTitle() {
    const group = useCacheData(GroupCache, groupSlug);
    return group.name;
  }

  return (
    <NavbarScrollView route={route} useTitle={useTitle} hideNavbar={hideNavbar}>
      <PostContent postID={postID} />
      <Trough title="Comments" />
      <PostComments postID={postID} />
    </NavbarScrollView>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};
