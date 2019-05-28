import {
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {Color, Font, Icon, IconName, Shadow, Space} from "../atoms";
import React, {useEffect} from "react";
import {IconPatchButton} from "../molecules/IconPatchButton";
import {useAnimatedValue} from "../utils/useAnimatedValue";

type NavbarProps = {
  /**
   * The navbar title. Will be displayed in the center of the navbar. Use this
   * to provide context about the current visible screen.
   */
  title?: string;

  /**
   * The icon to be displayed on the left side of the navbar.
   */
  leftIcon?: IconName;

  /**
   * When the left icon is pressed execute this function. Only works if there
   * is a left icon present.
   */
  onLeftIconPress?: () => void;

  /**
   * The icon to be displayed on the right side of the navbar.
   */
  rightIcon?: IconName;

  /**
   * Is the right icon currently disabled? Providing a true or false value for
   * this prop will change the color to help let the user know that it is an
   * interactive element.
   */
  rightIconDisabled?: boolean;

  /**
   * When the right icon is pressed execute this function. Only works if there
   * is a right icon present.
   */
  onRightIconPress?: () => void;

  /**
   * Should the background of our navbar be hidden to let the content
   * underneath show? We will animate the background into place when this
   * prop changes.
   */
  hideBackground?: boolean;

  /**
   * If `hideBackground` is true should we also hide the title? When
   * `hideBackground` changes to false we will animate the title alongside
   * the background.
   */
  hideTitleWithBackground?: boolean;

  /**
   * Whether or not we should use light content when the background is hidden.
   * This will also affect whether or not the status bar is rendered with light
   * or dark content.
   */
  lightContentWithoutBackground?: boolean;
};

export function Navbar({
  title,
  leftIcon,
  onLeftIconPress,
  rightIcon,
  rightIconDisabled,
  onRightIconPress,
  hideBackground,
  hideTitleWithBackground,
  lightContentWithoutBackground,
}: NavbarProps) {
  const backgroundOpacity = useAnimatedValue(hideBackground ? 0 : 1);

  const titleOpacity = hideTitleWithBackground ? backgroundOpacity : undefined;

  useEffect(() => {
    if (hideBackground) {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    } else {
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [backgroundOpacity, hideBackground]);

  return (
    <>
      <StatusBar
        animated
        barStyle={
          hideBackground && lightContentWithoutBackground
            ? "light-content"
            : "dark-content"
        }
      />
      <SafeAreaView
        style={styles.container}
        accessibilityRole={
          Platform.OS === "web" ? ("navigation" as any) : undefined
        }
      >
        <Animated.View
          style={[styles.background, {opacity: backgroundOpacity}]}
        />
        <View style={styles.navbar}>
          <View style={styles.button}>
            {leftIcon && (
              <TouchableOpacity hitSlop={hitSlop} onPress={onLeftIconPress}>
                <Icon
                  name={leftIcon}
                  size={Space.space4}
                  color={
                    hideBackground && lightContentWithoutBackground
                      ? Color.white
                      : Color.grey7
                  }
                />
              </TouchableOpacity>
            )}
          </View>
          <Animated.Text
            style={[styles.title, {opacity: titleOpacity}]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
          <View style={styles.button}>
            {rightIcon && (
              <IconPatchButton
                icon={rightIcon}
                disabled={rightIconDisabled}
                onPress={onRightIconPress}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

Navbar.height = Space.space6;

const hitSlop = {
  top: Space.space4,
  bottom: Space.space4,
  left: Space.space4,
  right: Space.space4,
};

const styles = StyleSheet.create({
  container: {
    zIndex: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  background: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Color.white,
    ...Shadow.elevation1,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: Navbar.height,
  },
  title: {
    flex: 1,
    color: Color.grey8,
    textAlign: "center",
    ...Font.sans,
    ...Font.size1,
  },
  button: {
    width: Space.space4,
    marginHorizontal: Space.space3,
  },
});
