import {Color, Shadow} from "../atoms";
import React, {useContext} from "react";
import {StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {postMaxWidth} from "../post/postMaxWidth";

export function CommentNewToolbar() {
  const isLaptop =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;
  return (
    <View
      style={[
        styles.background,
        isLaptop ? styles.backgroundLaptop : styles.backgroundMobile,
      ]}
    >
      <View style={styles.toolbar}>
        <CommentNew />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Color.white,
  },
  backgroundMobile: {
    ...Shadow.elevation2,
    shadowOffset: {width: 0, height: 2},
  },
  backgroundLaptop: {
    ...Shadow.elevation1,
    shadowOffset: {width: 0, height: 1},
  },
  toolbar: {
    maxWidth: postMaxWidth,
  },
});
