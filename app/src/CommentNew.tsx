import {Font, Space} from "./atoms";
import {Editor} from "./Editor";
import React from "react";
import {View} from "react-native";

export function CommentNew({disabled}: {disabled?: boolean}) {
  return (
    <View>
      <Editor placeholder="Write a comment…" disabled={disabled} />
    </View>
  );
}

CommentNew.minHeight = Font.size3.lineHeight + Space.space3 * 2;
