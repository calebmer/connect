import {Color, Space} from "../atoms";
import {Editor, EditorInstance} from "../editor/Editor";
import {Keyboard, Platform, StyleSheet, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {GroupCache} from "../group/GroupCache";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostNewHeader} from "./PostNewHeader";
import {PostRoute} from "../router/AllRoutes";
import {Route} from "../router/Route";
import {publishPost} from "./PostCache";
import {useCache} from "../cache/Cache";
import {useCurrentAccount} from "../account/AccountCache";
import {useKeyboardHeight} from "../utils/useKeyboardHeight";

export function PostNewMobile({
  route,
  groupSlug,
  lastRoute,
}: {
  route: Route;
  groupSlug: string;
  lastRoute?: Route;
}) {
  // Fetch our current account and suspend this component. We want to suspend
  // in the component where we add the auto-focus effect. Otherwise the focus
  // will be a noop since the component is only “shadow mounted”.
  const currentAccount = useCurrentAccount();
  const group = useCache(GroupCache, groupSlug);

  // Get an instance to our editor.
  const editor = useRef<EditorInstance>(null);

  // Focus our editor when the component mounts!
  useEffect(() => {
    if (editor.current) {
      editor.current.focus();
    }
  }, []);

  // Is the send button in our navbar enabled?
  const [sendEnabled, setSendEnabled] = useState(false);

  // When entering new content in a `UITextView`, iOS will scroll any parent
  // `UIScrollView` down as the text view grows. We want to make sure that iOS
  // scrolls all the way to the bottom of our content (which includes some
  // padding). `paddingBottom` on `<PostEditorInput>` won’t be respected, but
  // inset on the scroll view will be respected. So do that.
  const contentInsetHack = Platform.OS === "ios";

  function handleSend() {
    if (editor.current) {
      // Get the post content from the editor.
      const content = editor.current.getContent();

      // Publish the post using a utility function which will insert into all
      // the right caches.
      const postID = publishPost({
        authorID: currentAccount.id,
        groupID: group.id,
        content,
      });

      // Dismiss the keyboard since we are done editing, yay!
      Keyboard.dismiss();

      // Navigate us to the new post route...
      if (Platform.OS === "web") {
        // On web, the most effective way to replace the route is to
        // call `webReplace()`. Calling `pop()` then `push()` has some
        // odd behaviors.
        route.webReplace(PostRoute, {groupSlug, postID});
      } else {
        // On native, we want to display the animations of first popping our
        // editor and then pushing the post route.
        //
        // Because of our native navigation implementation, we can’t use our
        // current `route` to push a new route after we’ve popped. We need the
        // previous route object to do that.
        route.pop();
        if (lastRoute) {
          lastRoute.push(PostRoute, {groupSlug, postID});
        }
      }
    }
  }

  return (
    <>
      <NavbarScrollView
        route={route}
        contentContainerStyle={styles.container}
        title="New Post"
        rightIcon="send"
        rightIconDisabled={!sendEnabled}
        onRightIconPress={handleSend}
        keyboardShouldPersistTaps="always"
        // Add some inset to the bottom of our scroll view which will replace
        // our padding.
        contentInset={contentInsetHack ? {bottom: Space.space3} : undefined}
      >
        <PostNewHeader currentAccount={currentAccount} />
        <Editor
          ref={editor}
          large
          placeholder="Start a conversation…"
          onChange={({isWhitespaceOnly}) => setSendEnabled(!isWhitespaceOnly)}
        />
        {contentInsetHack && (
          // Use negative margin since we add padding to the scroll view in the
          // form of content inset.
          <View style={{marginBottom: -Space.space3}} />
        )}
      </NavbarScrollView>

      {/* Fill the space behind the keyboard so that the keyboard does not hide
          any content. */}
      <View
        style={{
          height: useKeyboardHeight(),
          backgroundColor: Color.white,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    // Setting `flex: 1` on iOS gives us a scroll bar, so we don’t bother.
    flex: Platform.OS === "web" ? 1 : undefined,
  },
});
