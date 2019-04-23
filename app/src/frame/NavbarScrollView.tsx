import {Color, IconName} from "../atoms";
import {
  Keyboard,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
} from "react-native";
import React, {useState} from "react";
import {Navbar} from "./Navbar";
import {Route} from "../router/Route";
import {getAdjustedContentInsetTop} from "../utils/getAdjustedContentInset";

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

  // `<Navbar>` props.
  rightIcon?: IconName;
  rightIconDisabled?: boolean;
  onRightIconPress?: () => void;

  /**
   * The content of the scroll view.
   */
  children: React.Node;
}

function NavbarScrollView(
  {
    route,
    useTitle,
    hideNavbar,
    rightIcon,
    rightIconDisabled,
    onRightIconPress,
    children,
    ...props
  }: NavbarScrollViewProps,
  ref: React.Ref<ScrollView>,
) {
  const [hideBackground, setHideBackground] = useState(true);
  const paddingTop = !hideNavbar ? Navbar.height : 0;

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
          rightIcon={rightIcon}
          rightIconDisabled={rightIconDisabled}
          onRightIconPress={onRightIconPress}
        />
      )}
      <ScrollView
        {...props}
        ref={ref}
        style={styles.background}
        contentContainerStyle={[
          props.contentContainerStyle,
          {paddingTop: Platform.OS !== "ios" ? paddingTop : 0},
        ]}
        contentOffset={{
          x: 0,
          y: -paddingTop,
        }}
        contentInset={{
          ...props.contentInset,
          top: paddingTop,
        }}
        scrollEventThrottle={16}
        onScroll={event => {
          setHideBackground(
            event.nativeEvent.contentOffset.y +
              getAdjustedContentInsetTop(event) <=
              0,
          );
          if (props.onScroll) {
            props.onScroll(event);
          }
        }}
      >
        {children}
      </ScrollView>
    </>
  );
}

const _NavbarScrollView = React.forwardRef(NavbarScrollView);
export {_NavbarScrollView as NavbarScrollView};

function NavbarContainer({
  route,
  useTitle,
  hideBackground,
  rightIcon,
  rightIconDisabled,
  onRightIconPress,
}: {
  route: Route;
  useTitle: () => string;
  hideBackground: boolean;
  rightIcon?: IconName;
  rightIconDisabled?: boolean;
  onRightIconPress?: () => void;
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
      rightIcon={rightIcon}
      rightIconDisabled={rightIconDisabled}
      onRightIconPress={onRightIconPress}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
});
