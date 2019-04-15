import {Color, Icon, IconName, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import React from "react";

export function ButtonIcon({
  icon,
  theme = "primary",
}: {
  icon: IconName;
  theme?: "primary" | "disabled";
}) {
  return (
    <View
      style={[
        styles.container,
        {backgroundColor: themeColors[theme].backgroundColor},
      ]}
    >
      <Icon
        style={[
          icon === "edit" && styles.iconEdit,
          icon === "send" && styles.iconSend,
        ]}
        name={icon}
        color={themeColors[theme].iconColor}
      />
    </View>
  );
}

const themeColors = {
  primary: {
    backgroundColor: Color.yellow1,
    iconColor: Color.yellow8,
  },
  disabled: {
    backgroundColor: "hsl(0, 0%, 95%)", // `Color.grey0` is too light and `Color.grey1` is too dark
    iconColor: Color.grey4,
  },
};

ButtonIcon.size = Space.space5;

const styles = StyleSheet.create({
  container: {
    width: ButtonIcon.size,
    height: ButtonIcon.size,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: ButtonIcon.size / 2,
  },
  iconEdit: {
    position: "relative",
    top: -0.7,
    right: -0.7,
  },
  iconSend: {
    position: "relative",
    top: 0.5,
    right: 0.5,
  },
});
