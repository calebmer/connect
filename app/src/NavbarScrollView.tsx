import {Keyboard, ScrollView, ScrollViewProps, StyleSheet} from "react-native";
import React, {useState} from "react";
import {Color} from "./atoms";
import {Navbar} from "./Navbar";
import {Route} from "./router/Route";

interface NavbarScrollViewProps extends ScrollViewProps {
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
   * Should we hide the navbar? This will make the component act like a regular
   * scroll view.
   */
  hideNavbar?: boolean;

  /**
   * The content of the scroll view.
   */
  children: React.Node;
}

export function NavbarScrollView({
  route,
  useTitle,
  hideNavbar,
  children,
  ...props
}: NavbarScrollViewProps) {
  const [hideBackground, setHideBackground] = useState(true);

  return (
    <>
      {!hideNavbar && (
        // NOTE: This component might suspend when we call `useTitle()`. We
        // won’t even render the navbar on web so let’s avoid loading that data
        // if we aren’t on the web platform.
        <NavbarContainer
          route={route}
          useTitle={useTitle}
          hideBackground={hideBackground}
        />
      )}
      <ScrollView
        {...props}
        style={styles.background}
        contentContainerStyle={[
          props.contentContainerStyle,
          styles.container,
          hideNavbar && styles.containerHideNavbar,
        ]}
        scrollIndicatorInsets={{top: !hideNavbar ? Navbar.height : 0}}
        scrollEventThrottle={16}
        onScroll={event => {
          setHideBackground(event.nativeEvent.contentOffset.y <= 0);
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}

function NavbarContainer({
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
    <Navbar
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
    paddingTop: Navbar.height,
    paddingLeft: 0,
    paddingRight: 0,
  },
  containerHideNavbar: {
    paddingTop: 0,
  },
});