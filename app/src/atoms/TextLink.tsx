import React, {ReactNode} from "react";
import {TouchableOpacity} from "react-native";

export function TextLink({
  onPress,
  children,
}: {
  readonly onPress: () => void;
  readonly children: ReactNode;
}) {
  // TODO
  return <>{children}</>;
  // const _TouchableOpacity = TouchableOpacity as any;
  // return (
  //   // NOTE: `accessibilityRole="link"` is not focusable. Currently using a
  //   // workaround: https://github.com/necolas/react-native-web/issues/1266
  //   <_TouchableOpacity
  //     accessibilityComponentType="a"
  //     accessible={true}
  //     onPress={onPress}
  //   >
  //     {children}
  //   </_TouchableOpacity>
  // );
}
