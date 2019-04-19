import {
  Dimensions,
  InteractionManager,
  Platform,
  SafeAreaView,
  View,
} from "react-native";
import {
  GroupHomeLayout,
  GroupHomeLayoutContext,
} from "../group/GroupHomeLayout";
import React, {useContext, useEffect, useRef, useState} from "react";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {useCacheData} from "../cache/Cache";
import {useKeyboardHeight} from "../utils/useKeyboardHeight";

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

  // State which keeps track of the “unsafe space” at the bottom of the screen
  // of an iPhone X.
  const [bottomSpace, setBottomSpace] = useState(0);

  // Either add padding to the bottom for the new comment toolbar when the
  // keyboard is down or add padding to the bottom to fill the keyboard space
  // when the keyboard is up.
  //
  // HACK: The keyboard’s height, on an iPhone X, will include the “bottom
  // space”. However, our scroll view’s content insets are automatically
  // adjusted to include the bottom space as well. So the keyboard height + our
  // scroll view insets would mean we count the bottom space twice. So through
  // hacks we get the bottom space height and subtract it from the keyboard
  // height when deciding how much padding to add for the keyboard.
  const paddingBottom = Math.max(
    CommentNewToolbar.minHeight,
    useKeyboardHeight() - bottomSpace,
  );

  return (
    <>
      <NavbarScrollView
        route={route}
        useTitle={useTitle}
        hideNavbar={hideNavbar}
        contentContainerStyle={{paddingBottom}}
        scrollIndicatorInsets={{bottom: paddingBottom}}
        keyboardDismissMode="interactive"
      >
        <PostContent postID={postID} />
        <Trough title="Comments" />
        <PostComments postID={postID} />
      </NavbarScrollView>
      <CommentNewToolbar />
      {Platform.OS === "ios" && (
        <MeasureBottomSpace onBottomSpace={setBottomSpace} />
      )}
    </>
  );
}

/**
 * Really hacky way to measure the bottom space on an iPhone X. We create a
 * `<SafeAreaView>` and put a view with a fixed height inside of it. Then, we
 * wait for native to add the safe area insets with
 * `InteractionManager.runAfterInteractions()` and finally we measure where
 * our `<SafeAreaView>` put our actual view.
 */
function MeasureBottomSpace({
  onBottomSpace,
}: {
  onBottomSpace: (bottomSpace: number) => void;
}) {
  const size = 16;

  const ref = useRef<SafeAreaView>(null);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      if (ref.current) {
        ref.current.measureInWindow((_x, y) => {
          onBottomSpace(Dimensions.get("window").height - y - size);
        });
      }
    });

    return () => {
      task.cancel();
    };
  });

  return (
    <SafeAreaView
      style={{position: "absolute", bottom: 0, left: 0}}
      pointerEvents="none"
    >
      <View ref={ref} style={{width: size, height: size}} />
    </SafeAreaView>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};
