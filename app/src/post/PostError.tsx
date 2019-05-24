import {Color, Font, Icon, Space} from "../atoms";
import React, {useContext} from "react";
import {StyleSheet, Text, View} from "react-native";
import {AppError} from "../api/AppError";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {Route} from "../router/Route";

export function PostError({route, error}: {route: Route; error: unknown}) {
  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <NavbarScrollView route={route} title="Error" hideNavbar={hideNavbar}>
      <View style={styles.container}>
        <View style={styles.icon}>
          <Icon name="alert-triangle" size={Space.space7} color={Color.red4} />
        </View>
        <Text style={styles.message}>{AppError.displayMessage(error)}</Text>
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
    marginHorizontal: Space.space3,
    maxWidth: Space.space11,
    textAlign: "center",
    color: Color.grey8,
    ...Font.sans,
    ...Font.size3,
  },
});
