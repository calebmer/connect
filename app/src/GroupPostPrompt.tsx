import {BodyText, Color, LabelText, Shadow, Space} from "./atoms";
import React, {useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";
import {IconPatch} from "./IconPatch";
import {NewPostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {usePostNewPopupContext} from "./PostNewPopupContext";

export function GroupPostPrompt({
  route,
  groupSlug,
  account,
}: {
  route: Route;
  groupSlug: string;
  account: AccountProfile;
}) {
  const [pressed, setPressed] = useState(false);
  const popup = usePostNewPopupContext();

  return (
    <TouchableWithoutFeedback
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        if (popup.available) {
          popup.show();
        } else {
          route.nativeShowModal(NewPostRoute, {groupSlug});
        }
      }}
    >
      <View style={[styles.container, pressed && styles.containerPressed]}>
        <AccountAvatar account={account} />
        <View style={styles.body}>
          <LabelText>{account.name}</LabelText>
          <BodyText>Start a conversation…</BodyText>
        </View>
        <IconPatch icon="edit" />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingRight: Space.space4,
    padding: Space.space3,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  containerPressed: {
    backgroundColor: Color.yellow0,
  },
  body: {
    flex: 1,
    paddingLeft: Space.space3,
  },
});
