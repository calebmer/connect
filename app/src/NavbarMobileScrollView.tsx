import {
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from "react-native";
import React, {useState} from "react";
import {Color} from "./atoms";
import {NavbarMobile} from "./NavbarMobile";
import {Route} from "./router/Route";

interface NavbarMobileScrollViewProps extends ScrollViewProps {
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
  children: React.Node;
}

export function NavbarMobileScrollView({
  route,
  useTitle,
  children,
  ...props
}: NavbarMobileScrollViewProps) {
  const [hideBackground, setHideBackground] = useState(true);

  return (
    <>
      {Platform.OS !== "web" && (
        // NOTE: This component might suspend when we call `useTitle()`. We
        // won’t even render the navbar on web so let’s avoid loading that data
        // if we aren’t on the web platform.
        <NavbarMobileContainer
          route={route}
          useTitle={useTitle}
          hideBackground={hideBackground}
        />
      )}
      <ScrollView
        {...props}
        style={styles.background}
        contentContainerStyle={[props.contentContainerStyle, styles.container]}
        scrollIndicatorInsets={{top: NavbarMobile.height, bottom: 0}}
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

function NavbarMobileContainer({
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
    <NavbarMobile
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

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    // Override all padding provided by the `contentContainerStyle` prop.
    paddingBottom: 0,
    paddingTop: NavbarMobile.height,
    paddingLeft: 0,
    paddingRight: 0,
  },
});
