import React, {useContext} from "react";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {useCacheData} from "../cache/Cache";

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
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  function useTitle() {
    const group = useCacheData(GroupCache, groupSlug);
    return group.name;
  }

  return (
    <>
      <NavbarScrollView
        route={route}
        useTitle={useTitle}
        hideNavbar={hideNavbar}
        keyboardDismissMode="interactive"
      >
        <PostContent postID={postID} />
        <Trough title="Comments" />
        <PostComments postID={postID} />
      </NavbarScrollView>
      <CommentNewToolbar />
    </>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};
