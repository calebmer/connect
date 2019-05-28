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

export interface NavbarLayoutProps {
  /**
   * The current route which we can use for navigation.
   */
  route: Route | null;

  /**
   * The title to be rendered in our navbar.
   */
  title: string;

  /**
   * Should we hide the navbar? This will make the component act like a regular
   * scroll view.
   */
  hideNavbar?: boolean;

  // `<Navbar>` props.
  rightIcon?: IconName;
  rightIconDisabled?: boolean;
  onRightIconPress?: () => void;
}

/**
 * Creates a new `NavbarLayout` component using the provided component which has
 * an interface compatible with a scroll view.
 */
function create<Props extends ScrollViewProps>(
  ScrollViewComponent: React.ComponentType<Props>,
) {
  /**
   * A navbar layout is one where a navbar overlaps a scroll view and the navbar
   * hides or shows depending on where the user has scrolled.
   */
  function NavbarLayout(
    {
      route,
      title,
      hideNavbar,
      rightIcon,
      rightIconDisabled,
      onRightIconPress,
      ..._props
    }: NavbarLayoutProps & Props,
    ref: React.Ref<ScrollView>,
  ) {
    // Unsafely cast to `Props`.
    const props = (_props as {}) as Props;

    // Is our navbar’s background hidden? When this changes the navbar
    // background will animate in and out of view.
    const [hideBackground, setHideBackground] = useState(true);

    // Space we add underneath the scroll view for our navbar.
    const paddingTop = !hideNavbar ? Navbar.height : 0;

    return (
      <>
        {!hideNavbar && (
          <Navbar
            title={title}
            hideBackground={hideBackground}
            leftIcon={route && route.nativeIsModalRoot() ? "x" : "arrow-left"}
            onLeftIconPress={() => {
              // Dismiss the keyboard when navigating backwards since any
              // component with focus will be unmounted.
              Keyboard.dismiss();

              if (route) route.pop();
            }}
            rightIcon={rightIcon}
            rightIconDisabled={rightIconDisabled}
            onRightIconPress={onRightIconPress}
          />
        )}
        <ScrollViewComponent
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
            const adjustedContentOffsetY =
              event.nativeEvent.contentOffset.y +
              getAdjustedContentInsetTop(event);
            setHideBackground(adjustedContentOffsetY <= 10);

            if (props.onScroll) {
              props.onScroll(event);
            }
          }}
        />
      </>
    );
  }

  return React.forwardRef(NavbarLayout);
}

export const NavbarLayout = {
  create,
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
});
