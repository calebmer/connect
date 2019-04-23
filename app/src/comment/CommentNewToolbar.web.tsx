import {Color, Shadow, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import React, {useContext} from "react";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {AccountAvatar} from "../account/AccountAvatar";
import {useCurrentAccount} from "../account/AccountCache";
import {postMaxWidth} from "../post/postMaxWidth";

export function CommentNewToolbar() {
  const isLaptop =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <View style={styles.background}>
      <View style={styles.toolbar}>
        {isLaptop && <CommentNewToolbarAccountAvatar />}
        <CommentNew />
      </View>
    </View>
  );
}

function CommentNewToolbarAccountAvatar() {
  const currentAccount = useCurrentAccount();

  return (
    <View style={styles.avatar}>
      <AccountAvatar account={currentAccount} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
    shadowOffset: {width: 0, height: 2},
  },
  toolbar: {
    flexDirection: "row",
    maxWidth: postMaxWidth + CommentNew.sendButtonWidth,
  },
  avatar: {
    paddingVertical: (CommentNew.minHeight - AccountAvatar.size) / 2,
    paddingLeft: Space.space3,
  },
});
