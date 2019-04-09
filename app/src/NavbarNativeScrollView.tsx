import {Keyboard, Platform, ScrollView, StyleSheet} from "react-native";
import React, {ReactNode, useState} from "react";
import {Color} from "./atoms";
import {NavbarNative} from "./NavbarNative";
import {Route} from "./router/Route";

export function NavbarNativeScrollView({
  route,
  useTitle,
  children,
}: {
  /**
   * The current route which we can use for navigation.
   */
  route: Route;

  /**
   * A hook which will fetch our navbar’s title. We accept this prop as a hook
   * so that it can do data fetching or use subscriptions. This must be a hook
   * because it is called conditionally. (It’s not called on web, for instance.)
   */
  useTitle: () => string;

  /**
   * The content of the scroll view.
   */
  children: ReactNode;
}) {
  const [hideBackground, setHideBackground] = useState(true);

  return (
    <>
      {Platform.OS !== "web" && (
        // NOTE: This component might suspend when we call `useTitle()`. We
        // won’t even render the navbar on web so let’s avoid loading that data
        // if we aren’t on the web platform.
        <NavbarNativeContainer
          route={route}
          useTitle={useTitle}
          hideBackground={hideBackground}
        />
      )}
      <ScrollView
        style={styles.background}
        contentContainerStyle={styles.container}
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={16}
        onScroll={event => {
          if (Platform.OS !== "web") {
            setHideBackground(event.nativeEvent.contentOffset.y <= 0);
          }
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}

function NavbarNativeContainer({
  route,
  useTitle,
  hideBackground,
}: {
  route: Route;
  useTitle: () => string;
  hideBackground: boolean;
}) {
  const title = useTitle();
  return (
    <NavbarNative
      title={title}
      hideBackground={hideBackground}
      leftIcon={route.nativeIsModalRoot() ? "x" : "arrow-left"}
      onLeftIconPress={() => {
        // Dismiss the keyboard when navigating backwards since any component
        // with focus will be unmounted.
        Keyboard.dismiss();

        route.pop();
      }}
    />
  );
}

const scrollIndicatorInsets = {top: NavbarNative.height, bottom: 0};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    paddingTop: NavbarNative.height,
  },
});
