import {LabelText, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import React from "react";
import {Route} from "./router/Route";
import {useCurrentAccount} from "./cache/AccountCache";

export function PostCreate({route}: {route: Route}) {
  const currentAccount = useCurrentAccount();

  return (
    <NavbarNativeScrollView
      contentContainerStyle={styles.container}
      route={route}
      useTitle={() => "New Post"}
    >
      <View style={styles.header}>
        <AccountAvatar account={currentAccount} />
        <View style={styles.byline}>
          <LabelText>{currentAccount.name}</LabelText>
        </View>
      </View>
    </NavbarNativeScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Space.space3,
  },
  header: {
    flexDirection: "row",
  },
  byline: {
    paddingLeft: Space.space3,
  },
});
