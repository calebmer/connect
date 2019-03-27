import {
  Animated,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {Color, Font, Icon, IconName, Shadow, Space} from "./atoms";
import React, {useEffect} from "react";
import {useConstant} from "./useConstant";

type NavbarNativeProps = {
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
};

export function NavbarNative({
  title,
  leftIcon,
  onLeftIconPress,
  hideBackground,
  hideTitleWithBackground,
}: NavbarNativeProps) {
  const backgroundOpacity = useConstant(() => {
    return new Animated.Value(hideBackground ? 0 : 1);
  });

  const titleOpacity = hideTitleWithBackground ? backgroundOpacity : undefined;

  useEffect(() => {
    if (hideBackground) {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [backgroundOpacity, hideBackground]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.background, {opacity: backgroundOpacity}]}
      />
      <View style={styles.navbar}>
        <View style={styles.icon}>
          {leftIcon && (
            <TouchableOpacity hitSlop={hitSlop} onPress={onLeftIconPress}>
              <Icon name={leftIcon} size={Space.space4} />
            </TouchableOpacity>
          )}
        </View>
        {title && (
          <Animated.Text
            style={[styles.title, {opacity: titleOpacity}]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
        )}
        <View style={styles.icon} />
      </View>
    </SafeAreaView>
  );
}

NavbarNative.height = Space.space6;

const hitSlop = {
  top: Space.space3,
  bottom: Space.space3,
  left: Space.space3,
  right: Space.space3,
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
    height: NavbarNative.height,
  },
  title: {
    flex: 1,
    color: Color.grey8,
    textAlign: "center",
    ...Font.sans,
    ...Font.size1,
  },
  icon: {
    width: Space.space4,
    marginHorizontal: Space.space3,
  },
});
