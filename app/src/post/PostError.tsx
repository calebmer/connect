import {Color, Font, Icon, Space} from "../atoms";
import React, {useContext} from "react";
import {StyleSheet, Text, View} from "react-native";
import {AppError} from "../api/AppError";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {Route} from "../router/Route";
import {PostID} from "@connect/api-client";
import {PostCache} from "./PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {Button} from "../molecules/Button";

export function PostError({
  route,
  postID,
  error,
  onRetry,
}: {
  route: Route;
  postID: PostID | null;
  error: unknown;
  onRetry: () => void;
}) {
  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  function handleRetry() {
    if (postID !== null) {
      PostCache.forceReload(postID);
      PostCommentsCache.forceReload(postID);
    }
    onRetry();
  }

  return (
    <NavbarScrollView
      route={route}
      title="Error"
      hideNavbar={hideNavbar}
      contentContainerStyle={styles.container}
    >
      <View style={styles.icon}>
        <Icon name="alert-triangle" size={Space.space7} color={Color.red4} />
      </View>
      <Text style={styles.message}>{AppError.displayMessage(error)}</Text>
      <View style={styles.retry}>
        <Button label="Retry" onPress={handleRetry} />
      </View>
    </NavbarScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  icon: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Space.space9,
    marginHorizontal: Space.space3,
  },
  message: {
    marginTop: Space.space4,
    marginBottom: Space.space3,
    marginHorizontal: Space.space3,
    maxWidth: Space.space11,
    textAlign: "center",
    color: Color.grey8,
    ...Font.sans,
    ...Font.size3,
  },
  retry: {
    flexDirection: "row",
  },
});
