import {Platform, TouchableOpacity} from "react-native";
import React, {ReactNode} from "react";

const hitSlop = {
  top: 5,
  bottom: 5,
  left: 5,
  right: 5,
};

export function TextLink({
  onPress,
  children,
}: {
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  if (Platform.OS === "web") {
    const _TouchableOpacity = TouchableOpacity as any;
    return (
      // NOTE: `accessibilityRole="link"` is not focusable. Currently using a
      // workaround: https://github.com/necolas/react-native-web/issues/1266
      <_TouchableOpacity
        accessibilityComponentType="a"
        accessible={true}
        onPress={onPress}
      >
        {children}
      </_TouchableOpacity>
    );
  } else {
    return (
      <TouchableOpacity hitSlop={hitSlop} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
}
