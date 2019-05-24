import {Color, Font, Icon, Space} from "../atoms";
import {StyleSheet, Text, View} from "react-native";
import {AppError} from "../api/AppError";
import {Button} from "../molecules/Button";
import {NavbarScrollView} from "./NavbarScrollView";
import React from "react";
import {Route} from "../router/Route";
import {useGroupHomeLayout} from "../group/useGroupHomeLayout";

export function ErrorScreen({
  route,
  error,
  onRetry,
}: {
  route: Route;
  error: unknown;
  onRetry: () => void;
}) {
  // Hide the navbar when we are using the laptop layout.
  const hideNavbar = useGroupHomeLayout();

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
        <Button label="Retry" onPress={onRetry} />
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
