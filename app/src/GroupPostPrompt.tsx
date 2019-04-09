import {BodyText, Color, Icon, LabelText, Shadow, Space} from "./atoms";
import React, {useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";
import {NewPostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";

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

  return (
    <TouchableWithoutFeedback
      onPress={() => route.nativeShowModal(NewPostRoute, {groupSlug})}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View style={[styles.container, pressed && styles.containerPressed]}>
        <AccountAvatar account={account} />
        <View style={styles.body}>
          <LabelText>{account.name}</LabelText>
          <BodyText>Start a conversation…</BodyText>
        </View>
        <View style={styles.iconCircle}>
          <Icon style={styles.icon} name="edit" color={Color.yellow8} />
        </View>
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
  iconCircle: {
    width: Space.space5,
    height: Space.space5,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: Space.space5,
    backgroundColor: Color.yellow1,
  },
  icon: {
    position: "relative",
    top: -0.7,
    right: -0.7,
  },
});
