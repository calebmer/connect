import {
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import React, {ReactNode, useState} from "react";
import {Color} from "./atoms";
import {NavbarNative} from "./NavbarNative";
import {Route} from "./router/Route";

export function NavbarNativeScrollView({
  route,
  useTitle,
  contentContainerStyle,
  children,
}: {
  route: Route;
  useTitle: () => string;
  contentContainerStyle?: StyleProp<ViewStyle>;
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
        contentContainerStyle={[contentContainerStyle, styles.container]}
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
      leftIcon={route.nativeIsModalRoot() ? "x" : "arrow-left"}
      onLeftIconPress={() => route.pop()}
      hideBackground={hideBackground}
    />
  );
}

const scrollIndicatorInsets = {top: NavbarNative.height};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    paddingTop: NavbarNative.height,
  },
});
